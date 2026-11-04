import {createContextId} from '@qwik.dev/core';
import type {StepperOptions} from './step-types';

/**
 * Qwik-context equivalent of upstream's `STEPPER_GLOBAL_OPTIONS`
 * `InjectionToken<StepperOptions>` (`src/cdk/stepper/stepper.ts`). Provided
 * via `useMatStepperProvider({...})` (`qwik-material/stepper`) — the
 * `Mat`-prefixed hook lives in `qwik-material` even though this token lives
 * in `qwik-cdk`, same split as every other `qwik-material` provider hook
 * that wraps a `qwik-cdk` context.
 *
 * Lives in `qwik-cdk` (not `qwik-material`) because upstream's own
 * `STEPPER_GLOBAL_OPTIONS` is a CDK-level token, consumed directly by
 * `CdkStep` (`_displayDefaultIndicatorType`, `_showError()`) — Material adds
 * nothing to it.
 */
export const CDK_STEPPER_GLOBAL_OPTIONS = createContextId<StepperOptions>(
  'qwikCdk/stepperGlobalOptions',
);
