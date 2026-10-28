# qwik-cdk/stepper sync log

Tracks the sync state between this port and `src/cdk/stepper/` upstream.
Ported alongside `qwik-material/stepper` (its only consumer today) per
`docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`
(wave 3). Gated from the start by
`src/qwik-cdk-parity-tests/specs/material-stepper/angular-parity.spec.ts`
(11/11 scenarios passing — horizontal-basic, vertical-basic,
linear-required, optional-step, editable-false, completed-step-icons,
custom-label, label-position-bottom, header-position-bottom,
selected-index-initial, error-state — run 3× clean).

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `stepper/step-types.ts` | `src/cdk/stepper/stepper.ts`'s top-level type/const exports (`StepState`, `STEP_STATE`, `StepperOrientation`, `StepContentPositionState`, `StepperOptions`) | ported | Plain type re-exports. `StepControl` is new (see below) |
| `stepper/step-control.ts` concept — lives inline in `step-types.ts` | `AbstractControl` (duck-typed, only the `valid`/`invalid`/`pending` surface `CdkStep.stepControl` actually reads) | new | No reactive-forms module exists in this port (see task scope note in `qwik-material/stepper/step-control.ts`); a consumer builds a fresh `StepControl` snapshot every render instead of a stateful control object |
| `stepper/stepper-config.ts` | `STEPPER_GLOBAL_OPTIONS` `InjectionToken<StepperOptions>` | ported | `createContextId` equivalent (`CDK_STEPPER_GLOBAL_OPTIONS`), wired into `QwikMaterialProvider.stepperGlobalOptions` even though it's a CDK-level token (Material adds nothing to it) |
| `stepper/step-logic.ts` | `CdkStep`'s computed getters/signals (`completed`, `hasError`, `_showError()`, `isNavigable`, `indicatorType`) + `CdkStepper._getAnimationDirection()` + the gating half of the `selectedIndex` setter (`_anyControlsInvalidOrPending` + the forward/backward `editable` check) | ported | Reframed as plain, independently unit-tested functions over plain data (`computeCompleted`/`computeHasError`/`shouldShowError`/`isNavigable`/`computeIndicatorType`/`getAnimationDirection`/`isStepIncompleteForLinearGate`/`anyControlsInvalidOrPending`/`canMoveToIndex`) — no class, no signals. 26 unit tests (`step-logic.spec.ts`) |
| `stepper/stepper-keyboard.ts` | `CdkStepper`'s `FocusKeyManager` configuration (`.withWrap().withHomeAndEnd().withVerticalOrientation(…)` + an unconditional `.withHorizontalOrientation(dir)`) | ported | Pure index math (`computeNextStepFocusIndex`), same shape as `qwik-material/tabs/tab-group-keyboard.ts` but supporting BOTH horizontal arrows (always) and vertical arrows (only when `verticalOrientation`) — no `skipPredicate` (every header is keyboard-focusable regardless of `aria-disabled`, matching tabs' identical no-skip configuration). 5 unit tests (`stepper-keyboard.spec.ts`) |

## Removed upstream files

- `stepper-module.ts` — Qwik has no module concept.
- `BUILD.bazel` — n/a to this build system.
- `CdkStep`/`CdkStepper`/`CdkStepHeader`/`CdkStepLabel`/`CdkStepperNext`/
  `CdkStepperPrevious` classes/directives themselves — there is no bare
  `[cdkStepper]` entry point in this port (unlike upstream, which lets a
  consumer use the CDK primitive without Material's styling). Only the
  LOGIC these classes compute is ported, consumed directly by
  `qwik-material/stepper/mat-stepper.tsx` (which folds `CdkStepper`+
  `CdkStep`+`MatStepper`+`MatStep`+`MatStepHeader` into one component, same
  reasoning as `MatTabGroup` folding in `MatTabHeader`/
  `MatPaginatedTabHeader` — see `qwik-material/tabs/SYNC.md`). A future
  bare-CDK entry point would re-export these same pure functions behind a
  thin stateful wrapper; nothing here blocks that.
- `StepperSelectionEvent` class — replaced by a plain
  `{selectedIndex, previouslySelectedIndex}` object literal
  (`MatStepperProps.onSelectionChange$`'s parameter type).
- `stepper.md` — doc, n/a.

## Deviations from upstream

1. **No Angular DI / class hierarchy.** Plain functions + a `createContextId`
   in place of `CdkStepper`'s `@Directive`, `InjectionToken`, `inject()`.
2. **`_markAsInteracted()` / the `interacted` mutable flag itself is NOT
   ported here** — it is the one piece of genuinely internal, per-step
   mutable state (never controlled by the consumer in any parity scenario)
   and lives as a `useStore<boolean[]>` inside `qwik-material/stepper/
   mat-stepper.tsx`, not as part of this logic-only package. The PURE
   gating/completed/hasError functions here all take `interacted` as a
   plain `boolean` parameter instead.
3. **`FocusKeyManager._origin`'s one-way 'program'→'keyboard' latch is NOT
   implemented in this package either** — it's pure UI-interaction state
   (`keyboardOriginSig`), kept in `mat-stepper.tsx` alongside `focusVia()`.
   See that file's doc comment for the full explanation (confirmed live:
   `setActiveItem()` always calls `.focus(this._origin)` on a successful
   selection change, overriding the natural click-origin heuristic — this
   is why a cold mouse click on a header gives `cdk-program-focused`, not
   `cdk-mouse-focused`).
4. **`aria-disabled`'s two-binding Angular quirk is NOT implemented in this
   package either** — same reasoning, it's a DOM-attribute-rendering
   concern, not `CdkStep`/`CdkStepper` logic. See `qwik-material/stepper/
   mat-step-header.tsx`'s `ariaDisabled` prop doc comment and `mat-stepper
   .tsx`'s `ariaDisabledQuirk` store for the full replication of Angular's
   per-binding change-detection memoization (`stepper.html` has TWO
   `[attr.aria-disabled]` bindings on the same element; Angular only
   writes the DOM when THAT SPECIFIC binding's own value changes, so a
   vertical, non-linear header that becomes selected keeps
   `aria-disabled="true"` stuck on it — confirmed live).
5. **LTR only** (`getAnimationDirection`'s `rtl` parameter defaults `false`
   and is never driven by a real `Directionality` subscription) — same
   scope cut as every other keyboard/layout helper in this port (tabs,
   expansion, button-toggle).
6. **No `matStepperIcon` icon-override support, no `matStepContent` lazy
   content.** Neither is exercised by any `angular-parity.spec.ts`
   scenario; both are purely `qwik-material/stepper` concerns if ever
   added (nothing here would need to change).

## Pipeline

`pnpm test:qwik-cdk` at the repo root runs `build && vitest &&
lint:no-ssr-leaks` for the whole qwik-cdk package, covering platform +
bidi + coercion + keycodes + portal + a11y + accordion + stepper + overlay
+ dialog.
