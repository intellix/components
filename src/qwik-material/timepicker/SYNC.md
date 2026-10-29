# qwik-material/timepicker sync log

Tracks the sync state between this port and `src/material/timepicker/`
upstream, plus the `DateAdapter`/`NativeDateAdapter`/`MAT_DATE_FORMATS`
abstraction added to `qwik-material/core` for it (see that package's own
`SYNC.md`). Companion to every other `qwik-material/*/SYNC.md`; the closest
analogue read before starting this port was `qwik-material/select/SYNC.md`
(same overlay/key-manager/form-field-control plumbing) — read that file
first if either doesn't make sense.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `scss/timepicker/timepicker.scss` | `src/material/timepicker/timepicker.scss` | synced | cdk-stub swap only (`@use '@angular/cdk'` → `@use '../cdk-stub' as cdk'`) |
| `scss/timepicker/_m2-timepicker.scss` | `src/material/timepicker/_m2-timepicker.scss` | synced | byte-identical |
| `scss/timepicker/_m3-timepicker.scss` | `src/material/timepicker/_m3-timepicker.scss` | synced | byte-identical |
| `scss/timepicker/_timepicker-theme.scss` | `src/material/timepicker/_timepicker-theme.scss` | synced | byte-identical, not referenced by the prebuilt CSS (same as every other `*-theme.scss`) |
| `scss/timepicker/timepicker-prebuilt.scss` | n/a | new | `@use './timepicker'` only — every `--mat-timepicker-*` token already has a real fallback baked in via `token-utils.slot(..., $fallbacks)` resolving the default M3 system theme at Sass compile time, same "no `:root` overrides needed" situation as `select-prebuilt.scss` |

## Public API

```tsx
import {
  useMatTimepicker,
  MatTimepickerInput,
  MatTimepickerToggle,
  formatTimeForDisplay,
} from '@angular-community/qwik-material/timepicker';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';

const value = useSignal<Date | null>(null);
const picker = useMatTimepicker<Date>({
  value: value.value,
  onValueChange$: $(v => (value.value = v)),
});
const invalid = picker.parseError.value || picker.minError.value || picker.maxError.value;

<MatFormField
  label={<MatLabel>Pick a time</MatLabel>}
  touched={picker.touched.value}
  dirty={picker.dirty.value}
  invalid={invalid}
  control={
    <MatTimepickerInput
      picker={picker}
      formBound
      value={formatTimeForDisplay(value.value) || undefined}
    />
  }
  iconSuffix={<MatTimepickerToggle picker={picker} />}
/>;
```

`useMatTimepicker<D>(options)` also accepts `interval`, `options` (a plain
`MatTimepickerOption<D>[]`, mirroring upstream's own type — mutually
exclusive with `interval`), `min`, `max`, `disabled`, `disableRipple`,
`panelClass`, `ariaLabel`/`ariaLabelledby`, and `onOpenedChange$`.

## Architecture: why there's a `useMatTimepicker()` hook instead of one component

Upstream's DOM needs **three independent sibling elements** inside one
`<mat-form-field>` — `<input matInput [matTimepicker]="picker">`,
`<mat-timepicker-toggle [for]="picker">`, and the empty marker
`<mat-timepicker #picker>` — cross-referenced via a template variable.
`MatSelect` (the closest ported analogue) never hit this problem because its
*entire* DOM is one component. Qwik's context only flows from a provider to
*its own* descendants, never sideways between two elements that merely
share a common ancestor (`<MatFormField control=… iconSuffix=…>` renders
both as independent descendants of *itself*, not of each other) — so state
all three need can't be threaded the way `MAT_FORM_FIELD_CONTROL_STATE`
connects `MatFormField` to *its own* descendant control.

