/**
 * Shared types for the `cdk/stepper` port — mirrors
 * `src/cdk/stepper/stepper.ts`'s own top-level type/const exports.
 */

/** Position state of a step's content relative to the selected step. */
export type StepContentPositionState = 'previous' | 'current' | 'next';

/** Possible orientation of a stepper. */
export type StepperOrientation = 'horizontal' | 'vertical';

/** The state of each step. */
export type StepState = 'number' | 'edit' | 'done' | 'error' | string;

/** Mirrors upstream's `STEP_STATE` enum-ish const. */
export const STEP_STATE = {
  NUMBER: 'number',
  EDIT: 'edit',
  DONE: 'done',
  ERROR: 'error',
} as const;

/**
 * Configurable options for stepper, mirroring upstream's `StepperOptions`
 * (provided via `STEPPER_GLOBAL_OPTIONS`). See `stepper-config.ts` for the
 * Qwik-context equivalent of that injection token.
 */
export interface StepperOptions {
  /** Whether the stepper should display an error state or not. Default false. */
  showError?: boolean;
  /** Whether the stepper should display the default indicator type or not. Default true. */
  displayDefaultIndicatorType?: boolean;
}

/**
 * Minimal duck-typed replacement for upstream's `AbstractControl` — the only
 * shape `CdkStep.stepControl` actually reads (`valid`/`invalid`/`pending`).
 * This port has no reactive-forms module (see
 * `qwik-material/stepper/step-control.ts`'s doc comment for the task's
 * "forms only where needed" scope): a consumer builds one of these from
 * whatever local state/validation it wants and passes a fresh value on every
 * render — Qwik's own reactivity keeps it live, no subscription needed.
 */
export interface StepControl {
  readonly valid: boolean;
  readonly invalid: boolean;
  readonly pending?: boolean;
}
