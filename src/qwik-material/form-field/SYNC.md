# qwik-material/form-field sync log

Tracks the sync state between this port and `src/material/form-field/`
upstream. Companion to `src/qwik-material/dialog/SYNC.md`,
`src/qwik-material/button/SYNC.md`, `src/qwik-material/card/SYNC.md`,
`src/qwik-material/toolbar/SYNC.md`, `src/qwik-material/badge/SYNC.md`,
`src/qwik-material/icon/SYNC.md`, `src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
`src/qwik-material/slide-toggle/SYNC.md`, `src/qwik-material/expansion/SYNC.md`,
`src/qwik-material/radio/SYNC.md`, `src/qwik-material/checkbox/SYNC.md`, and
`src/qwik-material/core/SYNC.md`. Paired 1:1 with
`src/qwik-material/input/SYNC.md` (`MatInput` is this component's primary,
and so far only, consumer).

Ported 2026-10-28 against upstream per
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`.
Gated from the start by `specs/material-form-field/angular-parity.spec.ts`
(16 scenarios).

## The architecture problem this port had to solve (read this first)

Upstream's `MatFormField` discovers its label/hints/errors/prefixes/
suffixes/control via Angular content projection (`<ng-content select="...">`)
plus `@ContentChild(ren)` queries, and reads the control's derived state
(`empty`, `shouldLabelFloat`, `errorState`, `focused`, ...) through the
abstract `MatFormFieldControl` interface via `AfterContentInit`/
`AfterContentChecked` + a `stateChanges` Observable the control fires on —
machinery that lets a PARENT re-evaluate its own template bindings strictly
AFTER a CHILD has initialized or changed, repeatedly, driven by Angular's
zone-based change detection.

