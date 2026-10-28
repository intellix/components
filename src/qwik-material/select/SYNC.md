# qwik-material/select sync log

Tracks the sync state between this port and `src/material/select/` +
`src/material/core/option/` upstream. See also
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`.
`MatOption`/`MatOptgroup` themselves live in `qwik-material/core` — see that
package's own `SYNC.md` — since autocomplete/datepicker/timepicker will
reuse them.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
|------|---------------|------------|-------|
| `scss/select/select.scss` | `src/material/select/select.scss` | synced | cdk-stub swap only (`@use '@angular/cdk'` → `@use '../cdk-stub' as cdk`, used for `cdk.high-contrast`) |
| `scss/select/_m2-select.scss` | `src/material/select/_m2-select.scss` | synced | byte-identical |
| `scss/select/_m3-select.scss` | `src/material/select/_m3-select.scss` | synced | byte-identical |
| `scss/select/_select-theme.scss` | `src/material/select/_select-theme.scss` | synced | byte-identical, not referenced by the prebuilt CSS (same as every other `*-theme.scss`) |
| `scss/select/select-prebuilt.scss` | n/a | new | `@use './select'` only — every `--mat-select-*` token already has a real fallback baked in via `token-utils.slot(..., $fallbacks)`, where `$fallbacks = m3-select.get-tokens()` resolves the default M3 system theme at Sass compile time (same "no :root overrides needed" situation as `list-prebuilt.scss`'s/`core/option/option-prebuilt.scss`'s majority case) |

## Mapped TypeScript/TSX files

Not a 1:1 file mapping — upstream's `select.ts` (1443 LOC: `MatSelect` +
`MatSelectTrigger`) is split across several files:

- `mat-select.tsx` ← `MatSelect`'s props, host rendering, trigger rendering,
  `$()` event-handler wiring.
- `mat-select-panel.tsx` ← the `.mat-mdc-select-panel` listbox content
  (`select.html`'s `<ng-template cdk-connected-overlay>` body) — the
  component `MatSelect` attaches to its overlay via `overlay.create()`.
- `select-runtime.ts` ← `MatSelect.open()`/`.close()`/`._exitAndDetach()`/
  `._handleKeydown()`/`._onSelect()`/`._highlightCorrectOption()`, pulled
  out into free (non-closure) functions — same reason
  `qwik-material/tooltip/tooltip-runtime.ts` does this (see that file's doc
  comment, and this file's own, for why).
- `select-option-resolver.ts` ← the data-shaping half of what upstream's
  `@ContentChildren(MatOption, {descendants: true})` QueryList gives it for
  free (see "The `options` prop" below).
- `select-config.ts` ← `MAT_SELECT_CONFIG` + `MatSelectConfig`.
- **`MatSelectTrigger` is NOT ported as a component at all** — see "Public
  API" below.

## Public API

```tsx
<MatFormField
  label={<MatLabel>Fruit</MatLabel>}
  control={
    <MatSelect
      controlType="mat-select"
      value={value.value}
      onValueChange$={(v) => (value.value = v)}
      options={[
        {value: 'apple', label: 'Apple'},
        {value: 'banana', label: 'Banana'},
        {value: 'cherry', label: 'Cherry', disabled: true},
      ]}
    />
  }
