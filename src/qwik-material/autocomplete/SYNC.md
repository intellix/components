# qwik-material/autocomplete sync log

Tracks the sync state between this port and `src/material/autocomplete/` +
`src/material/core/option/` upstream. See also
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`.
`MatOption`/`MatOptgroup` themselves live in `qwik-material/core` (shared
with `qwik-material/select`) — see that package's own `SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
|------|---------------|------------|-------|
| `scss/autocomplete/autocomplete.scss` | `src/material/autocomplete/autocomplete.scss` | synced | cdk-stub swap only (`@use '@angular/cdk'` → `@use '../cdk-stub' as cdk`, used for `cdk.high-contrast`) |
| `scss/autocomplete/_m2-autocomplete.scss` | `src/material/autocomplete/_m2-autocomplete.scss` | synced | byte-identical |
| `scss/autocomplete/_m3-autocomplete.scss` | `src/material/autocomplete/_m3-autocomplete.scss` | synced | byte-identical |
| `scss/autocomplete/_autocomplete-theme.scss` | `src/material/autocomplete/_autocomplete-theme.scss` | synced | byte-identical, not referenced by the prebuilt CSS (same as every other `*-theme.scss`) |
| `scss/autocomplete/autocomplete-prebuilt.scss` | n/a | new | `@use './autocomplete'` only — every `--mat-autocomplete-*` token already has a real fallback baked in via `token-utils.slot(..., $fallbacks)`, same "no `:root` overrides needed" situation as `select-prebuilt.scss`'s |

## Mapped TypeScript/TSX files

Not a 1:1 file mapping — upstream splits `MatAutocomplete` (`autocomplete.ts`)
and `MatAutocompleteTrigger` (`autocomplete-trigger.ts`, the
`input[matAutocomplete]` directive) across two files/classes. This port
instead follows `qwik-material/select`'s OWN precedent of collapsing
"the trigger" and "the panel owner" into ONE monolithic component — see
"Public API" below for why that's even MORE necessary here than for select.

- `mat-autocomplete.tsx` ← `MatAutocomplete` + `MatAutocompleteTrigger`,
  COMBINED: renders the native `<input>` (mirrors `MatInput`'s own
  rendering for the pieces this control needs — classes, `value`/
  `readonly` attribute-spread trick, `aria-describedby` via
  `MAT_FORM_FIELD_CONTROL_STATE`) PLUS the trigger's own role/aria host
  bindings, PLUS the permanently-empty `<mat-autocomplete>` placeholder,
  as a single `component$` returning a `<>Fragment</>` of both elements.
- `mat-autocomplete-panel.tsx` ← `autocomplete.html`'s `<ng-template>`
  content (the `.mat-mdc-autocomplete-panel` listbox + projected
  `<mat-option>`/`<mat-optgroup>`) — the component `MatAutocomplete`
  attaches to its overlay via `overlay.create()`, same shape as
  `qwik-material/select`'s `MatSelectPanel`.
- `autocomplete-runtime.ts` ← `MatAutocompleteTrigger`'s
  `openPanel()`/`closePanel()`/`_handleKeydown()`/`_handleInput()`/
  `_handleFocus()`/`_handleClick()`/`_setValueAndClose()`/
  `_resetActiveItem()`, with `MatAutocomplete.showPanel`/`_skipPredicate()`
  folded in — free (non-closure) functions, same rationale as
  `qwik-material/select/select-runtime.ts`'s own module doc comment.
- `autocomplete-option-resolver.ts` ← the data-shaping half of what
  upstream's `@ContentChildren(MatOption, {descendants: true})` QueryList
  gives it for free — see "The `options` prop" below for why this file's
  id-stability mechanism is genuinely different from select's.