Qwik's SSR has no equivalent: it is a single synchronous pass. A parent
component's own returned JSX — including the class/attribute expressions on
its own host tag — is fully evaluated and fixed BEFORE any of its
`<Slot>`-projected (or prop-passed) child ever runs its own render function
(the renderer only descends into a `<Slot>`'s content once it reaches that
point in the ALREADY-RETURNED parent tree). This was not assumed; it was
checked. A throwaway test route (`Parent` providing a `useStore()` via
context, a nested `Child` mutating that SAME store synchronously during its
own render body, `Parent`'s host class reading the store field) was built,
built+previewed through the real production SSR path, and curled: the
parent's SSR HTML showed the STALE seed value, not the child's write — even
though both ran in the very same synchronous SSR pass. A second variant
(`Child` using `useVisibleTask$` instead of a render-time write) was then
loaded in a real headless browser via Playwright: after hydration + a short
wait, the parent's class DID update to reflect the child's write — confirming
that only a genuinely later, client-only trigger (anything that runs after
the initial render, whether a mount task or — the mechanism this port
actually uses — a real event handler) can retroactively update an ancestor
that already rendered once, and that it does so correctly regardless of
which component in the tree the signal write came from (Qwik's reactivity is
subscription-based, not hierarchy-aware).

Early drafts of this port tried to patch that gap with a per-instance
`useVisibleTask$` that pushed the control's state up into `MatFormField` on
mount. The project coordinator flagged this directly: a page can have many
form fields, and an eager per-instance mount task on every one of them is
exactly the "eager per-instance JS" design doc rule 7 exists to prevent — and
it would still ship the WRONG classes until hydration, since the write
happens after the SSR pass that mattered. The fix adopted instead, and the
one actually implemented:

1. **Everything knowable synchronously (the vast majority of a form field's
   state) is read directly off the `control` prop's JSX descriptor — WITHOUT
   ever rendering/executing it.** A JSX element like `<MatInput value="x"
   disabled />` is, before Qwik ever calls `MatInput`'s function, just a
   plain data object `{type: MatInput, props: {value: 'x', disabled: true}}`
   — `core/mat-form-field-control.ts`'s `readControlProps()` reads `.props`
   straight off that object. This is the SAME trick `qwik-material/list`'s
   `MatListItem` already uses for a narrower case (section presence/count);
   this port extends it to reading actual prop VALUES. Since this happens
   during `MatFormField`'s OWN render, before `MatInput` ever executes,
   there is no ordering problem at all — the very first SSR render is
   correct for free. This is why every piece of projected content
   (`label`/`hintStart`/`hintEnd`/`errors`/`iconPrefix`/`textPrefix`/
   `iconSuffix`/`textSuffix`/`control`) is a NAMED PROP holding a JSX value,
   never a nested `<Slot>` child.
2. **The 3 fields that truly have no consumer-visible owner and change ONLY
   after a real user interaction** (`focused`, `empty`, `shouldLabelFloat` —
   see `core/mat-form-field-control.ts`'s `MatFormFieldControlState`) live in
   a tiny `useStore()` `MatFormField` creates, seeds from (1), and provides
   via the `MAT_FORM_FIELD_CONTROL_STATE` context. The rendered control
   (`MatInput`) writes into this store from its own ORDINARY, LAZILY-LOADED
   `onFocus$`/`onBlur$` handlers — real event handlers, not a mount task —
   and `MatFormField`'s render, having read the store during its own render,
   reactively re-renders on any write, exactly as confirmed by the
   experiment above.
3. **Everything else that upstream computes reactively per-control**
   (`required`-derived-from-validators, `errorState`, the `ng-*` classes) is
   computed by the ROUTE/consumer — who already owns whatever drives it
   (`useMatFormControl()`, see `core/mat-form-control.ts`) — and handed to
   BOTH `<MatFormField>` and the control itself, as plain props. No function
   or getter ever crosses a component boundary (see `input/SYNC.md` and
   `core/mat-form-control.ts`'s own doc comment for why that specifically
   was avoided too). **Correction, found during `error-state` debugging
   (see the dedicated section below): an earlier draft of this paragraph
   claimed the `<MatFormField>` copy could be handed through channel (1)
   alone (nested inside `control`'s own JSX descriptor) "as fresh plain
   booleans on every re-render". That is false — channel (1) is read ONCE,
   at the moment `readControlProps()` first runs, and never again. For any
   field that genuinely needs to change after mount (today: `touched`/
   `dirty`/`invalid`), the consumer hands it to `<MatFormField>` a SECOND
   time, as a genuine top-level prop, which the field then is.**
4. **`MatFormField` owns id generation for the label, every hint, every
   error, AND the control** (injecting a generated id via a
   clone-with-overridden-props helper, `withProps()`/`withGeneratedId()`,
   when the consumer didn't set one explicitly) rather than each directive
   generating its own the way upstream does. This is a deliberate, forced
   deviation: the label's `for` attribute and the control's `id` must agree
   with each other, and `aria-describedby` must agree with whatever hints/
   errors actually get ids — but nothing can "fix up" a mismatch after the
   fact once rendered, so ONE place has to decide all of them up front, and
   `MatFormField` is that place.

## A real Qwik reactivity limitation found via `error-state` (read this if touching `touched`/`dirty`/`invalid`/`empty`)

`error-state` (the one scenario exercising `useMatFormControl()` — see
`core/mat-form-control.ts`) initially shipped with `touched`/`dirty`/
`invalid` passed to `<MatFormField>` SOLELY as fields nested inside
`control`'s own JSX descriptor (`<MatFormField control={<MatInput
touched={fc.touched} .../>}>`), on the (wrong, see above) assumption that
`readControlProps()` would see a fresh value on every `MatFormField`
re-render. In practice, blurring the field never produced `ng-touched`,
`ng-dirty`, a visible `<mat-error>`, or a correct `aria-invalid` — not
flakily; reproducibly, 100% of the time, with no amount of extra waiting
(confirmed via instrumented diagnostics up to 2.5s) — even though the
underlying `useMatFormControl()` store DID correctly flip `touched` to
`true` internally (confirmed via logging inside `markAsTouched$` itself,
and via an explicit `useTask$(({track}) => track(() => fc.touched))`,
which DID fire correctly).

Root cause, isolated via a series of minimal reproductions in a throwaway
route (each built+previewed through the real production path, not a unit
test, since this is specifically about Qwik's client-side reactivity
after resumption):

- A plain JSX child expression (`<div>{store.touched ? 'a' : 'b'}</div>`)
  updates correctly without its enclosing `component$` ever visibly
  re-running from the top.
- A DIRECT, top-level prop on a component RETURNED BY the same enclosing
  function (`<SomeChild touched={store.touched} />`) ALSO updates
  correctly — even when `SomeChild` is nested several DOM levels deep
  inside an intermediate wrapper component that renders it via
  `{props.content}` (an opaque forward, structurally identical to how
  `MatFormField` renders `{props.control}`). So "a JSX element forwarded
  opaquely through another component's prop" is NOT, by itself, the
  problem — Qwik's fine-grained per-prop update tracking reaches through
  that forwarding correctly.
- The SAME value, nested ONE level further — as a prop on a JSX element
  that is ITSELF the value of ANOTHER prop (`<Outer inner={<Inner
  touched={store.touched} />} />` — exactly `<MatFormField
  control={<MatInput touched={fc.touched} />}>`'s shape) — does NOT
  update. `readControlProps(props.control)?.touched` on `Outer`'s OWN
  re-renders (triggered by something unrelated) kept returning the
  ORIGINAL value, forever, confirmed directly by logging it on every
  `MatFormField` render.

So the dividing line is specifically: Qwik's optimizer generates a live,
fine-grained update binding for a prop sitting directly on an element
returned from a component's own JSX tree (at ANY resulting DOM depth, once
rendered) — but NOT for a prop buried inside the VALUE of a DIFFERENT
prop, one syntactic level removed from where the enclosing function
actually "returns" it. `<MatInput touched={fc.touched} .../>` as the
value of `<MatFormField control={...}>` is exactly that second shape: it
is constructed once, handed to `MatFormField` as inert data, and never
reconstructed, regardless of how many times anything re-renders
afterward.

The fix, applied consistently for `touched`/`dirty`/`invalid`:

1. The consumer passes them a SECOND time, as genuine top-level props
   directly on `<MatFormField touched={...} dirty={...} invalid={...}
   control={<MatInput touched={...} .../>}>` (see `MatFormFieldProps`'s
   doc comment). The nested copy on `<MatInput>` is kept — it is still
   correct for the very first render, and still needed for the
   `formBound` static-detection channel (1) above — but is no longer
   relied on for anything that must update after mount.
2. `MatFormField` prefers these top-level props over the nested
   `control`-prop snapshot (`props.touched ?? controlProps?.touched ??
   false`, same for `dirty`/`invalid`), so its OWN rendered classes
   (`ng-touched`/`ng-dirty`/`ng-invalid`, `errorState`, `showErrors`) are
   correctly live — this is the SAME proven-working shape (a prop directly
   on the element `MatFormField`'s own PARENT returns) that the isolated
   reproductions confirmed works.
3. `MatFormField` writes `touched`/`dirty`/`invalid` into the SAME
   `MAT_FORM_FIELD_CONTROL_STATE` context store `focused`/`empty`/
   `shouldLabelFloat`/`assignedId`/`assignedDescribedBy` already live in
   (guarded, same "skip the write if the value is unchanged" treatment as
   `assignedId` — see that field's own comment for why), so `MatInput`
   (reading the context store directly during ITS OWN render, exactly the
   mechanism `assignedId`/`assignedDescribedBy` already proved out) picks
   up the live value too, without needing `MatFormField` to re-render it
   via a fresh `control` prop at all.
4. `props.errors` (the visible `<mat-error>` content) did NOT need this
   same treatment — it was ALREADY a top-level `<MatFormField errors={...}>`
   prop (never nested inside `control`), so it was always in the
   proven-working shape; once (2)'s `errorState`/`showErrors` became live,
   the error message's visibility started following it correctly for
   free.

One more field needed an analogous (but simpler, single-component-local)
fix: `MatInput`'s own `empty` (used for its `aria-invalid` computation) was
computed from `!props.value` — but `value` is nested inside the SAME
frozen `<MatInput>` descriptor, for the exact same reason. Rather than
threading `value` through the context store too, `MatInput` tracks its own
`emptySignal` locally, updated directly inside its OWN `handleInput$`/
`handleBlur$` from the live DOM element (`inputRef`) it already holds — no
cross-component channel needed, since the thing that needs the live value
(the `aria-invalid` computation) and the thing with direct access to the
live DOM (the input/blur handlers) are the SAME component. See
`input/SYNC.md`'s matching note.

**Takeaway for future controls (select/autocomplete/datepicker/chips):**
any field on the shared control contract that must change AFTER the first
render needs to reach the component that renders off it either (a) as a
genuine top-level prop on an element returned directly from the OWNING
component's own JSX (never nested inside the value of another prop), or
(b) through the `MAT_FORM_FIELD_CONTROL_STATE` context store. A field
nested inside `control`'s (or `errors`'/`label`'s/etc.'s) own JSX
descriptor is fine for anything that is correct once and stays correct —
but is a trap for anything that needs to change later.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `form-field/mat-form-field.tsx` | `src/material/form-field/form-field.ts` (687 LOC) + `form-field.html` (122 LOC) | ported | See the architecture section above for the core design. `appearance`/`floatLabel`/`hideRequiredMarker`/`subscriptSizing`/`color` resolve `props.x ?? config.x ?? upstream-default`, matching the established per-field-fallback convention. Line-ripple activate/deactivate/transitionend reproduces the "permanently `--deactivating` until first interaction" pristine quirk (`_updateFocusState`'s `_isFocused === null` initial branch) via 2 independent boolean signals, not a single enum, because upstream's `activate()`/`deactivate()` are genuinely independent (one never touches the other's class). Outline notch width (`_setNotchWidth`, `NOTCH_ELEMENT_PADDING`/`NOTCH_ELEMENT_BORDER` = 8+1=9) is measured lazily off `Element.scrollWidth` (an integer — not the sub-pixel-sensitive `getBoundingClientRect` prefix-offset calc the outline+prefix/suffix combination would need, which no scenario here exercises — see deviation #2) via a `useTask$` that tracks the control-state store's `shouldLabelFloat` field DIRECTLY (not a derived local — see the "track() must dereference inside its own callback" comment in the source, a real bug caught and fixed during this port) |
| `form-field/mat-label.tsx` | `src/material/form-field/directives/label.ts` (`MatLabel` directive) | ported | Renders a literal `<mat-label>` custom element (bare directive, no host bindings upstream — confirmed it's NOT unwrapped: it nests inside `MatFormField`'s own `<label matFormFieldFloatingLabel>` wrapper) |
| `form-field/mat-hint.tsx` | `src/material/form-field/directives/hint.ts` (`MatHint` directive) | ported | `align` defaults `'start'`; id normally injected by `MatFormField` (see deviation #4 below), overridable explicitly |
| `form-field/mat-error.tsx` | `src/material/form-field/directives/error.ts` (`MatError` directive) | ported | Same id-ownership note as `MatHint` |
| `form-field/mat-affix.tsx` | `src/material/form-field/directives/prefix.ts` + `suffix.ts` (`MatPrefix`/`MatSuffix`, one directive each covering 3 attribute spellings) | ported (split) | Upstream's single `MatPrefix`/`MatSuffix` directive (selector `[matPrefix],[matIconPrefix],[matTextPrefix]`, `_isText` distinguishing only the `matTextPrefix` spelling) is split into 4 dedicated components (`MatIconPrefix`/`MatTextPrefix`/`MatIconSuffix`/`MatTextSuffix`) since `MatFormField` needs the icon-vs-text distinction as a NAMED PROP anyway — see deviation #3. Each renders a bare `<span>` with the literal selector attribute and no Material-added classes (confirmed live: those live on `MatFormField`'s own wrapping container) |
| `form-field/form-field-config.ts` | `src/material/form-field/form-field.ts` (`MatFormFieldDefaultOptions` interface + `MAT_FORM_FIELD_DEFAULT_OPTIONS` InjectionToken, lines 68-92) | new | `MatFormFieldConfig` carries all 5 upstream fields; `MAT_FORM_FIELD_CONFIG_DEFAULTS` mirrors `DEFAULT_APPEARANCE`/`DEFAULT_FLOAT_LABEL`/`DEFAULT_SUBSCRIPT_SIZING` + `MatFormField`'s own `color: ThemePalette = 'primary'` field initializer — **note this is `'primary'`, not `'accent'`; do not assume parity with the checkbox/radio/checkbox-family default** (confirmed by the `colors` scenario); folded into `QwikMaterialProvider.matFormFieldConfig` |
| `core/mat-form-field-control.ts` | `src/material/form-field/form-field-control.ts` (`MatFormFieldControl<T>` abstract class) | new (port of the CONTRACT, not a 1:1 class port) | See the architecture section above. `MatFormFieldControlProps` (the static half) + `MatFormFieldControlState`/`MAT_FORM_FIELD_CONTROL_STATE` (the reactive half) + `readControlProps()`. Lives in `core/` (not `form-field/`) since it's the shared contract future controls (select/autocomplete/datepicker/chips) plug into, same placement rationale as `MatInternalFormField` |
| `scss/form-field/form-field.scss` | `src/material/form-field/form-field.scss` (219 LOC) | synced | Byte-for-byte copy, zero `@angular/cdk` references itself (its partials have the 2 that need the cdk-stub swap, see below) |
| `scss/form-field/_mdc-text-field-structure.scss` | `src/material/form-field/_mdc-text-field-structure.scss` (609 LOC — the bulk of the MDC text-field structural CSS, also `matInput`'s own classes, which have no separate stylesheet — see `input/SYNC.md`) | synced | Byte-for-byte copy with the one allowed edit: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (line 1), for the `cdk.high-contrast` mixin |
| `scss/form-field/_form-field-high-contrast.scss` | same name upstream | synced | Same cdk-stub swap (line 1) |
| `scss/form-field/_form-field-focus-overlay.scss`, `_form-field-native-select.scss`, `_form-field-subscript.scss`, `_mdc-text-field-density-overrides.scss`, `_mdc-text-field-structure-overrides.scss`, `_mdc-text-field-textarea-overrides.scss`, `_user-agent-overrides.scss` | same names upstream | synced | Byte-identical copies; no `@angular/cdk` references, no edits needed. All 7 are actually `@use`d by `form-field.scss` (the structural partials that compile into real output), unlike the 3 below |
| `scss/form-field/_form-field-theme.scss`, `_m2-form-field.scss`, `_m3-form-field.scss` | same names upstream | synced | Byte-identical copies. `_m3-form-field.scss` IS transitively compiled (`form-field.scss` `@use`s it directly for `$fallbacks: m3-form-field.get-tokens()`); `_form-field-theme.scss`/`_m2-form-field.scss` are theme-mixin-only and never `@use`d by `form-field-prebuilt.scss`, kept for `diff -q` parity only — same precedent as every other component's theme partials |
| `scss/form-field/form-field-prebuilt.scss` | (qwik-material-specific) | new | `@use` form-field.scss + `:root` defaults for every `--mat-sys-*` token its `token-utils.slot(...)` fallback chain resolves through (compiled + grep-verified — see the file's own header comment for the exact reconciliation, including the 3 tokens deliberately left without a `:root` default, matching upstream's own M3 output). Also covers `matInput`'s own classes (no separate `input-prebuilt.css` — see `input/SYNC.md`) |

## Removed upstream files

- `form-field-module.ts` — Qwik has no module concept
- `testing/` (`MatFormFieldHarness`, `MatFormFieldControlHarness`) — Angular test harness surface; no equivalent needed
- `form-field-errors.ts` (`getMatFormFieldMissingControlError`/`getMatFormFieldDuplicatedHintError`) — dev-mode `ngDevMode`-gated throws with no Qwik equivalent; this port renders gracefully with a missing control/duplicate hints instead of throwing (deviation #1)
- Upstream `public-api.ts`/`index.ts` — replaced with this port's own re-export shape
- `directives/notched-outline.ts`/`.html` (`MatFormFieldNotchedOutline` component) — folded directly into `mat-form-field.tsx`'s own JSX (it's `MatFormField`'s own internal structure, not separately reusable in this port's architecture)
- `directives/floating-label.ts` (`MatFormFieldFloatingLabel`) — folded directly into `mat-form-field.tsx`'s own JSX (the label wrapper `<label>` is form-field's own rendered element, not a reusable directive target, in this port)
- `directives/line-ripple.ts` (`MatFormFieldLineRipple`) — folded directly into `mat-form-field.tsx`'s own JSX (same reasoning)

## Deviations from upstream

1. **No `ngDevMode`-gated error throws.** `getMatFormFieldMissingControlError`/
   `getMatFormFieldDuplicatedHintError` have no port — a `MatFormField` with no
   `control` prop renders without one rather than throwing; multiple
   `hintStart`/`hintEnd`/`hintLabel` combinations are simply rendered as
   given, with no "at most one per side" validation. No parity scenario
   exercises either misuse.

2. **The outline + prefix/suffix label-offset calculation
   (`_getOutlinedLabelOffset`, `getBoundingClientRect`-based, writing a
   `transform`/`--mat-form-field-notch-max-width` CSS variable) is not
   ported.** No scenario combines `appearance="outline"` with any
   prefix/suffix (confirmed by `angular-parity.spec.ts`'s own WIDTH note:
   this combination is deliberately avoided in the scenario set as a
   needless cross-app sub-pixel-float flake risk). The notch WIDTH formula
   (scrollWidth-based, no prefix involved) IS ported — see the sync table.
   A future consumer needing outline+prefix/suffix together would need this
   added, following the same lazy-measurement pattern the notch width uses.

3. **`MatPrefix`/`MatSuffix`'s single-directive-3-selectors shape is split
   into 4 dedicated components** (`MatIconPrefix`/`MatTextPrefix`/
   `MatIconSuffix`/`MatTextSuffix`), with no bare, undistinguished
   `matPrefix`/`matSuffix` equivalent in this port's surface. No scenario
   uses that spelling; a future consumer needing it can use the icon
   variant (identical render output — same selector-attribute category
   either way).

4. **`MatFormField` owns id generation for the label, every hint, every
   error, and the control** (via `withGeneratedId()`, generating one only
   when the consumer didn't already set an explicit `id`), rather than each
   piece generating its own via its own `inject(_IdGenerator)` the way
   upstream's `MatHint`/`MatError`/`MatInput` each do. Forced by the SSR-
   ordering constraint described in the architecture section — see there
   for the full reasoning. The externally OBSERVABLE behavior (auto-
   generated, sequential, correctly-prefixed, correctly-cross-referenced
   ids) is unchanged; only the internal OWNERSHIP of id generation moved.

5. **`_forceDisplayInfixLabel()` (the SSR-only "no `ResizeObserver` on the
   server, so pre-measure as if the label were in the infix" fallback) is
   not ported.** It only matters for outline+prefix, which (per deviation
   #2) no scenario exercises; this port's outline label always renders
   inside the notch.

6. **`Directionality`/RTL is not threaded through** the outline label-
   offset calculation (which doesn't exist here per deviation #2 anyway) —
   same "no scenario exercises RTL" note as every other ported component.

7. **`ChangeDetectorRef`/`NgZone`/`Renderer2`/`stateChanges` Subject/
   `_describedByChanges`/`_valueChanges` subscriptions dropped entirely.**
   No change-detection system to notify; Qwik signal/prop reactivity (plus
   the architecture described above) is its own trigger. `_CdkPrivateStyleLoader`/
   `_StructuralStylesLoader` lazy style injection → N/A, this port's CSS is
   always-loaded prebuilt CSS, same as every other qwik-material component.

8. **Angular-specific removals:** `@Component`/`@Directive` decorators,
   `@Input`/`@ViewChild`/`@ContentChild(ren)` decorators,
   `coerceBooleanProperty`/`BooleanInput`, `inject()` DI, `afterRenderEffect`,
   `computed()`/`signal()`/`effect()` → plain props + Qwik hooks/context/
   refs/tasks. `exportAs: 'matFormField'` → N/A. `ViewEncapsulation.None` +
   host bindings → plain JSX attribute/class computation.

9. **`props.control` is snapshotted ONCE (into a `useSignal`) on `MatFormField`'s own first
   render, and `props.control` is never read again after that — a deliberate deviation added
   to work around a genuine Qwik 1.20 CORE bug, not an upstream behavior difference.** `{props.control}`
   rendered directly, as a prop forwarded straight through from a parent, compiles to a
   `_fnSignal`-wrapped binding (this is the SAME mechanism this file's own architecture
   section relies on for live reactivity elsewhere) that Qwik re-evaluates via
   `executeSignalOperation` whenever `control`'s JSX-object reference changes — which happens
   on every parent re-render for any consumer that reconstructs its control element inline
   (the natural way to write it, e.g. `control={<MatChipGrid rows={rowsSignal} .../>}`).
   Confirmed live by instrumenting Qwik's own built dist: that binding's "replace the old
   element" path collects async QRL-resolution promises from `createElm()` into an array the
   dist's own source marks `// TODO(misko): hook this up` and then never awaits — logged as
   "Rendering promises in JSX signals is not supported" — before unconditionally running
   `insertBefore`/`removeNode` anyway, which can leave the replacement element transiently
   (usually ~1ms, not always) disconnected from the live DOM. This surfaced as `qwik-material/
   chips`' `grid-input` scenario intermittently losing `<mat-chip-grid>` entirely — see
   `chips/SYNC.md`'s Deviation #8 for the full root-cause writeup and verification evidence.
   Freezing `control`'s reference here means the `_fnSignal` binding for it never fires again
   after mount, so the broken path is never reached, for ANY current or future consumer —
   with no new constraint on top of what was already documented: `control`'s nested prop
   VALUES were already "read once, never again" for everything that matters (deviation
   addressed in the architecture section above), so freezing the reference too changes
   nothing for any already-supported use case (confirmed: `error-state`, which exercises the
   OTHER, genuinely-live half of this contract — top-level `touched`/`dirty`/`invalid` — still
   passes).

10. **`infixContent` prop added for `qwik-material/paginator`.** Upstream's single unnamed
    `<ng-content>` inside `.mat-mdc-form-field-infix` projects every non-prefix/suffix child in
    source order, not just the one `MatFormFieldControl` — `mat-paginator`'s page-size
    `<mat-form-field>` has a second infix child (`<div class="mat-mdc-paginator-touch-target">`,
    a sibling of `<mat-select>`). `MatFormField` now renders an `infixContent?: JSXOutput` prop
    immediately after `controlSnapshot.value` inside the infix div. Read directly off `props` on
    every render (NOT through `control`'s "frozen snapshot, read once" treatment above) — this
    content is a plain host element with no `component$()` of its own, so none of the
    reconciliation hazard deviation 9 documents applies to it. See
    `qwik-material/paginator/SYNC.md`.

## Class count

`grep -rnE "^export class" src/qwik-material/form-field/ 2>/dev/null` → 0
(no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest &&
lint:no-ssr-leaks && typecheck` for the whole qwik-material package,
covering dialog + button + card + toolbar + badge + icon + progress-bar +
progress-spinner + divider + grid-list + list + button-toggle + slide-toggle
+ expansion + radio + checkbox + form-field + input + core.