/>
```

### The `options` prop — a hard-won, SSR-correct option-definition shape

`options` is a **plain-data array** of `MatSelectOptionDef`
(`{value, label, content?, disabled?, id?}`) and/or `MatSelectGroupDef`
(`{label, disabled?, id?, options: MatSelectOptionDef[]}`) —
**NOT `<MatOption>`/`<MatOptgroup>` JSX elements.** `MatSelect` resolves
this via `select-option-resolver.ts`'s `resolveSelectOptions()` and renders
the actual `<MatOptgroup>`/`<MatOption>` elements itself (inside the
lazily-created `MatSelectPanel`), filling in every prop upstream's
`ActiveDescendantKeyManager`/`SelectionModel` would otherwise compute
(`selected`/`active`/`multiple`/ids/...). `MatOption`/`MatOptgroup`
(`qwik-material/core`) are reusable **renderer** components, not something a
consumer of `<MatSelect>` writes directly — see that package's own
`SYNC.md`.

**This was not the first design, and the reason it changed is the single
most important thing to read before touching this port.**

An earlier version took `options: JSXOutput[]` — an array of
`<MatOption>`/`<MatOptgroup>` *descriptors*, mined via `.props` without ever
rendering them. This is the exact "read `.props` without rendering"
technique already proven safe elsewhere in this project
(`core/mat-form-field-control.ts`'s `readControlProps`;
`qwik-material/grid-list/jsx-children.ts`'s `collectTypedChildren`), and it
is how the task's own design-doc pitfall list frames the problem ("Qwik
can't read slotted children at SSR — pick an SSR-correct option-definition
shape"). It compiled, typechecked, and even produced a **correct SSR
snapshot** — `preselected-value`'s initial render showed "Banana" in the
trigger from the very first paint, proving `props.options` was read
correctly during the render that produced the HTML.

It was still broken, for a reason neither precedent above hits: both
`readControlProps` and `collectTypedChildren` are called **once, during a
single render**, by the component that owns the descriptor array, and never
again. `MatSelect` is different — it needs its resolved option data again
**inside its own lazily-resumed `$()` event handlers**
(`onTriggerClick$`/`onHostKeyDown$`), on every click/keydown, for the
lifetime of the page, not just once at render time.

Confirmed live, with an isolated, reproducible repro (not a flaky guess —
cross-checked across multiple full rebuilds and preview-server restarts):
a JSX descriptor's `.type` field is a reference to a `component$()`-wrapped
function (`MatOption`). That's safe for Qwik to serialize when the
descriptor is an ACTUAL VNODE Qwik itself is rendering/diffing (the common
case every other `.type`-comparison in this project relies on) — it is
**not** safe when that same descriptor is sitting inertly inside plain prop
data that a different component (`MatSelect`) merely introspects and never
renders. Reading `props.options` — or a `useSignal()` memoizing a value
derived from it, tried as a first fix — from inside a `$()` handler resumed
after the SSR→client boundary **consistently deserialized to
empty/`undefined`**, even on the `preselected-value` scenario whose initial
render had just used the exact same `props.options` correctly. The failure
mode was not a crash with a clean stack trace; it silently produced an
empty option list, so `open()`'s own `flat.length === 0` guard made the
panel appear to simply do nothing on click — worth calling out explicitly,
because it means a future regression of this kind could easily look like
"the click handler isn't wired up" rather than "the data is gone" unless you
specifically log `flat.length` inside the handler.

Plain data with no embedded component-function references does not have
this problem — this is exactly `qwik-material/tabs`'
`MatTabGroup.tabs: MatTabDef[]` shape (already proven to survive this exact
path, including its own `$()` handlers, like `onKeyDown$` reading
`disabledFlags` derived from `tabs`), generalized here with one addition:
`MatSelectOptionDef.content?: JSXOutput` is accepted as an escape hatch for
an option's richer-than-plain-text body (e.g. a leading icon) — safe
because it is only ever *forwarded* opaquely for rendering
(`<MatOption>{entry.content}</MatOption>` inside `MatSelectPanel`, a normal
render path, never read back out inside a `$()` handler), matching
`MatTabDef.content`/`.labelTemplate`'s own already-proven-safe usage. The
one thing a `content`/`labelTemplate`-shaped field must never do is have
its `.type`/`.props` read back out by something that also needs to survive
resumption — the moment that's needed, it needs to become plain data too.

**Takeaway for any future component taking a dynamic list of
"items with their own JSX-describable identity" as a prop** (a date range
picker's presets, a stepper's steps supplied externally, …): if the owning
component ever needs to re-derive data from that prop *inside one of its
own `$()` handlers* (not just once, at render time), the prop must be plain
data, not an array of JSX element descriptors — no matter how tempting the
`readControlProps`-style introspection looks, and even though it will
*appear* to work during manual testing of the very first render.

### Why `MatSelectTrigger` isn't a component

Upstream's `mat-select-trigger` selector matches a bare structural
directive — `@Directive({selector: 'mat-select-trigger'})`, no component, no
host, no template of its own; its own host element is whatever
native/Material tag the consumer wrote it on (every parity scenario, and
upstream's own `select-custom-trigger` example, use a plain `<span>`). There
is nothing for a Qwik component to wrap. `MatSelect`'s own `customTrigger`
prop (`JSXOutput`) takes the projected content directly — the same
"directive on a consumer element → polymorphic `as` prop" pattern
(design-doc rule 4) taken to its logical conclusion when there's no wrapper
element at all to be polymorphic about.

### Why `value` is not a live, reactive prop

`MatSelect` is routinely passed as `<MatFormField control={<MatSelect
value={...} .../>}>` — nested inside another component's prop, the exact
shape `form-field/SYNC.md`'s "real Qwik reactivity limitation" write-up
documents as frozen-after-first-render (same family of issue `MatInput`'s
own `value` hit). `props.value` is read exactly once, to seed an internal
signal; `MatSelect` owns the selection state itself thereafter (mirrors
upstream's own actual data flow for every scenario in this parity suite:
nothing ever externally reassigns `[(value)]`/a bound `FormControl`'s value
from *outside* the select after mount — every scenario's only value changes
come from the select's own interactions, which already flow correctly
through `onValueChange$` back out to the consumer). A consumer needing to
imperatively reset the value from outside after mount is not supported yet.

### `controlType="mat-select"` must be passed explicitly

Unlike `MatInput` (which can omit `controlType` entirely, because
`'mat-input'` happens to be `MatFormField`'s own hardcoded fallback when
it's absent), `MatSelect` **must** pass `controlType="mat-select"` on every
usage nested inside a `<MatFormField control={...}>`. `MatFormField` reads
`controlType` directly off the `control` prop's *static* JSX descriptor
(`readControlProps`, never executed) — there is no mechanism for `MatSelect`
to inject this into its own descriptor after the fact, so a consumer that
forgets it silently gets the wrong id prefix (`mat-input-N` instead of
`mat-select-N`) and the wrong `mat-mdc-form-field-type-*` class. See
`core/mat-form-field-control.ts`'s `controlType` doc comment. Passing it
also implies `disableAutomaticLabeling` (see below) — `MatFormField` derives
that from `controlType === 'mat-select'` automatically, so only the one
prop is needed.

### `disableAutomaticLabeling`

Mirrors upstream `MatSelect.disableAutomaticLabeling = true` ("to avoid
issues like #27241" — see `select.ts`). The form field's floating `<label>`
never gets a `for` attribute pointing at the select (confirmed live against
Angular: the label still floats/behaves the same visually — only the
`for`/id association is skipped). `MatSelect` instead builds its own
`aria-labelledby` from `MAT_FORM_FIELD_CONTROL_STATE.labelId` (the label's
*own* id) — see `core/mat-form-field-control.ts`'s matching doc comment.

## First-open vs. later-open overlay origin (read before touching `openSelectPanel`)

Confirmed live against the real Angular dev-app, repeatedly: a select's
overlay host lands as a child of `<mat-select>` itself on its first-ever
open, but as a child of `<mat-form-field>` on every later open. Upstream's
cause is a genuine Angular change-detection timing artifact (`MatSelect.open()`
assigns `_preferredOverlayOrigin` imperatively, but the template binding
that feeds the overlay directive is only re-evaluated by the *next* CD pass
— too late for the attach that already happened this time).

This port does **not** replicate that CD-staleness mechanism — there's
nothing analogous to replicate (Qwik has no comparable "stale template
binding" artifact). Instead, `SelectRuntimeSignals.stickyOrigin` directly
reproduces the two *observable* DOM shapes: `openSelectPanel()` reads
`stickyOrigin.value` (`undefined` on the very first call) to pick this
open's origin, falling back to the select's own trigger element when unset,
then — *after* using it — sets `stickyOrigin.value` to the form field's
wrapper (`MAT_FORM_FIELD_CONNECTED_ORIGIN`), or the trigger again if there's
no form field. First open: `stickyOrigin` is `undefined` → origin is the
trigger → overlay host lands inside `<mat-select>`. Every open after that:
`stickyOrigin` is the form-field wrapper → overlay host lands inside
`<mat-form-field>`. Exactly matches the two Angular-confirmed shapes at
exactly the same steps, without needing the timing bug itself.

Panel **width** (`_getOverlayWidth`) is unaffected by any of this — it's
always measured off the form-field wrapper (falling back to the select's
own host) directly, matching upstream's own `_getOverlayWidth` reading the
*current* `_preferredOverlayOrigin` synchronously inside `open()`, unaffected
by the separate template-binding staleness that only affects the connected-
overlay directive's own `origin` input.

## Deviations from upstream

- **`compareWith` is always strict `===`.** No scenario needs object-identity
  comparison with custom equality; every value in every scenario is a
  primitive string. Accepting a custom comparator function as a prop would
  hit the exact same "plain function crossing a `$()` boundary" hazard that
  motivated the `options` redesign above, for no benefit yet exercised.
- **`sortComparator` is not accepted.** Multi-select values are always
  resorted into panel (document) order (`_sortValues()`'s default
  behavior) — no scenario supplies a custom sort.
- **`disableOptionCentering`/`canSelectNullableOptions` are accepted via
  `MAT_SELECT_CONFIG` for API parity but `disableOptionCentering` has no
  effect** — it only ever affected upstream's non-flexible positioning math,
  which this port's `FlexibleConnectedPositionStrategy` usage doesn't
  replicate a non-flexible variant of. `canSelectNullableOptions` IS wired
  (gates the "null value resets selection" branch in `selectOption()`), just
  unexercised by any scenario (every option here has a real string value).
- **No real `AriaDescriber`/hidden describedby elements.** Not needed —
  `MatSelect` never renders one upstream either (unlike tooltip/badge).
- **Typeahead/navigation key dispatch uses `qwik-cdk/a11y`'s shared
  `ListKeyManager`** (merged in from `port/menu`'s `qwik-cdk-dialog-port`
  — see that port's own `qwik-cdk/a11y/SYNC.md`), not a select-specific
  reimplementation. An earlier draft of this port wrote its own
  `createListKeyManager`/`Typeahead` pair in
  `qwik-cdk/a11y/key-manager/list-key-manager.ts` before the menu port's
  version was merged in; consolidated onto the shared one (same file path)
  once that merge landed. No `ActiveDescendantKeyManager`/`FocusKeyManager`
  needed — see `core/mat-option.tsx`'s/`list-key-manager.ts`'s own doc
  comments for why this port's declarative rendering model has no
  imperative `setActiveStyles()`/`setInactiveStyles()` step left to port.
- **No real `SelectionModel`.** `SelectRuntimeSignals.value` (a single
  value or array) IS the selection model; `_sortValues()`/`_onSelect()` are
  collapsed into `select-runtime.ts`'s `selectOption()`.
- **Live-announcer on closed-select arrow-key selection** (upstream:
  `_liveAnnouncer.announce(viewValue, 10000)` in `_handleClosedKeydown`) uses
  `qwik-cdk/a11y`'s `createLiveAnnouncer()` — created lazily, on first use,
  same simplification every other consumer (`snack-bar`) already makes; its
  `document.body`-appended live element lives outside `[data-parity-root]`,
  so it's invisible to this parity suite regardless.

## Shared `qwik-cdk`/`qwik-material/core`/`qwik-material/form-field` changes this port needed

- **`qwik-cdk/overlay`'s `'inline'` popover location, first real end-to-end
  consumer.** `FlexibleConnectedPositionStrategy.withPopoverLocation('inline')`
  + `OverlayHost`'s `applyPopoverInsertionPoint()` reparenting were defined
  (with unit tests) during the tooltip port, but tooltip itself always uses
  `'global'` — select is the first consumer to exercise the reparenting
  path end-to-end in a real browser. No bugs found in it specifically; see
  "First-open vs. later-open" above for how this port drives it.
- **`core/mat-form-field-control.ts`: `MAT_FORM_FIELD_CONNECTED_ORIGIN`,
  `MatFormFieldControlState.labelId`/`.color`,
  `MatFormFieldControlProps.disableAutomaticLabeling`.** See
  `qwik-material/core/SYNC.md` for the full write-up.
- **`form-field/mat-form-field.tsx`: the generated-id prefix now depends on
  `controlType`** (`'mat-select-'` vs. the previous hardcoded
  `'mat-input-'`), and the floating label's `for` is suppressed when
  `controlType === 'mat-select'` (in addition to the existing
  `disableAutomaticLabeling` prop check). Both changes are no-ops for every
  existing `MatInput` scenario (its `controlType` is still `'mat-input'`
  either way).
- **`lib/material-parity.ts`: `open()` now waits for
  `mat-form-field-animations-enabled` to settle** (bounded, 2s, swallowed on
  timeout) before returning, on whichever side has a `.mat-mdc-form-field`
  at all. Needed because `mat-select`'s substantially larger bundle (overlay
  + key-manager + option/optgroup + form-field extensions) pushes
  qwikloader's own bootstrap time close enough to `MatFormField`'s 300ms
  "animations enabled" mount timer that the class was **consistently** (not
  flakily — reproduced across repeated full runs) still absent on the Qwik
  side by the time `expectMaterialParity`'s very first `compare()` ran, on
  every single `mat-select` scenario. This does not weaken the
  `mat-form-field-animations-enabled` assertion itself (the full class list,
  including this one, is still compared afterward) — it only waits for a
  known, real, transient mount-timer to settle first, the same category of
  fix `waitForSelectPanel`'s own polling in this spec file already applies
  to the select panel's own exit animation. Applies to every component's
  tests, not just select's, but is a no-op (resolves instantly) for any
  scenario where the class has already settled by the time `open()` runs —
  confirmed by re-running `specs/material-form-field` after this change.