- `autocomplete-config.ts` ← `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` +
  `MatAutocompleteDefaultOptions` (renamed `MatAutocompleteConfig` for this
  port's own naming convention, matching `MatSelectConfig`).

## Public API

```tsx
<MatFormField
  label={<MatLabel>Fruit</MatLabel>}
  control={
    <MatAutocomplete
      value={value.value}
      onValueChange$={(v) => (value.value = v as string)}
      options={filteredFruits}
      onInput$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
      onFocus$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
    />
  }
/>
```

### Why `MatAutocomplete` is ONE monolithic component, not a directive-on-`MatInput`

Upstream genuinely layers TWO independent Angular directives onto the SAME
native `<input>` (`matInput` providing `MatFormFieldControl`, `matAutocomplete`
providing the combobox behavior), plus a THIRD, separate `<mat-autocomplete>`
component declared as a plain sibling. Design doc rule 4 ("no extra wrapper
elements") doesn't by itself force a monolith here — the real reason is
`qwik-material/form-field`'s own `<MatFormField>`: it has **no** `<Slot>`-based
children mechanism at all (`mat-form-field.tsx`'s `.mat-mdc-form-field-infix`
div renders exactly `{labelContent}{controlSnapshot.value}` — the control's
own rendered output and nothing else), so there is nowhere for a THIRD
sibling element to be declared independently inside the infix the way
Angular's template can. Since `MatAutocomplete`'s render output is read
directly as `control`'s JSX descriptor, and a `component$` is free to return
a `<>Fragment</>` of several top-level siblings, `MatAutocomplete` renders
`<>{<input .../>}{<mat-autocomplete /></>}</>` itself — the empty placeholder
lands as the infix's LAST child, directly after the input, matching the
contract. Nothing is *wrapped*; both elements are genuine, independent DOM
siblings, exactly as upstream renders them.

### The `options` prop — MUST be a live `Signal`, not a plain array

This is the single biggest architectural difference from
`qwik-material/select`, and the thing most worth reading before touching
this port.

`qwik-material/select`'s `options` is plain data, read **once** — select's
own SYNC.md documents at length why a consumer-facing `options` prop can't
be an array of `<MatOption>` JSX *descriptors* (a `.type`-embedded-component
serialization hazard across the `$()` boundary), landing on a plain-data
shape instead. That half of the reasoning still applies here identically —
`autocomplete-option-resolver.ts`'s `MatAutocompleteOptionDef`/
`MatAutocompleteGroupDef` are the same kind of plain-data shape select's
`MatSelectOptionDef`/`MatSelectGroupDef` are.

But autocomplete's `options` **must also stay genuinely reactive after
mount** — every one of this port's 8 scenarios refilters the option list on
every keystroke, while the SAME overlay session stays open. Select never
needed this (its own options never change after mount), which is exactly
why select could get away with reading `props.options` as a plain prop. For
autocomplete, that doesn't work: `<MatFormField control={...}>` reads its
`control` prop's JSX descriptor **exactly once**
(`mat-form-field.tsx`'s `controlSnapshot = useSignal(() => props.control)`,
documented there as a deliberate fix for a real Qwik 1.20 core crash —
freezing the *reference*, not just the nested prop values). Confirmed live:
with `options` as a plain array prop, typing into the field never refiltered
the already-open panel at all — the consumer's route re-rendered with a
fresh `filteredFruits` array every keystroke, but `MatAutocomplete` never
saw it, because `MatFormField` never looks at `props.control` again after
its own first render.

The fix: `options` is typed `Signal<ReadonlyArray<MatAutocompleteEntryDef>>`,
and the consumer passes the **signal itself** (`options={filteredFruits}`,
never `options={filteredFruits.value}`). The frozen `control` snapshot still
only ever points at the same `<MatAutocomplete options={thatSignal} .../>`
descriptor — but `thatSignal` is the exact same live, mutable `Signal`
object the consumer keeps writing to forever after. Reading `.value` off it
(in `MatAutocomplete`'s own render body, inside its `useTask$`, and inside
every one of its `$()` handlers) always sees the CURRENT value, completely
unaffected by the outer props snapshot being stale — the identical "pass the
Signal itself" trick `select-runtime.ts`'s `value`/`activeIndex` signals
already use for `MatSelectPanel`, just applied one level further out (to a
component's OWN incoming prop, not a child it creates itself).

### Id stability across a refilter — a different mechanism from select's

Select's `select-option-resolver.ts` resolves `options` exactly ONCE
(`useSignal(() => resolveSelectOptions(...))`) and is explicit that this
memoization is **load-bearing**, not an optimization — a `useIdGenerator()`
call made directly in a render body both reads and writes the shared,
reactive `ID_GENERATOR_COUNTER` context signal, which (if not memoized)
causes an infinite reactive re-render loop (see that file's own doc comment
for the full post-mortem, including a real hung-browser repro).

Autocomplete can't memoize the WHOLE resolution the same way — `options`
must re-resolve on every genuine change. `autocomplete-option-resolver.ts`'s
`resolveAutocompleteOptions()` therefore:

1. Is called fresh every time (render body, the reactive `useTask$`, and
   every `$()` handler re-resolve independently) — cheap, since option
   lists here are tiny and this does no DOM work.
2. Never touches the shared, reactive id-generator counter at all. It uses
   a **module-level, non-reactive** `createIdGenerator()` singleton
   (`autocompleteOptionIdGen` in `mat-autocomplete.tsx`) — the exact same
   "simplified singleton" pattern `core/mat-option.tsx`'s own
   `fallbackIdGen` already establishes, module-scoped so ids stay unique
   document-wide across multiple `<MatAutocomplete>` instances. This
   sidesteps the infinite-loop hazard entirely: nothing about this id
   source is a Qwik signal, so calling it from a tracked render context has
   no reactive side effect to loop on.
3. Keeps id STABILITY across a refilter via a per-instance
   `idCache: Map<string, string>` (`ensureIdCache()`'s lazily-created,
   `noSerialize()`-wrapped Map), keyed by each entry's resolved identity
   (`def.id` if given, else `def.key`, else `String(value)` for a
   primitive, else `label`). A value whose key is already in the cache
   reuses its id; a genuinely new key mints a fresh one and remembers it.
   This reproduces Angular's own `@for (… track fruit)` id stability
   (`MatOption`'s id is a constructor-time field that can't change for the
   life of that instance; `track` keeps the SAME instance alive across a
   refilter that still includes that value) without needing per-item
   component-instance tricks. See `autocomplete-option-resolver.spec.ts`
   for tests pinning this behavior directly, including the one case that
   matters for `display-with`: an object-valued option is tracked by its
   resolved `key`/`label`, not by its own object identity (a fresh
   `.filter()`/`.map()` array never preserves that anyway).

Since this `idCache` is per-component-instance and never shared with
select's own id sequence, `mat-option-N`/`mat-optgroup-label-N` digits here
are independent of select's — harmless, since the parity harness squashes
every id's digits regardless (only the `prefix-N` SHAPE has to match).

### `displayWith$` and why the runtime has one real `await`

`[displayWith]` is a plain `(value: any) => string` function upstream;
ported as `displayWith$?: QRL<(value: unknown) => string>`. Calling a QRL
is Awaited — `selectAutocompleteOption()` (`autocomplete-runtime.ts`) is
therefore the one function in this port's runtime that's genuinely
`async`, though for the (far more common) no-`displayWith` scenarios the
ternary short-circuits and the function still runs to completion
synchronously, with no actual suspension point — load-bearing for the
focus/close ordering below.

### Why `focus()` runs BEFORE `closePanel()`, not after, when selecting an option

The single trickiest bug this port hit, confirmed live against the real
Angular app with a battery of instrumented reproductions (event listeners,
`MutationObserver`, and a monkey-patched `browser.newContext` that attaches
console/DOM listeners to the harness's OWN pages) — worth recording in full
because the fix is a one-line reorder that's easy to "clean up" back into a
bug.

Clicking a `<mat-option>` (which, on BOTH sides, carries no `tabindex`)
still genuinely **blurs the input** first — this is ordinary browser
behavior for a `mousedown` on any non-focusable element, confirmed live on
the real Angular app too (`document.activeElement` briefly becomes nothing
trackable). Upstream's own `_setValueAndClose()` therefore calls
`this._element.nativeElement.focus()` as a REAL, necessary re-focus, not
the no-op some of this port's own earlier analysis assumed. That re-focus
is a genuine new `focus` event, and `_handleFocus()` has no "already open"
guard at all (`_canOpenOnNextFocus` is unrelated — it's gated by a
*window*-blur handler, not the input's own blur) — so the re-focus
synchronously calls `_attachOverlay()` again, re-attaching the SAME
(already-detached-by-nothing-yet) `OverlayRef`. Upstream's `_setValueAndClose`
then calls `this.closePanel()` **after** that `.focus()` call — so the
spurious reopen is immediately the thing that gets closed, all within one
synchronous call stack, before the browser ever paints. The FINAL settled
state is correctly closed.

This port's `selectAutocompleteOption()` mirrors that exact order:
`inputEl?.focus()` is called BEFORE `detachOverlay(signals)`. Reversing it
(detach, then focus — the more "obviously correct-looking" order) was
tried first and reproduced the bug precisely: the refocus-triggered reopen
ran AFTER the close, leaving the panel stuck open (confirmed live: 2 live
`.mat-mdc-autocomplete-panel` elements existed simultaneously, and
`aria-expanded` never returned to `"false"`) on every scenario that selects
by CLICKING an option (`optgroups`, `require-selection`,
`hide-single-selection-indicator`) — scenarios that select via Enter
(`auto-active-first-option`, `display-with`) never hit it, since Enter
never blurs the input in the first place.

### Why `onValueChange$` is suppressed while typing under `requireSelection`

Mirrors upstream `_handleInput`'s own guard exactly
(`if (!requireSelection) this._onChange(value)`) — see
`src/dev-app/qwik-parity/autocomplete.ts`'s CRITICAL GOTCHA note. With
`requireSelection`, the "model" value stays frozen at whatever the last
real selection/reset committed while the user types; only a genuine
selection or the reset-on-invalid-close path calls `onValueChange$` at all.
Every scenario here wires its OWN filtering through `onInput$`/`onFocus$`
(never `onValueChange$`), so this distinction only affects a
consumer-rendered "Value: …" display.

A second, easy-to-miss consequence: for the 6 scenarios WITHOUT
`requireSelection`, the Angular mirror wires filtering through
`(ngModelChange)`, not raw `(input)` — and `(ngModelChange)` fires on
EVERY invocation of the CVA's `_onChange`, including the selection-commit
path (`_setValueAndClose`'s own `_onChange(toSelect.value)`), not just raw
typing. Confirmed live: selecting "Banana" immediately narrows Angular's
own `filteredFruits` down to `['Banana']`, **before the panel even
closes** — which is what makes a subsequent reopen correctly show just the
one (selected, highlighted) option instead of the stale three-item list
from the last keystroke. This port's dev-app routes reproduce that by also
calling the filter function from inside `onValueChange$`
(`onValueChange$={v => { fc.markAsDirty$(); value.value = v; filteredFruits.value = filterFruits(v); }}`)
for every scenario except `require-selection` (which, matching upstream,
wires filtering through `onInput$` ONLY — `(input)` never fires on a
selection commit, so no refiltering happens there either, matching
Angular's own behavior exactly).

### Why the `requireSelection` reset-on-close ALSO updates `formField`/`emptySignal` directly

For a genuine outside click (`require-selection`'s last step), the native
blur (moving focus away from the input) fires BEFORE the click event that
ultimately triggers the reset — standard browser event order. `handleBlur$`
has therefore already run and already computed `shouldLabelFloat` from
whatever the input's value was AT THAT MOMENT (still the stale,
about-to-be-discarded "zzz", not empty). Left alone, the label would
incorrectly stay floated. `closeAutocompletePanelWithResetCheck()`
therefore recomputes `empty`/`shouldLabelFloat` itself, in its own reset
branch, from the (already-false, since blur already ran) `formField.focused`
and the NEW empty value — the one update `handleBlur$` can't retroactively
make. See that function's own doc comment for the full write-up.

## Deviations from upstream

- **`inputAriaLabel` prop added (2026-10-31, examples port).** The real `<input>` rendered by
  `MatAutocomplete` had no way to carry a plain, native `aria-label` attribute — the existing
  `'aria-label'` prop is reserved for the SEPARATE `<mat-autocomplete>` panel's own
  `@Input aria-label` (upstream `autocomplete.ts`), and `MatAutocompleteTrigger` (the directive
  that actually attaches to the input) has no `aria-label` input of its own at all; a consumer's
  `<input matInput [matAutocomplete]="auto" aria-label="…">` is just a plain, untouched native
  attribute. Needed to port material.angular.dev's `autocomplete-simple` docs example verbatim
  (`aria-label="Number"` on the input). Purely additive; forwarded onto the `<input>` next to
  `placeholder`/`name`/`type`.
- **No `autoSelectActiveOption`.** Accepted on `MatAutocompleteConfig` for
  API parity but not wired — no scenario sets it, and it would need the
  `_pendingAutoselectedOption`/`_valueBeforeAutoSelection` machinery this
  port doesn't otherwise need.
- **No `matAutocompleteDisabled`/`matAutocompletePosition`/
  `matAutocompleteConnectedTo`.** Not exercised by any scenario; the
  contract's own header explicitly scopes these out ("not exercised below,
  to keep the scenario count focused").
- **No "deselect if typed text no longer matches the selected option's
  display" check** (upstream's `_handleInput`'s own mid-typing cleanup).
  Every one of this port's 8 scenarios either has `requireSelection` set
  (where upstream skips this branch entirely anyway) or never types again
  after a selection without first reopening (which already re-filters/
  re-renders the panel from scratch) — see `handleAutocompleteInput`'s own
  doc comment.
- **No resize-on-reattach.** Upstream's `_attachOverlay`'s "already have an
  overlay" branch also calls `this._positionStrategy.setOrigin(...)` +
  `overlayRef.updateSize(...)` on every subsequent open/refilter; this port's
  `openAutocompletePanel`/`syncAutocompleteOptions` only refresh the live
  option tree, never resize or reposition after the first attach. No
  scenario changes viewport size or needs a mid-session resize.
- **`compareWith` is always strict `===`.** Same deviation
  `qwik-material/select`'s own SYNC.md documents, for the same reason
  (every value in every scenario is either a primitive or a stable object
  reference threaded straight through).
- **No real `AriaDescriber`.** Not needed — `MatAutocomplete` never renders
  one upstream either.
- **Key manager has no typeahead/Home/End/PageUp/PageDown.** Mirrors
  upstream exactly — `MatAutocomplete._keyManager` only calls
  `.withWrap()`; typed characters flow into the native input as filtering
  text, never as a separate typeahead buffer the way `mat-select`'s own
  key manager uses one.

## Shared `qwik-material/core`/`qwik-material/form-field` changes this port needed

- **`core/mat-option.tsx`: new `echoValueAttr?: boolean` prop (default `true`).**
  `MatOption.value`'s own doc comment already documented that whether
  `value` is echoed as a literal DOM attribute depends entirely on how the
  CONSUMING template wrote the binding (static/bracket-less vs. a bound
  `[value]`) — `qwik-material/select`'s own scenarios are ALWAYS static, so
  it never needed to make this configurable. This port's own 8 scenarios
  are a genuine MIX, confirmed live against the real Angular app: 7 of 8
  bind `[value]="fruit"` (never reflected as an attribute), while
  `disabled-option` alone uses the static form (`<mat-option
  value="Apple">`, a real attribute). `autocomplete-option-resolver.ts`'s
  own `MatAutocompleteOptionDef.echoValueAttr` (default `false`, since most
  scenarios here are bound) threads this through per-option;
  `disabled-option`'s dev-app route passes `echoValueAttr: true` on every
  option. Purely additive — `select`'s own usage never sets `echoValueAttr`,
  so it keeps its existing default-`true` behavior unaffected.
- **`core/mat-form-field-control.ts`: new `MatFormFieldControlState.floatOverride: boolean`
  field (default `false`).** Mirrors upstream `MatFormField._shouldAlwaysFloat()`'s
  manual-override half — `MatAutocompleteTrigger._floatLabel()`/
  `_resetLabel()` force the form field's label to stay floated for as long
  as the panel is attached, independent of the form field's own
  `floatLabel` setting. Confirmed live: while the autocomplete panel is
  open, the REAL Angular DOM has `mat-mdc-form-field-label-always-float` on
  `<mat-form-field>` — this isn't just a "floated or not" visual detail,
  the literal override CLASS itself is part of the compared DOM. No
  existing control (`MatInput`/`MatSelect`) ever sets this field, so it's
  a no-op for them (`alwaysFloatNow = alwaysFloat || controlState.floatOverride`
  in `mat-form-field.tsx`, replacing the old bare `alwaysFloat` in both the
  host-classes computation and the outline-notch-width task).
  `MatAutocomplete` drives it directly off its own `overlayAttached` signal
  (a guarded write in its render body, same pattern as every other
  context-store write in this file) — never off `showPanel`/the derived
  `panelOpen`, matching upstream's `_overlayAttached`-driven timing exactly
  (the override stays set even while the panel is attached-but-hidden,
  e.g. `require-selection`'s zero-match "zzz" step).
- **`qwik-cdk/overlay`'s `'inline'` popover location, same mechanism
  `qwik-material/select` already established** (`withPopoverLocation`/
  `withPopoverInsertionOrigin`) — this port is simply the second consumer,
  with ONE genuine simplification over select: no "sticky origin"
  first-open-vs-later-open distinction. `MatAutocompleteTrigger._getConnectedElement()`
  is a plain synchronous method call (no template-binding staleness
  window the way select's own `[cdkConnectedOverlayOrigin]` binding has),
  so this port's `openAutocompletePanel` always uses the SAME origin (the
  form field's wrapper, or the input itself standalone) for BOTH position
  AND insertion, every open — confirmed live, the popover lands inside
  `<mat-form-field>` from the very first open, every time (see
  `src/dev-app/qwik-parity/autocomplete.ts`'s own header note).

## Known issue in shared code, found but NOT fixed here (flagged for reconciliation)

While debugging the focus/reopen ordering above, this port's investigation
also turned up (and ruled out as the actual cause, after extensive live
repro) a separate, pre-existing timing quirk: if `<mat-form-field>` has to
re-render for ANY reason (its own `focused`/`shouldLabelFloat` writes, the
mount-time `mat-form-field-animations-enabled` 300ms timer, ...) **before**
the harness's own `settle` step has let that timer fire, an `'inline'`
popover reparented into it as a raw DOM sibling can observably coincide
with the input losing and regaining focus — confirmed present on
`mat-select`'s own trigger too (NOT something this port introduced), and
confirmed to be fully masked in every scenario here by the parity
spec/harness's existing `settle`-before-`open` step ordering (which this
port's own earlier debug scripts initially omitted, producing a false
positive that cost significant investigation time before being ruled out).
Since the real spec already avoids it and no scenario here is otherwise
affected, this wasn't chased further — flagging it here in case the
concurrent `select` parity work hits the same root cause from a different
angle.

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest &&
lint:no-ssr-leaks && typecheck` for the whole qwik-material package,
covering dialog + button + card + toolbar + badge + icon + progress-bar +
progress-spinner + divider + grid-list + list + button-toggle +
slide-toggle + expansion + radio + checkbox + sort + tabs + sidenav +
snack-bar + bottom-sheet + form-field + input + stepper + chips + tooltip +
slider + select + menu + table + tree + core + **autocomplete**.

## Qwik v2 preemptive fix: `mat-autocomplete-panel.tsx`'s `option.content` (2026-11-01)

Same preemptive fix as `qwik-material/select/mat-select-panel.tsx` (see that file's own SYNC.md
entry and `qwik-material/menu/SYNC.md`'s "Qwik v2 regression" section for the full root-cause
writeup) — `MatAutocompletePanel` self-re-renders on every `props.tree.value` change (live
refiltering), so `renderOption` now wraps its option body: `{cloneJsxForReuse(option.content)}`
instead of `{option.content}`. No current autocomplete scenario passes non-plain-text `content`,
so this is a no-op today.

## Qwik v2 regression: stale-blur race clobbering `mat-focused` (2026-11-01)

`optgroups`, `require-selection`, `hide-single-selection-indicator` all failed after clicking an
option: `mat-focused`/`mdc-text-field--focused`/`mdc-line-ripple--active` went missing from the
form field, despite `document.activeElement` never actually leaving the input the whole time.
Same root cause and fix as `qwik-material/select/mat-select.tsx`'s `onHostBlur$` — see that
file's SYNC.md "Qwik v2 regressions" section for the full write-up. `mat-autocomplete.tsx`'s
`handleBlur$` now checks `document.activeElement` before clobbering `formField.focused`, but
NOT before `onTouched$`/`empty`/`shouldLabelFloat` — an earlier, broader version of this guard
(skipping the WHOLE handler) was tried and reverted: it suppressed `onTouched$` too, which
should fire on a genuine blur regardless of how fast focus bounces back (confirmed live:
Angular shows `ng-touched` through this exact click-then-immediately-refocus sequence), breaking
`ng-touched` parity on exactly these 3 scenarios.

## `ref` prop — composed with the internal `inputRef` (2026-11-02)

`MatAutocompleteProps.ref` (new): an external ref, merged via `composeRef()` with this
component's own `inputRef` signal. Same rationale as `qwik-material/input`'s identical addition
— see `qwik-material/README.md`'s "Using with Formisch". Not exercised by this port's own
Formisch example; added for consistency since the same gap (no way to hand out the live native
element) applies identically here.

## Fixed: standalone usage (no `<MatFormField>` ancestor) crashed with `Code(Q8)` (2026-11-02)

Found porting the docs site's `autocomplete-plain-input` example (the first ever usage of
`MatAutocomplete` with no `<MatFormField>` ancestor in this whole project). `mat-autocomplete.tsx`
called `useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined)`/`useContext(
MAT_FORM_FIELD_CONNECTED_ORIGIN, undefined)` to read the OPTIONAL ancestor state — but Qwik's own
`useContext(context, defaultValue)` checks `defaultValue !== undefined` to decide whether a
default was supplied at all, so passing the literal value `undefined` is indistinguishable from
passing none, and it throws `QError_notFoundContext` (`Code(Q8)`) instead of returning it. This
exact bug (confirmed live, not a guess) was ALREADY found and fixed once before for a sibling
context — see `qwik-material/form-field/id-scope.ts`'s `useAssignedId()` — but the same
anti-pattern had silently spread to every other "optional ancestor" context read in the library
(grep: `MatInput`, `MatSelect`, `MatAutocomplete`, `MatDatepickerInput`, `MatDateRangeInput`,
`MatTimepickerInput` all had it for `MAT_FORM_FIELD_CONTROL_STATE`/`MAT_FORM_FIELD_CONNECTED_ORIGIN`
specifically), latent and undetected because every existing scenario in the whole 578-test suite
nests its control in a `<MatFormField>`. Fixed centrally: `core/mat-form-field-control.ts` now
exports `useOptionalFormFieldControlState()`/`useOptionalFormFieldConnectedOrigin()` (the same
private-`Symbol`-sentinel technique `useAssignedId()` already used), and every one of those 6
call sites was switched to call them instead of the broken raw `useContext(..., undefined)` form.
Zero behavior change when a `<MatFormField>` ancestor exists (confirmed: `pnpm -C src/qwik-material
test` 783/783, full `src/qwik-cdk-parity-tests` suite unaffected) — only the previously-crashing
standalone case now works.

## `optionSelected`/`opened`/`closed`/`optionActivated` events (2026-11-03)

Previously this port had only `onValueChange$` (which, matching upstream's own CVA `_onChange`,
fires on every keystroke too when `requireSelection` is unset — see "Why `onValueChange$` doesn't
fire on every keystroke..." above) and a single combined `onOpenedChange$`. Four upstream
`@Output()`s were genuinely missing: `optionSelected` (fires ONLY on a real click/Enter
selection commit, never on typing, regardless of `requireSelection`), `opened`/`closed`
(argument-less), and `optionActivated` (fires on every highlighted-option change while open).

- **New props** on `MatAutocompleteProps` (`mat-autocomplete.tsx`): `onOptionSelected$`,
  `onOptionActivated$`, `onOpened$`, `onClosed$`. `onOpenedChange$` is KEPT unchanged (not
  removed) for backward compatibility — both it and the new `onOpened$`/`onClosed$` fire at the
  same point.
- **Event-shape deviation (both new option events):** upstream's `MatAutocompleteSelectedEvent`/
  `MatAutocompleteActivatedEvent` are `{source: MatAutocomplete, option: MatOption}` — both
  fields are real Angular component INSTANCES (imperative methods, DI-injected refs). This port
  has no component-instance handle to give out for either (same category of simplification as
  `button-toggle/SYNC.md`'s `MatButtonToggleChange` class removal) — `source` is dropped
  entirely, and `option` becomes the plain-data `MatAutocompleteOptionInfo`
  (`{value, label, id}, autocomplete-runtime.ts`) instead of a `MatOption` instance.
  `optionActivated`'s `option` is `null` when the active item is cleared, matching upstream's own
  `this.options.toArray()[index] || null`.
- **`optionSelected` fires from `selectAutocompleteOption()`** (`autocomplete-runtime.ts`) —
  the ONLY function that commits a real selection (a click or Enter on an option; never typing) —
  right after `cfg.onValueChange$?.(option.value)`, mirroring upstream `_setValueAndClose`'s own
  order (`_onChange()` then `panel._emitSelectEvent()`), and BEFORE the focus/close that follows
  (see that function's own big doc comment on why focus must run before detach).
- **`optionActivated` fires from a new `emitOptionActivatedIfChanged()` helper**, called from
  every call site that invokes `manager.setActiveItem()`/`.onKeydown()` directly
  (`resetActiveItem()` — every open/refilter — and `handleAutocompleteKeydown`'s arrow-key
  branch), NOT from inside `buildKeyManager`'s own cached `onChange` closure. That closure is
  built ONCE per component instance and cached (`getKeyManager`'s `if (!signals.keyManager.value)`
  check) — capturing `cfg`/`flat` there would hit the exact stale-closure hazard this file's own
  module doc comment already documents for why `onTabOut` isn't wired into the key manager either;
  every caller of `emitOptionActivatedIfChanged` already has the CURRENT `cfg`/`flat` in scope.
  Gated on (a) the active index actually having changed (mirrors `ListKeyManager.setActiveItem`'s
  own "only notify on a real change" check) and (b) the panel actually being open
  (`overlayAttached && flat.length > 0`, the same `isOpen`/`panelOpen` derivation used elsewhere
  in this file) — matches upstream's `_keyManager.change.subscribe(index => { if (this.isOpen)
  {...} })` guard.
- **`opened`/`closed` simplification, inherited from the pre-existing `onOpenedChange$`:**
  upstream only fires `opened` on a genuine closed→open TRANSITION of the OPTIONS-AWARE
  `panelOpen` getter (`_attachOverlay`'s own `if (this.panelOpen && wasOpen !== this.panelOpen)`
  — so a refilter of an already-open panel, or a fresh attach that still has zero options, does
  NOT re-fire it) — this port fires `onOpened$`/`onClosed$` at the same (less precise) points
  `onOpenedChange$(true/false)` already did, every time `openAutocompletePanel`/
  `selectAutocompleteOption`/`closeAutocompletePanelWithResetCheck` run, regardless of whether
  the panel was already open/closed. No scenario in this suite calls `openPanel()` on an
  already-open panel in a way that would observably double-fire this (every open path goes
  through a genuine closed→open transition), so this is a latent, not-yet-exercised simplification
  — flagged here rather than silently diverging further from upstream.

No upstream docs example exercises these 4 outputs directly (material.angular.dev's autocomplete
examples only ever bind `[formControl]`/`(input)`/`(optionSelected)`-as-a-trivial-logger in a way
this port's existing scenarios already cover functionally) — covered instead by
`mat-autocomplete-scenarios.spec.tsx` (prop-shape sanity) and
`specs/material-autocomplete/option-events.spec.ts` (Playwright, fresh `page.goto` per test):
`optionSelected` fires once per click/Enter pick (never per keystroke, confirmed against a
`requireSelection={false}` scenario where typing alone would otherwise look indistinguishable
from a pick if this port still conflated the two), `optionActivated` fires on arrow-key nav and
on open (auto-active-first-option), and `opened`/`closed` fire once per open/close cycle.

## `ErrorStateMatcher` (2026-11-03)

Previously hardcoded the default formula (`invalid && (touched || formSubmitted)`) directly, with
no way to override it. Now reads `props.errorStateMatcher ?? <QwikMaterialProvider
errorStateMatcher> ?? 'touched'` via the same `useSignal`+`useTask$` resolution pair
`qwik-material/select/mat-select.tsx`'s `triggerLabel` (`compareWith$`) establishes — see
`core/error-state-matcher.ts`'s doc comment for the full design and `input/SYNC.md`'s own
`ErrorStateMatcher` section for the shared write-up and the scenarios covering it. No scenario
here needed a dedicated one — the mechanism is identical across every control.

## Scroll-strategy configuration (2026-11-03)

Added `MAT_AUTOCOMPLETE_SCROLL_STRATEGY` (mirrors upstream's `MAT_AUTOCOMPLETE_SCROLL_STRATEGY`
injection token) + `<QwikMaterialProvider matAutocompleteScrollStrategy={…}>`, threaded
through `AutocompleteRuntimeConfig.scrollStrategyDescriptor` into `openAutocompletePanel()`'s
overlay config (previously hard-coded to `createRepositionScrollStrategy()`).

Uses the serializable `ScrollStrategyDescriptor` from the start (not the function-factory
pattern that caused the "scroll strategy lost after resume" bug elsewhere — see
`qwik-material/dialog/SYNC.md`'s entry of that name for the full root-cause write-up, and
`qwik-material/menu/SYNC.md`'s for how the fix was designed). `MAT_AUTOCOMPLETE_SCROLL_STRATEGY`
is `createContextId<ScrollStrategyDescriptor>(...)`; `MatAutocomplete` reads it with a plain
`{type: 'reposition'}` `useContext()` default (safe — plain descriptor data, not a function);
`openAutocompletePanel()` is `async`, resolving the descriptor via
`resolveScrollStrategyDescriptor()` (`qwik-cdk/overlay`) immediately before `overlay.create()` —
only actually suspends for the `QRL<() => ScrollStrategy>` escape hatch, so every existing
fire-and-forget call site (`handleAutocompleteInput`/`Focus`/`Click`/`Keydown`, none of which
check overlay state synchronously right after calling it) keeps working unchanged.

## Fixed: Code(Q3) under the Vite dev server (2026-11-06)

Qwik's dev mode verifies that every value a `$()` callback captures is serializable; production
builds don't, so this only showed under `vite` / `pnpm dev`. The autocomplete panel's `onOptionSelect` prop is a plain function created per open, and the panel's inline handlers capture `props`. These values only exist in
the browser, so they're now marked `noSerialize` (or the local helper is inlined into the
handlers). Found by sweeping every dev-app page under the dev server.