`useMatTimepicker<D>()` is called **once**, by the consumer (a genuine
common ancestor *in scope*, not in the Qwik component-tree sense), and
returns a plain `MatTimepickerHandle<D>` — a bag of `Signal`s (never a
`useStore()`, never a QRL-bearing closure object) passed as an ordinary
`picker` prop to `<MatTimepickerInput>` and `<MatTimepickerToggle>`, and read
by the free functions in `timepicker-runtime.ts`. See `use-mat-timepicker.ts`'s
own doc comment for the full reasoning, including why `disabled`/`min`/`max`/
`interval`/`options` are hook options (re-synced live on every consumer
render) rather than props on `MatTimepickerInput` — passing them as props
on the *input* would make `MatTimepickerToggle` (a sibling, not a
descendant) unable to see them without relying on render-ORDER between two
unrelated components, which this port avoids entirely by sourcing them from
the hook call instead.

The empty `<mat-timepicker>` marker (`mat-timepicker-panel-id` attribute
only, matching upstream's `display: none` — see `timepicker.scss`) is
rendered as a `<>...</>` **Fragment sibling of the `<input>`**, inside
`MatTimepickerInput`'s own return value — not a separate component, and not
a new `MatFormField` prop. Confirmed correct via upstream's own
`form-field.html`: `<mat-timepicker-toggle matSuffix>` is pulled out of the
default projection by the `[matSuffix], [matIconSuffix]` selector (into
`.mat-mdc-form-field-icon-suffix` — this port's `iconSuffix` prop), but
`<input matInput>` and `<mat-timepicker>` (no projection selector matches
either) both fall through to the **same**, single, un-selected
`<ng-content></ng-content>` inside `.mat-mdc-form-field-infix`, in source
order — exactly what rendering them as Fragment siblings from
`MatTimepickerInput` reproduces, with no `MatFormField` changes needed.

### No first-open-vs-later-open quirk (unlike `mat-select`)

`mat-select`'s panel lands inside `<mat-select>` on the very first open and
inside `<mat-form-field>` on every open after (a genuine Angular
change-detection staleness artifact — see `select/SYNC.md`). Confirmed live
that `mat-timepicker` has **no such quirk**: `MatTimepicker._getOverlayRef()`
reads `this._input()!.getOverlayOrigin()` via a plain synchronous method
call, not a template binding fed by an imperatively-set field, so the panel
lands inside `<mat-form-field>` from the first open, every time. This port's
`openTimepickerPanel` therefore uses ONE element (the form field's wrapper,
falling back to the input itself) for both the position-strategy origin
*and* the popover insertion point — no `withPopoverInsertionOrigin()`
override needed, unlike select.

## `formBound`/`value`/`disabled`: required duplication on `<MatTimepickerInput>`

Every usage **must** pass `formBound` (literal `true`) and `value`
(`formatTimeForDisplay(picker.value.value) || undefined`, the exported
helper) on `<MatTimepickerInput>`, and `disabled` whenever the picker is
disabled. All three exist purely so `MatFormField`'s **static**
`readControlProps()` introspection (reading the un-rendered JSX descriptor,
before `MatTimepickerInput` ever runs — see `core/mat-form-field-control.ts`)
sees the right values at first (SSR) render:

- **`formBound` is always `true`, never optional in practice.** Every
  `MatTimepickerInput` has an implicit value-model (`picker.value`,
  `onValueChange$`) the same way upstream's `<input matInput [matTimepicker]
  ="picker" [(ngModel)]="value">`/`[formControl]` always has an `NgControl` —
  confirmed live: `MatFormField`'s own `[class.ng-untouched]`/
  `[class.ng-pristine]`/`[class.ng-valid]` host bindings (reading
  `this._control.ngControl`) are present on **every** timepicker scenario's
  `<mat-form-field>`, not just the one (`min-max`) that also shows
  `<mat-error>`s. There is no "unbound" shape to fall back to, unlike
  `MatInput`, so this is a fixed requirement rather than a real per-usage
  choice. (A future version could default it internally if `MatFormField`'s
  `readControlProps` is ever made to call a static method on the control
  type — not attempted here, out of scope.)
- **`value` is a plain truthiness marker (a string), not the real `Date`** —
  the real value stays on `picker.value`. Needed because `MatFormField`
  computes its own first-render `empty`/`shouldLabelFloat` (hence the
  floating label's `mdc-floating-label--float-above` class and the
  `mat-form-field-hide-placeholder` class) from `!controlProps?.value`
  *before* `MatTimepickerInput` ever runs. Confirmed live, a real bug caught
  by the `preset-value`/`disabled` scenarios (both start with a non-empty
  preset value): omitting this left the label never floating and
  `mat-form-field-hide-placeholder` present on the Qwik side only — writing
  `formField.empty`/`.shouldLabelFloat` from *inside* `MatTimepickerInput`'s
  own render (the technique `MatSelect` uses for its *own*, same-component
  state) does not fix this, because it runs too late — see
  `core/mat-form-field-control.ts`'s "SSR is single-pass" doc comment.
- **`disabled`** is the same "control reads its own prop live; `MatFormField`
  needs the static echo" duplication `touched`/`dirty`/`invalid` already
  have elsewhere in this port (see `core/mat-form-field-control.ts`).

`touched`/`dirty`/`invalid` are **not** props on `MatTimepickerInput` at
all (unlike `MatInput`'s own) — see the next section.

## `touched`/`dirty`/`parseError`/`minError`/`maxError`: tracked on the handle, not an external `FormControl`

Upstream's `MatTimepickerInput` provides **both** `NG_VALUE_ACCESSOR` and
`NG_VALIDATORS` on the directive itself — so even a bare `[(ngModel)]="value"`
(no explicit `Validators`) gets `matTimepickerParse`/`Min`/`Max` validation
and touched/dirty tracking automatically, from the directive's own
`_onTouched`/`_onChange`/`validate()` wiring, **not** from whatever
`NgControl` (`NgModel` vs. a bare `FormControl`) happens to be attached. This
port mirrors that by tracking `touched`/`dirty`/`parseError`/`minError`/
`maxError` directly on the shared `MatTimepickerHandle`, updated by
`timepicker-runtime.ts`:

- `closeTimepickerPanel` sets `touched.value = true` unconditionally —
  mirrors `timepicker.closed.subscribe(() => this._onTouched?.())` (closing
  by *any* means — selecting, Escape, Tab, outside click — touches).
- `handleTimepickerBlur` also sets `touched.value = true` when the panel
  was never opened — mirrors `_handleBlur()`'s own `if
  (!this.timepicker().isOpen()) this._onTouched?.()`.
- `assignUserSelection` (shared by typed input and picking an option) sets
  `dirty.value = true` — mirrors the CVA `onChange` call marking the
  implicit control dirty.
- `updateValidation` (called after every value change) recomputes
  `parseError`/`minError`/`maxError` from the current `value`/`min`/`max` —
  mirrors `_updateFormsState()`'s validator half.

The consumer reads `picker.parseError.value`/`.minError.value`/
`.maxError.value` directly to decide whether to render a `<MatError>` (the
same "the template decides, not the component" principle
`core/mat-form-control.ts` already establishes for `useMatFormControl()`),
and passes `picker.touched.value`/`.dirty.value`/the computed `invalid` as
**top-level** `<MatFormField touched=… dirty=… invalid=…>` props — the
`control`-prop-nested copy is only ever correct for the very first render
(same static-vs-live split every other `formBound` control in this port
already has — see `core/mat-form-field-control.ts`).

This means the `min-max` scenario needs **no** separate
`useMatFormControl()` at all, unlike `select`'s/`input`'s own `error-state`
routes: a bare upstream `FormControl` (no `Validators`) has the exact same
touched/dirty semantics as the implicit `NgModel` every other scenario
uses, both funneling through `MatTimepickerInput`'s own directive-level
wiring, not through whichever `NgControl` subclass is attached.

### `mat-form-field.tsx`: `ng-valid`/`ng-invalid` now gated by `!disabled` too

See `form-field/SYNC.md`'s deviation #10 for the full writeup — this port's
`disabled` scenario (the first control port to combine `formBound` with
`disabled`) surfaced a real, upstream-accurate gap: `AbstractControl.valid`/
`.invalid` both report `false` while `DISABLED`, so neither class should
apply; the shared `hostClasses` computation's single ternary previously
always produced exactly one of the two. Fixed with `formBound && !disabled
&& (invalid ? 'ng-invalid' : 'ng-valid')`. No-op for every other
`formBound` scenario (none of which are also disabled).

## `core/mat-option.tsx`: `echoValueAttribute` prop (new)

`MatOption`'s `value` prop previously *always* echoed as a literal `value`
DOM attribute — correct for `mat-select`, whose scenarios all write the
STATIC (bracket-less) `<mat-option value="apple">` in the Angular template,
which Angular keeps as a real attribute regardless of also matching an
`@Input()` name. Upstream's own `timepicker.html` instead writes
`<mat-option [value]="option.value">` — a **property binding**. Since
`MatOption` (`option.ts`) has no `[attr.value]` host binding at all, a
property binding like this **never** produces a DOM attribute in Angular.
Confirmed live (a genuine, repeatable parity failure on every scenario that
opens the panel, not a guess): the real Angular `<mat-option>` inside an
open timepicker panel has no `value` attribute whatsoever, while this
port's previous default produced one holding the option's raw
`Date.toString()`.

Fixed by adding `MatOptionProps.echoValueAttribute` (default `true`,
preserving `mat-select`'s existing behavior exactly) and `mat-timepicker-
panel.tsx` passing `echoValueAttribute={false}`. Purely additive; no
existing `mat-select` scenario is affected (its own `MatOption` call sites
never set the new prop, so the default holds).

## Key manager / overlay mechanics (mirrors `mat-select`, with simplifications)

- **`ListKeyManager`, no typeahead, no horizontal orientation** —
  `.withHomeAndEnd().withPageUpDown().withVerticalOrientation()` only,
  matching upstream's own `ActiveDescendantKeyManager` config exactly
  (`timepicker.ts`'s constructor). No option is ever individually disabled
  (`MatTimepickerOption` has no `disabled` field upstream), so every
  `TimepickerKeyItem`'s `disabled` is hardcoded `false`.
- **No separate overlay-level keyboard dispatcher.** Unlike `mat-select`
  (whose host div owns keyboard focus independently of the trigger),
  `mat-timepicker`'s real DOM focus never leaves the connected `<input>` —
  so `MatTimepickerInput`'s own `onKeyDown$` handles **both** the open and
  closed cases directly (`handleTimepickerInputKeydown` dispatches between
  `handleOpenKeydown`/`handleClosedKeydown`), with no
  `ensureCdkDispatchers().keyboardDispatcher` involved at all — there is
  nothing analogous to upstream's `_overlayRef.keydownEvents().subscribe(...)`
  to port, since that subscription exists only because upstream's overlay
  keydown events are themselves just a re-dispatch of the SAME physical
  keydown the input already receives directly in this port's architecture.
- **The outside-click dispatcher IS still needed** (no backdrop; dismissal
  is purely pointer-event-driven, matching upstream's own
  `hasBackdrop: false` + `outsidePointerEvents()`). `openTimepickerPanel`'s
  own handler additionally skips closing when the event target is the
  connected origin itself (or inside it) — mirrors upstream's `target !==
  origin && !origin.contains(target)` check in `_getOverlayRef()`.
- **"Fresh overlay + key manager per `open()` session"** — same
  simplification `select`/`tooltip` already establish; option ids are
  re-minted on every open (harmless: the parity harness digit-squashes
  every id).
- **No live re-sync of the active/selected option while the panel stays
  open** (upstream's `_handleInputStateChanges()` effect) — not exercised
  by any scenario (nothing types into the input while the panel is open in
  this port's own scenario set); `syncSelectedState` runs once, at
  `open()`.

## `MatTimepickerToggle`: doesn't render `<MatIconButton>` directly

`MatIconButton`'s own props don't expose `aria-haspopup`/`aria-expanded`/a
custom default `tabIndex` — all needed on the toggle's inner `<button>`.
Rather than widening `MatIconButton`'s public props for one caller, the
toggle imports the same internal building blocks `MatIconButton` itself uses
(`../button/internal/focus-indicator`, `./touch-target`, `./ripple-loader`,
`./disabled-attr`) directly — same ripple/focus-indicator/touch-target
structure, full control over the host `<button>`'s own attributes.
Cross-package relative imports like this are the established convention in
this monorepo (`dialog/qwik-material-provider.tsx` already imports from
`../button/button-config`, `../select/select-config`, etc. the same way;
Rollup code-splits the shared chunk rather than duplicating it).

- **Default `tabIndex` is `0`, not absent** — mirrors a genuine upstream
  quirk: `_defaultTabIndex` reads `inject(new HostAttributeToken('tabindex'),
  {optional: true})` (`null` when the template, as in every scenario here,
  never writes one) and does `Number(value)`. `Number(null)` is `0` in JS,
  **not** `NaN` — so `isNaN(parsed)` is `false` and the fallback tabIndex is
  `0`, not `null`. Confirmed live: every scenario's toggle button has a
  literal `tabindex="0"` even though nothing in any template sets one.
- **Custom icon is a named `icon` prop (`JSXOutput`), not `<Slot>`-projected
  content.** `<Slot>{defaultIcon}</Slot>` was tried first (mirroring
  `<ng-content select="[matTimepickerToggleIcon]"><svg>…</svg></ng-content>`'s
  own default-content shape) and found, via a real parity-test failure
  (missing `<svg>`, every other child off-by-one), to never render its
  fallback children at all when nothing is projected — Qwik's `<Slot>`
  default-content fallback doesn't behave like `<ng-content>`'s here. Fixed
  with a plain `props.icon ?? <svg>…</svg>` conditional, the same "named
  prop instead of `<Slot>`" pattern `MatSelect`'s own `customTrigger` prop
  already establishes.

## `MatTimepickerInput`: click-to-open bound to the `<input>` itself, not the form-field wrapper

Upstream binds the click listener to `getOverlayOrigin().nativeElement` (the
form field's connected-overlay origin — i.e. the *whole wrapper*, so
clicking anywhere in the field opens the picker). This port binds `onClick$`
directly to the `<input>` element instead: every parity scenario that opens
via a click (`openViaInput` in `angular-parity.spec.ts`) targets the input
itself, so the two are behaviorally indistinguishable for this project's own
scenario set. A future consumer needing "click anywhere in the field"
would need this widened back to the wrapper — not attempted here, since it
would require `MatFormField` to forward a click handler prop it doesn't
currently have (same category of gap `onWrapperClick$`'s own "no scenario
exercises this" note already accepts for the plain focus-on-click case).

## Known open issue: `min-max` scenario — a genuine Qwik 1.20 core crash, narrowed but not fully closed (updated 2026-10-29)

`angular-parity.spec.ts` passes 6/7 reliably (`basic-toggle`, `preset-value`, `interval`,
`custom-options`, `disabled`, `keyboard-nav`). `min-max` — the one scenario that passes a real
`errors` prop to `<MatFormField>` — hits a genuine, reproducible Qwik-core crash: `QWIK ERROR
Rendering promises in JSX signals is not supported`, thrown from Qwik's own runtime (not
application code), typically the first time `minError`/`maxError`/`parseError` flips true. This
is the SAME bug class `form-field/SYNC.md`'s `controlSnapshot` doc comment (deviation 9)
documents for `control` — replacing a `_fnSignal`-bound prop's element reference with a
brand-new one, whose underlying component's render QRL isn't resolved yet client-side, drops a
pending dynamic-import promise inside `executeSignalOperation`'s "replace" branch
(`node_modules/@builder.io/qwik/dist/core.mjs`, the maintainer's own `// TODO(misko): hook this
up`, confirmed by reading that exact code, not inferred).

**2026-10-29 fix, applied and confirmed load-bearing but NOT sufficient on its own — read this
section in full before touching this scenario again.**

### What was fixed, and confirmed via the compiled dist

`form-field/mat-form-field.tsx`'s `label`/`iconPrefix`/`textPrefix`/`iconSuffix`/`textSuffix`/
`hintStart`/`hintEnd`/`infixContent` props were ALL, previously, rendered as a direct
`{props.x}`-style child expression — the exact shape the Qwik optimizer compiles into an
isolated, unsafe `_fnSignal` binding (confirmed in the pre-fix compiled
`dist/mat-form-field.tsx_MatFormField_component_*.js`: `n((e) => e.iconSuffix, [e_props])` etc.,
one such binding per prop). `min-max`'s own route passes `iconSuffix={<MatTimepickerToggle
picker={picker} />}` and `label={<MatLabel>Pick a time</MatLabel>}` inline, reconstructed fresh
every time the ROUTE itself re-renders — which it does on every value/validation change, since
`invalid = picker.parseError.value || picker.minError.value || picker.maxError.value` is read in
a non-isolatable expression. Every one of `min-max`'s 6 sibling scenarios ALSO writes
`iconSuffix`/`label` this exact way, but only `min-max` ever actually triggers a POST-MOUNT
route re-render that needs `minError`/`maxError`/`parseError` to transition — so `min-max` was
uniquely exposed to this hazard for `iconSuffix`/`label`, independent of `errors` entirely. All 8
props are now frozen via a dedicated `useSignal(() => props.x)` snapshot, read once, mirroring
`controlSnapshot`'s already-established pattern exactly — see `form-field/SYNC.md`'s new
deviation 12 for the full writeup, including compiled-dist confirmation that the unsafe
`_fnSignal` wrapper is gone post-fix (now `n((e) => e.value, [frozenSignal])`, which never
re-fires since the signal itself is never reassigned).

`errors` itself did NOT need this treatment and still doesn't: it's read through
`toArray(props.errors).filter(...)`, which the optimizer can't reduce to the "bare prop access"
shape needed to extract an isolated `_fnSignal` — confirmed by inspecting the compiled dist, the
`showErrors ? <error-wrapper> : <hint-wrapper>` ternary is plain code inside `MatFormField`'s own
render function, going through Qwik's NORMAL, safe top-level component diff whenever
`MatFormField` itself re-renders (`renderComponent` → `smartUpdateChildren` →
`diffVnode`/`updateChildren`, confirmed by reading that path: its `promises` ARE fed into the
render's own `promiseAll(results)` await chain, unlike `executeSignalOperation`'s broken branch).
This is consistent with `qwik-material/form-field`'s own `error-state` scenario, which exercises
this exact "undefined → a brand-new `<MatError>`, reconstructed fresh every render, never frozen"
shape for `errors` and has never shown this failure mode — which is why the EARLIER mitigation in
this route (freezing `errors` into a `useSignal(() => <MatError>{errorLabel}</MatError>)`,
documented in previous revisions of this section) was a plausible-looking but ultimately
unnecessary fix for the wrong prop; it has been removed, and the route now passes `errors` the
plain, idiomatic way (an array of 3 independently-conditional `<MatError>` elements, one per
upstream `@if`, mirroring `error-state`'s own established convention — see the route file).

### What the fix did NOT resolve — confirmed via ablation, root cause still open

Systematic ablation testing (a standalone Playwright script hitting the Qwik preview server
directly, bypassing the parity harness, typing an out-of-range time and inspecting console
errors / CPU usage) against the FIXED `form-field.tsx` found the SAME `Rendering promises in JSX
signals is not supported` crash — and the SAME permanent, unrecoverable 100%+-CPU hang this bug
class causes once triggered (confirmed via direct process CPU inspection: once hit, the renderer
process never recovers, consistent with this section's own older "whole page then unresponsive"
note) — reproducible even with `<MatFormField style="..." control={<MatTimepickerInput
picker={picker} formBound value={...} />} />` **stripped of every other prop**: no `label`, no
`iconSuffix`, no `errors`, no top-level `touched`/`dirty`/`invalid`. In that configuration,
`MatFormField`'s own render has NO `JSXOutput`-valued `_fnSignal` binding left at all besides the
already-frozen `controlSnapshot` — ruling out `form-field.tsx`'s own slot-prop-forwarding
architecture as the (sole) remaining trigger for `min-max` specifically.

This means at least one more trigger exists, most likely inside `MatTimepickerInput`'s own
reactivity to `picker.minError`/`.maxError`/`.parseError` first becoming `true`, or in
`timepicker-runtime.ts`'s `handleTimepickerInput`/`assignUserSelection`/`updateValidation` call
chain, or in some Qwik-core mechanism not tied to the "JSX element forwarded as a child" pattern
this investigation was built around — NOT isolated before time ran out. Direct instrumentation of
`node_modules/@builder.io/qwik/dist/core.mjs` (which would have given an exact stack trace
through application code, the way the ORIGINAL `control`/chips root-cause was found) was
attempted but not completed in this pass — environment tooling declined the edit as a
too-risky/irreversible change to a third-party dependency file; a future attempt with that
permission granted should instrument `executeSignalOperation`'s two `logError('Rendering promises
...')` call sites directly (see `form-field/SYNC.md` deviation 9's own code excerpt for the exact
lines) to log the DOM element/component involved, which would identify the exact binding in one
run instead of further ablation.

**A confounding factor found during this investigation: reproduction rate is NOT constant.**
Repeated ablation runs crashed 3/3 while several earlier Playwright processes were still pegging
the CPU at 100%+ in the background (a separate hang from an earlier run, never recovering); once
those cleared, 5/5 immediate re-runs of the identical script against the SAME build were clean.
This is consistent with a genuine Qwik-core timing race (slower dynamic-import resolution under
CPU contention makes the "component QRL not yet resolved" precondition more likely to hold when
the replace path fires) rather than a deterministic logic bug — but it also means single-sample
ablation results (crashed vs. clean) are not individually conclusive; the 2026-10-29 fix's actual
effect on `min-max`'s failure RATE (as opposed to whether it's fully eliminated) was not cleanly
measured, for the same reason — see "Verification blocked" below.

### Verification blocked: the shared Angular reference app (port 4200) was down for this entire investigation

`http://localhost:4200/qwik-parity/<any route>/<any scenario>` — including scenarios with no
relationship to this fix (`mat-form-field/error-state`, `mat-timepicker/basic-toggle`) — returned
a fast, clean `404 Not found - Error 404` throughout this work, and `http://localhost:4200/`
itself 301-redirected to a raw Bazel runfiles filesystem path. The server process (`pid` serving
port 4200, a Bazel-built `devserver.runfiles`-based static `history-api-fallback` server) was
already running for 22+ hours at the time this was found, strongly suggesting its served output
is stale relative to recent `src/dev-app/qwik-parity/*` changes (this branch's own `feat(multiple):
merge port/timepicker` commit, for one) rather than anything this fix touched. Per this task's own
constraints, this app is shared infrastructure that must never be restarted/rebuilt from here — it
was not touched, and this finding is handed back as-is. Every `expectMaterialParity`-based spec
(ALL of `material-timepicker`, `material-form-field`, `material-select`, `material-autocomplete`,
`material-paginator`, `material-chips`, `material-stepper`) fails while this is down, regardless
of qwik-material's own correctness — confirmed by running the baseline (pre-fix) code through the
identical suite and observing the identical 100% failure signature. **The "passes 20/20"/"full
suite passes 3×" bars in this task could not be executed to a conclusive result because of this,
independent of whatever remains unresolved above.**

### Summary

- `pnpm -C src/qwik-material build && test && lint:no-ssr-leaks && typecheck` all pass with the
  fix in place — no regression to any existing scenario.
- The fix closes a real, confirmed, previously-undocumented category of unsafe `_fnSignal`
  bindings (`label`/`iconPrefix`/`textPrefix`/`iconSuffix`/`textSuffix`/`hintStart`/`hintEnd`/
  `infixContent`), generalizing deviation 9's `control` fix exactly as the architecture already
  implied it should. It is a real, non-speculative improvement, independent of whether it fully
  resolves `min-max`.
- It does NOT, by itself, confirmed-eliminate `min-max`'s crash — ablation shows a trigger
  remains outside `form-field.tsx`'s own rendering, most likely inside `MatTimepickerInput`/
  `timepicker-runtime.ts`'s reaction to the picker's validation signals.
- The Angular reference app being down blocked running this task's own specified verification
  (`--repeat-each=20`, the 3× full-suite runs) to a real pass/fail result for ANY scenario, not
  just `min-max`, independent of code correctness on either side.
- A future attempt, with the Angular reference app restored and (ideally) permission to
  instrument `node_modules/@builder.io/qwik/dist/core.mjs` directly, should (a) get an exact
  application-level stack trace at `executeSignalOperation`'s crash site to find the remaining
  trigger directly rather than by further ablation, and (b) re-run this task's own stress
  methodology (batched headless-Chromium repeats hitting the Qwik preview server directly,
  independent of Angular) under a quiescent system to get a real before/after failure-rate
  number, since reproduction rate is confirmed non-constant under CPU contention.

## Deviations from upstream (summary)

1. No `MAT_DATE_LOCALE`/live locale switching — `createNativeDateAdapter`'s
   `locale` is fixed at creation (`'en-US'` for the process-wide default
   used by every runtime code path). See `core/SYNC.md`'s datetime section.
2. `useDateAdapter()`/`useDateFormats()` (context-based, for future
   render-time/custom-locale use) are **not** used by any of this
   component's own interactive runtime code — `timepicker-runtime.ts`
   always uses the plain `DEFAULT_DATE_ADAPTER`/`MAT_NATIVE_DATE_FORMATS`
   module singletons directly, because a `$()`-wrapped event handler can't
   call `useContext()` (not a component render context) and a plain
   module-level constant sidesteps the serialization question entirely.
   No scenario needs a non-default adapter/locale, so this is an accepted,
   documented scope line, not a missing feature relative to any test.
3. No `ngDevMode`-gated constructor validation (`options`+`interval`
   mutual-exclusivity throw, empty-`options`-array throw,
   `validateAdapter`'s missing-provider throws) — every scenario here is
   already well-formed; a misuse simply produces an empty/odd option list
   rather than throwing.
4. `MatTimepickerInput._transformDateInput` (accepting a raw string/`Date`
   for `matTimepickerMin`/`Max` at the TEMPLATE level) is collapsed: this
   port's `useMatTimepicker({min, max})` only accepts `D | null` directly
   (always a `Date` in every scenario) — the consumer is expected to parse
   a string themselves if they have one, rather than this port duplicating
   `DateAdapter.parseTime`/`.deserialize`'s dispatch inline a second time.
5. See the "formBound/value/disabled" section above for the three
   static-introspection props every usage must duplicate, and the "touched/
   dirty" section for why there's no `MatTimepickerInput.onTouched$`/
   `onDirty$` prop (the picker tracks both internally instead).
