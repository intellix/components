// Public API for @angular-community/qwik-material/stepper.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md
// and ...remaining-components-roadmap.md (wave 3).

export {MatStepper, type MatStepDef, type MatStepperProps} from './mat-stepper';
export {MatStepperNext, type MatStepperNextProps} from './stepper-buttons';
export {MatStepperPrevious, type MatStepperPreviousProps} from './stepper-buttons';
export {useMatStepperNext, useMatStepperPrevious} from './use-stepper-buttons';
export type {
  UseMatStepperNextProps,
  UseMatStepperPreviousProps,
  MatStepperButtonHook,
} from './use-stepper-buttons';
export {MAT_STEPPER_ACTIONS, type MatStepperActions} from './stepper-actions';
export {useRequiredControl, type RequiredControlApi} from './step-control';
