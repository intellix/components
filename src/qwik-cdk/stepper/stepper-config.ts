import {createContextId} from '@builder.io/qwik';
import type {StepperOptions} from './step-types';

/**
 * Qwik-context equivalent of upstream's `STEPPER_GLOBAL_OPTIONS`
 * `InjectionToken<StepperOptions>` (`src/cdk/stepper/stepper.ts`). Provided
 * via `<QwikMaterialProvider stepperGlobalOptions={{...}}>` — see
 * `qwik-material/dialog/qwik-material-provider.tsx`'s wiring, which mirrors
 * every other `MAT_*_CONFIG` context in that file.
 *
 * Lives in `qwik-cdk` (not `qwik-material`) because upstream's own
 * `STEPPER_GLOBAL_OPTIONS` is a CDK-level token, consumed directly by
 * `CdkStep` (`_displayDefaultIndicatorType`, `_showError()`) — Material adds
 * nothing to it.
 */
export const CDK_STEPPER_GLOBAL_OPTIONS = createContextId<StepperOptions>(
  'qwik-cdk/stepper-global-options',
);
