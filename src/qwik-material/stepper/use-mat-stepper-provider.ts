import {useContextProvider} from '@qwik.dev/core';
import {CDK_STEPPER_GLOBAL_OPTIONS, type StepperOptions} from '@angular-community/qwik-cdk/stepper';

/**
 * Provides `CDK_STEPPER_GLOBAL_OPTIONS` (qwik-cdk's equivalent of upstream's
 * `STEPPER_GLOBAL_OPTIONS`) for this subtree — call once near the root (or anywhere deeper, to
 * override just that part of the tree) so every `MatStepper` descendant resolves
 * `showError`/`displayDefaultIndicatorType` from `options` instead of upstream's own
 * un-provided defaults (`showError` falls back to per-step `hasError` overrides only;
 * `displayDefaultIndicatorType` defaults `true`). Only this one context is provided; every
 * other qwik-material configuration context stays whatever an ancestor (or nothing) already
 * provided.
 */
export function useMatStepperProvider(options?: StepperOptions): void {
  useContextProvider(CDK_STEPPER_GLOBAL_OPTIONS, options ?? {});
}
