// Public API for @angular-community/qwik-cdk/stepper.
// Qwik port of src/cdk/stepper/* (CdkStepper + CdkStep's underlying logic).
// See docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md
// (wave 3) and ...dom-parity-remediation-design.md for the project-wide rules
// this port follows.

export {
  STEP_STATE,
  type StepContentPositionState,
  type StepControl,
  type StepperOptions,
  type StepperOrientation,
  type StepState,
} from './step-types';

export {CDK_STEPPER_GLOBAL_OPTIONS} from './stepper-config';

export {
  anyControlsInvalidOrPending,
  canMoveToIndex,
  computeCompleted,
  computeHasError,
  computeIndicatorType,
  getAnimationDirection,
  isNavigable,
  isStepIncompleteForLinearGate,
  shouldShowError,
  type CanMoveToIndexParams,
  type ComputeCompletedParams,
  type ComputeHasErrorParams,
  type IndicatorTypeParams,
  type LinearGateStep,
} from './step-logic';

export {computeNextStepFocusIndex, type StepperNavKey} from './stepper-keyboard';
