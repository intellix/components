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

### Why `MatSelectTrigger` isn't a component (but its tag still appears in the DOM)

Upstream's `mat-select-trigger` selector matches a bare structural
directive — `@Directive({selector: 'mat-select-trigger'})`, no component, no
host, no template of its own. **This does NOT mean the `<mat-select-trigger>`
tag disappears from the rendered DOM** — a directive, unlike a component,
never replaces or unwraps its host element; it only adds behavior to
whatever element the consumer wrote the selector on. Upstream's
`select.html` projects it with a plain `<ng-content select="mat-select-trigger">`,
and `<ng-content>` always projects the consumer's element exactly as
written, tag included. An earlier version of this port got this backwards
(assumed the tag vanished, so `customTrigger` rendered as unwrapped plain
content) and hit a real, confirmed-live diff (`span[0]: child count 1 != 2`
— Angular's wrapping span has exactly ONE child, the `<mat-select-trigger>`
element itself, not `customTrigger`'s own children unwrapped into it).
`MatSelect` now wraps `customTrigger` in a literal `<mat-select-trigger>`
element itself (a plain pass-through host, same category as
`<mat-pseudo-checkbox>` — see `mat-select.tsx`'s own doc comment on the
prop) rather than asking every consumer to write that wrapper tag by hand.
`customTrigger` staying a plain `JSXOutput` prop (not a dedicated
`<MatSelectTrigger>` JSX element) is still the right call — design-doc rule
4's "no extra wrapper COMPONENT," not "no extra wrapper element."

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

**Update (2026-11-02):** now supported — see `mat-select.tsx`'s own comment on the `useTask$`
right after the `value` signal. A form library needing to put a value back into the select from
outside after mount (first real consumer: Formisch — see `qwik-material/README.md`'s "Using
with Formisch") is exactly this case. Fixed with the SAME pattern `MatInput`'s own `value`-sync
`useTask$` already uses (`input/mat-input.tsx`) — `track(() => props.value)` subscribes to the
actual signal regardless of nesting depth, unlike `MatFormField`'s unrelated *static*
`readControlProps()` one-time read (a completely different mechanism — the two are easy to
conflate, see the long comment this update left in place for why they aren't the same
limitation). Zero effect on every scenario in this file: none of them ever reassign `value` from
outside after mount, so the new task only ever reconfirms a value the select's own
`onValueChange$` round-trip already produced.

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
reproduces the *observable* DOM-insertion shape: `openSelectPanel()` reads
`stickyOrigin.value` (`undefined` on the very first call) to pick this
open's INSERTION point, falling back to the select's own trigger element
when unset, then — *after* using it — sets `stickyOrigin.value` to the
form field's wrapper (`MAT_FORM_FIELD_CONNECTED_ORIGIN`), or the trigger
again if there's no form field. First open: `stickyOrigin` is `undefined`
→ insertion point is the trigger → overlay host lands inside
`<mat-select>`. Every open after that: `stickyOrigin` is the form-field
wrapper → overlay host lands inside `<mat-form-field>`. Exactly matches the
two Angular-confirmed shapes at exactly the same steps, without needing the
timing bug itself.

**This is INSERTION only, not position** — a correction to an earlier
version of this port, which used the SAME sticky value for the position
strategy's own origin (`setOrigin()`) too. Confirmed live, with exact pixel
arithmetic, that this was wrong: on the real Angular app's first open, the
panel's actual `top`/`left` match the form-field WRAPPER's rect exactly
(`wrapper.bottom`/`wrapper.left`, to the pixel) — never the trigger's, even
though the trigger is genuinely where the overlay host gets INSERTED that
same open. `openSelectPanel()` now computes these as two independent
locals: `positionOriginEl` (always `formFieldOriginRef?.value ?? triggerRef.value`
— no stickiness, every open) feeds `setOrigin()`; `insertionOriginEl` (the
sticky value above, unchanged) feeds `qwik-cdk/overlay`'s new
`withPopoverInsertionOrigin()`, which exists specifically so these two can
differ (see that method's own doc comment in
`flexible-connected-position-strategy.ts`).

Panel **width** (`_getOverlayWidth`) was already unaffected by any of this
— it's always measured off the form-field wrapper (falling back to the
select's own host) directly, matching upstream's own `_getOverlayWidth`
reading the *current* `_preferredOverlayOrigin` synchronously inside
`open()`, unaffected by the separate template-binding staleness that only
affects the connected-overlay directive's own `origin` input.

### Known, accepted test-fixture limitation: absolute panel position

`mat-select` is the first parity-tested component whose overlay panel's
absolutely-positioned `style` lives INSIDE the compared `[data-parity-root]`
subtree (see `angular-parity.spec.ts`'s own "ONE ROOT ONLY" header note —
every prior overlay component's panel lives in the separate, uncompared
`.cdk-overlay-container` root). Since `FlexibleConnectedPositionStrategy`
computes real, viewport-relative pixel coordinates, comparing that `style`
attribute byte-for-byte only makes sense when both pages' trigger sits at
the identical viewport position. The two dev-apps' surrounding page chrome
differs (Angular's own shell wraps every scenario in a 64px toolbar + 32px
content padding; this port's dev-app routes are bare pages), so this one
`style` attribute currently shows a real, understood, and judged-benign diff
(e.g. `top: 152px` vs `top: 64px` on `fill-basic`) — the position
ALGORITHM itself is confirmed correct (both sides' `top + height` sum to
the same real `720px` viewport height; only the *input* geometry differs).

A route-group layout (`src/qwik-cdk-dev-app/src/routes/mat-select/layout.tsx`)
reproducing Angular's exact chrome offset was tried and DELIBERATELY
reverted: a wrapping `<div style="padding-left:…;padding-top:…">` around
`<Slot/>`, scoped to only `/mat-select/*` routes, made the absolute position
match exactly — but, confirmed live and repeatably (controlled A/B
rebuilds, holding everything else fixed), made `MatSelect`'s panel
INTERMITTENTLY fail to open at all: a genuine Qwik scheduler crash
(`Cannot read properties of undefined (reading 'S')`, deep inside Qwik's
own minified runtime — not a call this port's code makes directly), with
no thrown error on other occasions but the panel simply never appearing.
Root cause not pinned down (every select-specific line in this port was
ruled out — the crash reproduced identically with every one of them
reverted); a crash is a strictly worse failure mode than a documented,
understood, non-blocking style diff, so this was not pursued further. A
future attempt should start by bisecting the EXACT wrapper shape/values
that trigger it (confirmed non-obvious: some padding values crashed
reliably, others reliably did not, with no style tag involved either way)
rather than assuming the most recently-tried shape is representative.

## Known open issue: `multiple`/`custom-trigger`'s pseudo-checkbox attrs occasionally unsettled

`multiple` and `custom-trigger` (the two scenarios with `multiple`, hence
leading `<mat-pseudo-checkbox>`s on every option) can show a transient diff
right after `open()` — `mat-pseudo-checkbox[N]: attr 'state'/'appearance'
'undefined' != '…'` — i.e. the attribute is momentarily absent on the Qwik
side. Confirmed NOT a missing attribute in `MatOption`/`MatPseudoCheckbox`'s
own rendering: a direct, isolated `outerHTML` inspection (not part of the
parity harness) shows the fully-settled element with the correct
`state="unchecked" appearance="full"` moments later. This is a genuine
timing gap between the panel's own `.mat-mdc-select-panel` host div
attaching (all `waitForSelectPanel` currently waits for) and its
`<mat-option>` children's own lazy render finishing — narrower than the
form-field mount-timer gaps this port/the harness already waits out
elsewhere. An attempt to close this gap by also waiting, inside
`waitForSelectPanel`, for every in-panel `<mat-pseudo-checkbox>` to have a
`state` attribute made things WORSE (the wait itself started timing out),
so it was reverted rather than shipped half-working; not pursued further
given time spent. A future fix should look at WHY `<mat-option>`'s own
render lags the panel host's so much in this one case, not just add more
waiting.

## `angular-parity.spec.ts` now passes 10/10 (fixed after initial merge)

The spec above initially shipped passing only 1/10 (`disabled`, which has no
interactive steps). Three independent root causes, all now fixed:

### 1. Closing the panel never actually removed it from the DOM — `qwik-cdk/overlay`'s inline-popover reparenting broke its own teardown

Every scenario that closes the panel (Enter/Escape/Tab/backdrop/picking an
option) hung forever in `waitForSelectPanel`'s poll for the panel count to
reach 0 — not a timing race, a genuine permanent leak confirmed live: the
`.mat-mdc-select-panel`'s `.cdk-overlay-popover` ancestor stayed in the live
DOM, inside `<mat-select>`, with `.cdk-overlay-container` simultaneously
showing 0 children. Root cause: `OverlayHost` (`qwik-cdk/overlay/overlay-host.tsx`)
always renders its host `<div>` as a declarative child of
`.cdk-overlay-container` (via `OverlayContainerOutlet`'s `ctx.entries.value.map(...)`),
then — for a popover with a non-`'global'` insertion point, `mat-select`'s
`'inline'` location being the first real end-to-end consumer of this path —
physically relocates that SAME element with a raw `insertionPoint.after(host)`
DOM call (`position/popover-insertion.ts`). Closing an overlay was previously
just `registry.remove(entry.id)`, shrinking `ctx.entries.value` and relying on
Qwik's own list-keyed reconciliation to find and remove the corresponding
`<OverlayHost>` subtree. That reconciliation only knows how to look where it
originally rendered the node (`.cdk-overlay-container`) — once physically
moved elsewhere, it's not there anymore, so Qwik quietly gives up (consistent
with the observed "container shows 0 children" — it correctly forgets ITS
OWN bookkeeping) without ever touching the orphaned, still-mounted
`OverlayHost` component, which keeps rendering (reproduced live:
`MatSelectPanel` kept re-rendering, following its still-subscribed `exiting`
signal, well after `detach()` ran) while remaining permanently stuck in the
live DOM.

Fix (`qwik-cdk/overlay/overlay-ref.ts` + `overlay-host.tsx`): `OverlayHost`
now also owns a real `detached` signal (same "`entry.state.*` is a plain,
non-reactive `{value}` carrier — see `_onAttached`'s own doc comment — so a
`useSignal` + `visuals` callback copy is required for anything mutated after
mount" pattern already used for `backdropShowing`/`panelClasses`) and
conditionally returns `null` once it's set — Qwik's own per-component
re-render (returning a different root than last time) correctly removes a
directly-referenced previous output regardless of where that node currently
lives, confirmed by isolated testing. `OverlayRef` gained `_onReparented()`,
called by `OverlayHost` exactly when `applyPopoverInsertionPoint` actually
relocated the host (never for the common `'global'` case), which flips
`detach()` onto a `visuals.setDetached(true)` path instead of the old
unconditional `registry.remove()`. One more subtlety, also confirmed live:
calling `setDetached(true)` and `registry.remove()` in the same synchronous
tick races Qwik's own render scheduling — the array-shrink observably wins,
leaving nothing subscribed to react to the `detached` write by the time it's
processed — so the registry removal is deferred one `setTimeout(…, 0)` tick
past it (a plain `queueMicrotask` was tried first and still lost the race).
Both changes are gated on `reparented` (`false` for every existing `'global'`
consumer — tooltip/menu/dialog), so `detach()`'s prior synchronous contract —
and the unit tests pinning it (`overlay.spec.ts`'s `dispose() removes the
entry from the registry`) — are completely unaffected.

### 2. Closed-select letter typeahead never selected anything

`handleClosedKeydown` (`select-runtime.ts`) compared `manager.activeItem`
immediately before and after its own `manager.onKeydown(event)` call to
decide whether to call `selectOption()`. That works for Home/End/arrows
(`ListKeyManager.onKeydown`'s switch cases call `setActiveItem` inline,
synchronously) but a letter key falls through to `Typeahead.handleKey()`,
which only queues the letter and resolves the match 200ms later via
`setTimeout` (`key-manager/typeahead.ts`) — so the comparison always ran
before the debounced match had landed, and the synchronous check was always
false. Confirmed live: fill-basic's `typeahead('b')` step left the value on
"Date" (the prior selection) instead of jumping to "Banana". Mirrors
upstream's own actual split, which this port had collapsed incorrectly:
upstream's `_handleClosedKeydown` only ever drives the live announcer off
that synchronous comparison; the ACTUAL selection for every closed-select
active-item change — synchronous (arrows) or debounced (typeahead) alike —
happens uniformly in `_initKeyManager`'s own
`_keyManager.change.subscribe(() => { if (!this._panelOpen && !this.multiple
&& this._keyManager.activeItem) { this._keyManager.activeItem._selectViaInteraction(); } })`.
Fixed by moving the select-and-announce call into `buildKeyManager`'s own
`manager.onChange` handler (this port's `change.subscribe` equivalent, which
fires for every active-item change regardless of what triggered it) and
simplifying `handleClosedKeydown` back to just driving navigation.

### 3. Multi-select: active-option class and form-field focus didn't match after a click

Two related diffs confirmed live after clicking an option in `multiple` or
`custom-trigger` (panel stays open): Angular's `<mat-form-field>` ends up
`mat-focused` (+ `mdc-text-field--focused` + `mdc-line-ripple--active`) and
NO option has `mat-mdc-option-active` — even though `aria-activedescendant`
still names the just-clicked option. Both are real, independent upstream
behaviors `_onSelect()`'s `multiple` branch triggers that this port's
`selectOption()` wasn't replicating:
- `this.focus()` is called unconditionally on a user-driven multi-select
  toggle (not just as part of closing, which never happens here) — fixed by
  calling `signals.hostRef.value?.focus()` in the same spot.
- Separately, `aria-activedescendant` (driven by the key manager's own
  `activeItemIndex`, set via `_keyManager.setActiveItem(option)`) and the
  VISUAL `mat-mdc-option-active` class (driven by each `MatOption`'s own
  `_active` field, toggled by `setActiveStyles()`/`setInactiveStyles()`) are
  NOT the same state upstream. A `multiple` select's bound
  `[value]`/`[(value)]` template binding is always re-evaluated by the next
  change-detection pass, and `_assignValue` unconditionally re-runs
  `_setSelectionByValue` for "`multiple` + `Array.isArray(newValue)`"
  regardless of reference equality ("always re-assign an array, because it
  might have been mutated" — `select.ts`'s own comment) — which calls
  `this.options.forEach(option => option.setInactiveStyles())`, wiping every
  option's visual-active class without restoring one (the multi-select
  branch never calls `_keyManager.updateActiveItem`, unlike the
  non-`multiple` one). Net effect: no option is ever visually "active" after
  an interactive multi-select toggle, independent of `aria-activedescendant`.
  Reproducing this needed decoupling the two: `SelectRuntimeSignals` gained
  `activeOptionHidden` (a `Signal<boolean>`, read by `MatSelectPanel` as
  `active={!props.activeOptionHidden.value && props.activeIndex.value ===
  option.index}`) — cleared to `false` by `buildKeyManager`'s own `onChange`
  (any legitimate open/nav/typeahead re-highlight un-suppresses it, matching
  `ActiveDescendantKeyManager.setActiveItem()`'s own unconditional
  `setActiveStyles()` the next time it runs) and set to `true` by
  `selectOption`'s `multiple` + `isUserInput` branch, right after its own
  `setActiveItem` call (whose `onChange` firing had just un-suppressed it).
  `activeIndex` itself is untouched, so `aria-activedescendant` still
  correctly names the clicked option.

Verification: `specs/material-select/angular-parity.spec.ts` 10/10, run 3
times; `specs/material-form-field`, `material-menu`, `material-chips`,
`material-button-toggle`, `material-tooltip` (83 tests, covering every
`'global'`-popover overlay consumer) unaffected.

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
  path end-to-end in a real browser. See "First-open vs. later-open" above
  for how this port drives it, and for the real bug this surfaced: `'inline'`
  tied the insertion point to the SAME element as the position strategy's
  own origin, but select genuinely needs these to differ on its first open.
  Fixed by adding `withPopoverInsertionOrigin()` — purely additive, no other
  current `'inline'`/`'global'` consumer is affected.
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
- **`mat-select.tsx`: echoes a literal `hidesingleselectionindicator` DOM attribute on
  `<mat-select>` whenever `cfg.hideSingleSelectionIndicator` resolves `true`.** Needed by
  `qwik-material/paginator`'s page-size select — `paginator.html` writes
  `hideSingleSelectionIndicator` as a BARE, static HTML attribute (not a scenario choice),
  which Angular leaves in the live DOM verbatim (same category as a directive-selector
  attribute Material's own template emits). No existing select scenario sets this prop true, so
  this is purely additive. See `qwik-material/paginator/SYNC.md`.

## Qwik v2 preemptive fix: `mat-select-panel.tsx`'s `option.content` (2026-11-01)

`MatSelectPanel` re-renders itself (reads its own `props.exiting.value` in its `classes`
computation) more than once per open, independent of `option.content` ever changing — the exact
pattern `qwik-material/menu`'s `MenuPanel` was confirmed to corrupt under Qwik v2 when
`option.content` is a real `JSXOutput` (not the plain string most options use) — see
`qwik-material/menu/SYNC.md`'s "Qwik v2 regression" section for the full root-cause writeup.
`renderOption` now wraps it: `{cloneJsxForReuse(option.content)}` instead of `{option.content}`.
No current select scenario passes non-plain-text `content`, so this is a no-op today
(`cloneJsxForReuse` returns a string unchanged) — applied preemptively since the bug is
understood and the fix is free for the common case.

## Qwik v2 regressions (2026-11-01) — reparented-overlay teardown crash + stale-blur focus race

Upgrading to `@qwik.dev/core` 2.0.0-rc.4 broke every `mat-select` scenario that closes its
panel via ANY path (Escape, outside click, selecting an option, Tab). Two stacked, independent
root causes, both confirmed live via fine-grained Playwright polls:

1. **Teardown crash.** `mat-select`'s overlay uses `withPopoverLocation('inline')`, so
   `OverlayRef.detach()`'s "reparented" branch ran — this threw a `NotFoundError:
   Failed to execute 'insertBefore' on 'Node'` from inside Qwik's own renderer, right at the
   ~100ms mark the panel's exit animation CSS completes. Fixed in shared `qwik-cdk/overlay`
   code (`overlay-ref.ts`) — see that package's own SYNC.md (or `_onReparented()`'s doc
   comment in `overlay-ref.ts` directly) for the full root-cause writeup; also fixes
   `qwik-material/autocomplete` (the only other `'inline'`-popover consumer).
2. **Stale-blur focus race.** Once (1) was fixed, 4 scenarios (`multiple`, `custom-trigger`,
   `placeholder`, `optgroups` via the autocomplete-side variant) still failed: clicking an
   option left `mat-focused`/`mdc-text-field--focused`/`mdc-line-ripple--active` all missing,
   despite `document.activeElement` never actually leaving the trigger. Root cause: the real
   browser blur a mousedown-on-a-non-focusable-option causes, and the explicit synchronous
   re-focus `selectOption()` issues right after, are handled by two separate `$()` QRLs
   (`onHostBlur$` and whatever handles the resulting focus event) that can resolve out of
   order on their FIRST-ever invocation under Qwik v2 (confirmed: the second click on the same
   select, chunks warm, never shows the glitch). Fixed in `mat-select.tsx`'s `onHostBlur$` —
   guards only the `focused` write (NOT `onTouched$`/`cancelTypeahead`, which should still fire
   on every real blur regardless of how quickly it bounces back — see that function's own
   comment). Same fix applied to `qwik-material/autocomplete/mat-autocomplete.tsx`'s
   `handleBlur$`.

### Resolved (2026-11-01): `outline-basic` — `mat-form-field-animations-enabled` never settles once the select opens

**Root cause found:** a conditional hook in `MatFormField` whose condition flipped mid-lifetime under Qwik v2's live JSX props, shifting later hooks — see form-field/SYNC.md "Conditional notch-measure hook frozen at mount". The investigation notes below are kept for history; the "Qwik v2 scheduler bug" hypothesis in them was wrong.

**Not fixed. Documented here with evidence after extensive investigation, same treatment as
`qwik-material/timepicker`'s own `min-max` open issue.**

`outline-basic` is the one `mat-select` scenario using `appearance="outline"` (every other
select scenario uses `fill`). Its `[press Enter]` step fails on exactly one class:
`mat-form-field-animations-enabled` missing from `<mat-form-field>`, even though:

- The SAME scenario with NO interaction at all (just page load + wait) gets the class at the
  expected ~300ms, every time.
- `fill-basic`, run through the IDENTICAL interaction sequence (open, ArrowDown, Enter), gets
  the class at ~300ms correctly, every time.
- Instrumenting `mat-form-field.tsx`'s `useVisibleTask$({strategy: 'document-ready'})` task
  directly (temporary `console.log`s, since removed) showed it RUNNING TWICE for
  `outline-basic` specifically — once at mount, once again right as the select opens (exactly
  when `appearance="outline"`'s OWN reactive notch-width `useTask$`, a few lines above it in
  the same component, also fires in reaction to `controlState.shouldLabelFloat` flipping true
  on open — `fill` has no notched outline, so that task is a no-op for it, the one real
  structural difference between the two scenarios). The 300ms `setTimeout` DID fire both times
  (also confirmed via the same logging), writing `animationsEnabled.value = true` — yet the
  class never appeared in the rendered output at any point, even 4+ seconds later.
- A `document.addEventListener('qinit', ...)` attached via `page.addInitScript` (before any
  page script runs) never logged a single event, despite `{strategy: 'document-ready'}`
  wiring a `useOnDocument('qinit', ...)` listener per Qwik core's own source
  (`node_modules/@qwik.dev/core/dist/core.mjs`) — inconclusive (either `qinit` isn't a plain
  bubbling event the way assumed, or something else about its dispatch wasn't captured this
  way), not pursued further given the time already spent.

This looks like a genuine Qwik v2 scheduler/hook-identity bug (an unrelated reactive update on
the same component causing an untracked `useVisibleTask$` to be treated as freshly registered,
landing its write on a disconnected signal instance) rather than anything specific to this
port's code, but the root cause was not conclusively isolated inside Qwik itself in the time
available. Only `outline-basic` is affected among all `mat-select`/`mat-autocomplete`
scenarios.

## Fixed: standalone `useContext` crash for the optional form-field contexts (2026-11-02)

This component's `useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined)`/`useContext(
MAT_FORM_FIELD_CONNECTED_ORIGIN, undefined)` calls were switched to `core/mat-form-field-
control.ts`'s new `useOptionalFormFieldControlState()`/`useOptionalFormFieldConnectedOrigin()`
— see that file's own SYNC.md entry for the full write-up (a real, previously-latent Qwik
`Code(Q8)` crash whenever this component is used with no `<MatFormField>` ancestor at all, found
porting `qwik-material/autocomplete`'s `autocomplete-plain-input` docs example). Zero behavior
change for every existing (always form-field-nested) scenario.

## Scroll-strategy configuration (2026-11-03)

Added `MAT_SELECT_SCROLL_STRATEGY` (mirrors upstream's `MAT_SELECT_SCROLL_STRATEGY` injection
token) + `<QwikMaterialProvider matSelectScrollStrategy={…}>`, threaded through
`SelectRuntimeConfig.scrollStrategyDescriptor` into `openSelectPanel()`'s overlay config
(previously hard-coded to `createRepositionScrollStrategy()`).

Uses the serializable `ScrollStrategyDescriptor` from the start (not the function-factory
pattern that caused the "scroll strategy lost after resume" bug elsewhere — see
`qwik-material/dialog/SYNC.md`'s entry of that name for the full root-cause write-up, found
working on `qwik-material/menu`'s identical addition). `MAT_SELECT_SCROLL_STRATEGY` is
`createContextId<ScrollStrategyDescriptor>(...)`; `MatSelect` reads it with a plain `{type:
'reposition'}` `useContext()` default (safe — plain descriptor data, not a function, so neither
`useContext()` default-value pitfall applies); `openSelectPanel()` is `async`, resolving the
descriptor via `resolveScrollStrategyDescriptor()` (`qwik-cdk/overlay`) immediately before
`overlay.create()` — only actually suspends for the `QRL<() => ScrollStrategy>` escape hatch,
so every existing fire-and-forget call site (never `await`ed) keeps working unchanged. A
non-default `matSelectScrollStrategy="block"` is covered by
`specs/material-select/scroll-strategy.spec.ts`.
