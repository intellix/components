# qwik-material/checkbox sync log

Tracks the sync state between this port and `src/material/checkbox/`
upstream. Companion to `src/qwik-material/dialog/SYNC.md`,
`src/qwik-material/button/SYNC.md`, `src/qwik-material/card/SYNC.md`,
`src/qwik-material/toolbar/SYNC.md`, `src/qwik-material/badge/SYNC.md`,
`src/qwik-material/icon/SYNC.md`, `src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
and `src/qwik-material/core/SYNC.md`.

Ported 2026-10-28 against upstream per
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`
(wave 1). Gated by `specs/material-checkbox/angular-parity.spec.ts`
(13/13 scenarios passing, run repeatedly — see "Known flakiness" below).

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `checkbox/mat-checkbox.tsx` | `src/material/checkbox/checkbox.ts` (540 LOC) + `checkbox.html` (57 LOC, inlined) | ported | Controlled-with-internal-fallback `checked`/`indeterminate` (see deviation #1). Implements the full `TransitionCheckState` state machine (`_transitionCheckState`/`_getAnimationClassForCheckStateTransition`) via a per-instance `currentCheckState` signal + a `transitionClass` signal (added on click, cleared via `setTimeout(…, 1000)`) rendered into the input's class array — not a direct `classList.add/remove` on a captured element, because Qwik's `class` prop replaces `className` wholesale every render (same reasoning as `mat-button-toggle.tsx`'s focus-origin classes). `_handleInputClick`/`_onInputClick`/`_onTouchTargetClick`/`_preventBubblingFromLabel` all ported (see deviation #3 for the one piece NOT ported: the Validator/CVA machinery). `color`/`clickAction`/`disabledInteractive` resolve `props.x ?? config.x ?? ownDefault`, matching the `MatBadgeConfig`-established per-field-fallback convention (`props.x ?? config.x ?? default`, NOT relying solely on the context's own DEFAULTS fallback — see badge/mat-badge.tsx) |
| `checkbox/checkbox-config.ts` | `src/material/checkbox/checkbox-config.ts` (51 LOC) | new | `MatCheckboxConfig` (`color`/`clickAction`/`disabledInteractive`) + `MAT_CHECKBOX_CONFIG` context id + `MAT_CHECKBOX_CONFIG_DEFAULTS` (`{color: 'accent', clickAction: 'check-indeterminate', disabledInteractive: false}`, mirrors upstream's `checkboxDefaults`); folded into `QwikMaterialProvider.matCheckboxConfig` |
| `scss/checkbox/checkbox.scss` | `src/material/checkbox/checkbox.scss` (110 LOC) | synced | Byte-for-byte copy with the one allowed edit: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (line 1) |
| `scss/checkbox/_checkbox-common.scss` | `src/material/checkbox/_checkbox-common.scss` (563 LOC) | synced | Byte-for-byte copy with the same cdk-stub swap (line 2). The large structural + MDC-keyframe-animation mixin file `checkbox.scss` `@include`s |
| `scss/checkbox/_checkbox-theme.scss` | `src/material/checkbox/_checkbox-theme.scss` | synced | byte-identical copy; theme mixin inert on our end (not `@use`d by `checkbox-prebuilt.scss`) but kept for `diff -q` parity — matches every other component's `_*-theme.scss` precedent |
| `scss/checkbox/_m2-checkbox.scss` | `src/material/checkbox/_m2-checkbox.scss` | synced | byte-identical copy |
| `scss/checkbox/_m3-checkbox.scss` | `src/material/checkbox/_m3-checkbox.scss` | synced | byte-identical copy |
| `scss/checkbox/checkbox-prebuilt.scss` | (qwik-material-specific) | new | `@use` checkbox.scss only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): every `--mat-checkbox-*` token already resolves through a `token-utils.slot(..., var(--mat-sys-*))` fallback chain baked in at Sass-compile time. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

## Removed upstream files

- `checkbox-module.ts` — Qwik has no module concept
- `testing/` (MatCheckboxHarness) — Angular test harness surface; no equivalent needed
- `index.ts` / upstream `public-api.ts` — replaced with our own re-export shape
- `checkbox.spec.ts` (1361 LOC) — ported to `mat-checkbox-scenarios.spec.tsx` (sanity tests + `describe.skip` DOM-rendered/Angular-only placeholders) per this project's smoke-only vitest constraint (`createDOM()` hangs — see button's own scenario-port comment); real DOM/behavior coverage lives in `specs/material-checkbox/*.spec.ts` (Playwright) + `angular-parity.spec.ts`
- `checkbox.html` (57 LOC) — inlined into JSX
- `MatCheckboxChange` class — replaced by the plain `MatCheckboxChangeEvent {checked}` interface (no `source` — no component-instance handle to hand back in Qwik; see deviation #3)
- `ControlValueAccessor` + `NG_VALUE_ACCESSOR` + `Validator` + `NG_VALIDATORS` providers — Qwik has no forms system (deviation #3)
- `FocusableOption` / imperative `focus()` method — no component-instance handle in Qwik; a consumer needing this uses a ref to the rendered `<input>` directly

## Deviations from upstream

1. **Hybrid controlled/uncontrolled `checked`/`indeterminate`.** Upstream's `@Input` setters for `checked`/`indeterminate` always write into the same internal field `_handleInputClick`/the click handler also mutates — there is no structural difference between "controlled" and "uncontrolled" upstream, a parent re-providing a value after an external change is just another writer of that field. This port models that with one internal `useSignal` per field, seeded from `props.x ?? false`, plus a `useTask$` that copies `props.x` into the signal whenever the prop is *defined* (so a parent that never rebinds the prop — a literal `checked={true}` with no `onChange$`, as in the `colors` scenario's Default/Accent/Warn checkboxes — only seeds the initial value once and never fights the click handler's own later writes; see `mat-checkbox.tsx`'s own comment). A parent that omits the prop entirely (the `aria-label`/`aria-labelledby`/`aria-extra` scenarios) gets a fully self-managed checkbox, matching upstream's "no `[checked]` binding" uncontrolled path exactly.

2. **`checked`/`indeterminate` are set imperatively via a ref, never as a JSX prop (read this before touching either).** Both are DOM *properties* with no reliable HTML *attribute* equivalent (`checked`'s content attribute reflects `defaultChecked`, not the live value, by HTML spec design; `indeterminate` has no content attribute at all, ever, in any browser). Two independent problems were found empirically (both reproduced and fixed during this port — not theoretical):
   - **SSR attribute leak.** Qwik's SSR string serializer has no "known DOM property, not an attribute" allowlist the way its CSR diffing path does: a `true`-valued `checked`/`indeterminate` JSX prop is written as a literal, bare boolean attribute (`checked=""` / `indeterminate=""`) that then **permanently lingers** in the live DOM post-resume (nothing ever calls `removeAttribute` on it) — Angular's own rendering never produces this attribute, so it broke the structural parity diff outright for every scenario starting `checked`/`indeterminate` true (`checked`, `colors`, `disabled`'s second checkbox, `indeterminate`).
   - **A build-time `isBrowser` ternary (`@builder.io/qwik/build`) around the prop — the first fix attempted for the leak above — broke CSR reactivity instead.** With `checked={isBrowser ? checked.value : undefined}`, a click that flips `checked.value` (e.g. via the touch-target handler, which has no native widget of its own to piggyback on) stopped reaching the real DOM property at all; the class array (plain `checked.value &&'…'`, no ternary) kept updating correctly in the very same render, proving the render itself was fine — only the ternary-wrapped prop's *diffing* broke. (Clicking the `<input>` directly still "worked" in earlier manual checks only because the **browser's own native checkbox-toggle-on-click** sets `.checked` before Qwik's handler ever runs — masking the bug, not fixing it.)

   Fix: `checked`/`indeterminate` are not JSX props on the `<input>` at all. Two `useTask$`s track `checked.value`/`indeterminate.value` and set `inputRef.value.checked`/`.indeterminate` directly. This sidesteps both problems: during SSR the task's ref points at the server's mock element, so it has zero effect on the serialized HTML (no attribute, ever); during CSR the task reruns — lazily, only loading and executing when the tracked signal actually changes — and assigns the property directly, with no JSX-prop-diffing path (and its ternary quirk) involved at all. Cost (unavoidable either way): a checkbox that starts `checked`/`indeterminate` `true` and is **never interacted with** won't show the native `:checked`/`:indeterminate` CSS pseudo-class styling (checkmark draw, tri-state dash) until the first click — a visual-only gap, explicitly out of scope per the remediation design doc's "computed-style / visual parity … out of scope". The `mdc-checkbox--selected`/`mat-mdc-checkbox-checked` classes and `aria-checked="mixed"` attribute (the parts of checked/indeterminate state that ARE attribute-expressible, and the only parts angular-parity.spec.ts or any real consumer's attribute-reading code can observe) are correct from the very first paint regardless.

3. **Angular Forms integration removed entirely.** `ControlValueAccessor` (`writeValue`/`registerOnChange`/`registerOnTouched`/`setDisabledState`) and `Validator` (`validate`/`registerOnValidatorChange`, the `required` check) have no Qwik equivalent — `required` is reflected as a plain attribute only, with no validation behavior. `ngModel`/reactive-`FormControl` integration (pristine/touched/dirty, blur-marks-touched via the deferred-to-microtask `_onBlur`) is dropped with it. `MatCheckboxChange`'s `source: MatCheckbox` field is dropped (no class instance to hand back) — the Qwik `onChange$` payload is just `{checked: boolean}`.

4. **`disableRipple` now drives real ripple firing (2026-10-30, `core/ripple/` remediation).** Superseding the original note below: the static `<div mat-ripple aria-hidden="true" class="mat-ripple mat-mdc-checkbox-ripple mat-focus-indicator">` now has real `.mat-ripple-element` spans launched into it — via `core/ripple/ripple-dom.ts`'s `handleRippleEvent()`, wired to `onMouseDown$`/`onMouseUp$`/`onMouseLeave$`/`onTouchStart$`/`onTouchEnd$`/`onTouchCancel$` on the `.mdc-checkbox` div (upstream's `[matRippleTrigger]="checkbox"`), `centered: true` (upstream's `[matRippleCentered]="true"`) — on `mousedown`/`touchstart` of that div. `disableRipple || disabled` is OR'd into `rippleDisabled`, matching `checkbox.html`'s `[matRippleDisabled]="disableRipple || disabled"` exactly. See `core/SYNC.md`'s new ripple section.

5. **`Init` → `Indeterminate` animation-class branch is unreachable.** `animationClassFor`'s `oldState === 'init' && newState === 'indeterminate'` branch mirrors upstream's switch exactly, but nothing in this port ever calls it with `newState === 'indeterminate'` — `handleInputClick$` (the only caller) only ever targets `'checked'`/`'unchecked'`, matching upstream's own `_handleInputClick` (which likewise never calls `_transitionCheckState(Indeterminate)` — only the public `indeterminate` *setter* does, and this port's `indeterminate` prop changes are a plain reactive signal sync, not routed through an equivalent "setter that also calls transitionCheckState" path). No parity scenario exercises reactively setting `indeterminate` back to `true` post-mount, so this was not implemented; kept in the function for fidelity/documentation and in case a future caller needs it.

6. **Angular-specific removals:** `@Input()` decorators + `booleanAttribute`/`numberAttribute` transforms + `HostAttributeToken` (the static-`tabindex`-attribute constructor read) → plain TS prop types, `tabIndex` defaults to `0` unconditionally. `inject(_IdGenerator)` → `useIdGenerator()` (qwik-cdk/a11y), same `mat-mdc-checkbox-` prefix. `_CdkPrivateStyleLoader`/`_StructuralStylesLoader` lazy style injection → N/A (this port's CSS is always-loaded prebuilt CSS). `AfterViewInit`/`OnChanges` lifecycle → no lifecycle; the one upstream `ngOnChanges` use (re-running the required-validator on `required` changes) is forms-only, dropped with deviation #3. `exportAs: 'matCheckbox'` → N/A. `@ViewChild('input'|'label')` → a single `inputRef` signal (no separate label ref needed; the label-click-prevention handler uses `event.target.closest('label.mdc-label')` instead of a ref comparison).

## Stub inventory delta

`checkbox.scss` (line 1) and `_checkbox-common.scss` (line 2) both reference
`@angular/cdk` for the `cdk.high-contrast` mixin (several `forced-colors:
active` media-query blocks) — swapped to `../cdk-stub as cdk`, matching the
Dialog/Button/Button-Toggle/Badge precedent (the stub's existing `@mixin
high-contrast` already covers this).

## Class count

`grep -rnE "^export class" src/qwik-material/checkbox/ 2>/dev/null` → 0 (no
exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest &&
lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering
dialog + button + card + toolbar + badge + icon + progress-bar +
progress-spinner + divider + grid-list + list + button-toggle + checkbox +
core.

## MatInternalFormField gains an `onClick$` prop (2026-10-28)

`core/mat-internal-form-field.tsx` previously had no click handling of its
own (its only consumer, button-toggle, didn't use it at all). Checkbox is the
first consumer, and upstream's `checkbox.html` puts
`(click)="_preventBubblingFromLabel($event)"` directly on the SAME element
that carries the `mat-internal-form-field` selector — exactly the Angular
pattern of binding both a component selector and a plain event on one
element. Added an optional `onClick$` prop that forwards straight onto the
rendered div; `core/SYNC.md` updated to match. No existing caller is
affected (the prop defaults to `undefined`).

## Known flakiness (environmental, not a logic bug)

`basic` (and, more rarely, other scenarios) can occasionally fail with the
Qwik side's `mdc-checkbox--anim-<from>-<to>` transition class still present
at a comparison that expected it cleared — i.e. `handleInputClick$`'s own
`setTimeout(() => { transitionClass.value = ''; }, 1000)` (or the
`waitForTransitionClassToClear` poll that waits for it) didn't complete in
time. Two contributing timing effects, both confirmed, neither a logic
defect:

- **Cold qwikloader bootstrap.** The loader's registration script sits at
  the very end of the SSR document (confirmed by inspecting the raw HTML: an
  inline `window.qwikevents.push(...)` script is the last thing before
  `</html>`; the actual loader module loads via an `async`
  `<script type=module>` plus a `requestIdleCallback`-gated prefetch),
  neither guaranteed done by the time a `[data-parity-root]` wait resolves
  (present from the very first SSR byte). `waitForTransitionClassToClear`'s
  documented "resolves immediately if nothing to wait for" behavior can mask
  a click whose handler hasn't loaded yet as "already settled."
- **Host CPU contention delaying the `setTimeout` itself.** Confirmed via
  `npx playwright test ... -g basic --workers=1 --repeat-each=5` on a
  heavily loaded machine (20+ concurrent Playwright/Chromium processes from
  other agent worktrees, confirmed via `ps aux`): 2/5 repeats failed, both
  at the `space checkbox 0` step (the *third* interaction, well past any
  "first ever click" cold-start window) with the transition class still
  present — consistent with the event loop itself being starved long enough
  that a plain 1000ms timer, or the test's own polling, slips past the
  comparison, not with anything specific to this component's logic.

Neither effect is checkbox-specific or something to fix in `MatCheckbox` —
both are inherent to timing-based waits (this spec's own
`waitForTransitionClassToClear`, mirroring upstream's real
`_ngZone.runOutsideAngular(() => setTimeout(...))` 1-second animation-clear
window) under adversarial scheduling, not a structural/attribute/class
mismatch. Confirmed via *many* repeated runs on an otherwise-idle machine:
13/13 scenarios pass consistently and quickly (~45s), 100% reliably,
including every multi-click sequence tested up to 5 clicks in a row (see
`specs/material-checkbox/multi-click.spec.ts`). Every failure actually
observed during this port's development coincided with heavy concurrent
load from *other* agent worktrees' test suites running at the same time
(sibling wave-1 ports for radio, expansion, and slide-toggle) — re-running,
or running when the host is less contended, resolves it.

## First paint + handler timing (2026-10-28, coordinator)

- `checked` is rendered as a JSX prop again so a pre-checked checkbox paints
  checked before JS runs (the parity harness compares the live `.checked`
  property, so the SSR attribute that lingers afterwards is not a diff — see
  the parity-tests README). `indeterminate` stays task-only (no attribute exists).
- The "Known flakiness" above was a spec race, not host timing: the step's
  "transition class is gone" wait could pass before Qwik's lazily-resolved
  handler had added the class. Steps now wait for the input's className to
  change (bounded at 1.5s) before waiting the class out.

## Initially-indeterminate checkboxes (2026-10-30)

`indeterminate` is a DOM property with no attribute, so SSR can't express it. A checkbox whose
`indeterminate` prop starts `true` now sets the property once on load (`useVisibleTask$` with
`document-ready`, called only for those instances), so upstream's `:indeterminate` styles (mixed
mark, filled background) apply before any interaction. Found by the computed-style parity check.
