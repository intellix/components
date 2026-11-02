import {createContextId, type QRL} from '@qwik.dev/core';

/**
 * Context `MatStepper` provides so `MatStepperNext`/`MatStepperPrevious` —
 * rendered anywhere inside a step's `content` (not as direct JSX children of
 * `<MatStepper>`, exactly like a plain `<button matStepperNext>` anywhere
 * inside `<mat-step>`'s `ng-content` in the Angular template) — can reach
 * the owning stepper's `next()`/`previous()` without the dev-app route that
 * builds `content` having to wire anything itself. Mirrors upstream's DI:
 * `CdkStepperNext`/`CdkStepperPrevious` `inject(CdkStepper)`.
 *
 * Qwik context resolves by the ACTUAL rendered component tree, not by where
 * a `JSXOutput` literal was lexically constructed — once `MatStepper` mounts
 * `props.steps[i].content` inside its own subtree, anything inside that
 * content sees context `MatStepper` provides, the same way a React/Qwik
 * "children as a slot" composition always does.
 */
export interface MatStepperActions {
  next$: QRL<() => void>;
  previous$: QRL<() => void>;
}

export const MAT_STEPPER_ACTIONS = createContextId<MatStepperActions>(
  'qwikMaterial/stepperActions',
);
