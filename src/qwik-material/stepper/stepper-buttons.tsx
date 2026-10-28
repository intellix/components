import {component$, Slot, useContext} from '@builder.io/qwik';
import {MAT_STEPPER_ACTIONS} from './stepper-actions';

/**
 * `button[matStepperNext]`/`button[matStepperPrevious]`
 * (`src/cdk/stepper/stepper-button.ts` + `src/material/stepper/
 * stepper-button.ts`'s `MatStepperNext extends CdkStepperNext` override).
 * Place anywhere inside a `MatStepDef.content` tree — see
 * `stepper-actions.ts`'s doc comment for how it reaches the owning
 * `MatStepper` without the content author wiring anything.
 *
 * `class`/`type` are the DIRECTIVES' OWN host bindings
 * (`'class': 'mat-stepper-next'`, `'[type]': 'type'`) — not consumer-chosen,
 * same category as `matRipple` (angular-parity.spec.ts note 10) — always
 * rendered, never the task's `class`/`type` prop values to omit.
 */
export interface MatStepperNextProps {
  /** Mirrors `CdkStepperNext.type`. Default 'submit'. */
  type?: 'submit' | 'button' | 'reset';
  disabled?: boolean;
  class?: string | ReadonlyArray<string>;
}

export const MatStepperNext = component$<MatStepperNextProps>(props => {
  const actions = useContext(MAT_STEPPER_ACTIONS);
  const classes = ['mat-stepper-next', props.class].filter(Boolean) as string[];
  return (
    <button
      type={props.type ?? 'submit'}
      disabled={props.disabled}
      class={classes}
      onClick$={() => actions.next$()}
    >
      <Slot />
    </button>
  );
});

export interface MatStepperPreviousProps {
  /** Mirrors `CdkStepperPrevious.type`. Default 'button'. */
  type?: 'submit' | 'button' | 'reset';
  disabled?: boolean;
  class?: string | ReadonlyArray<string>;
}

export const MatStepperPrevious = component$<MatStepperPreviousProps>(props => {
  const actions = useContext(MAT_STEPPER_ACTIONS);
  const classes = ['mat-stepper-previous', props.class].filter(Boolean) as string[];
  return (
    <button
      type={props.type ?? 'button'}
      disabled={props.disabled}
      class={classes}
      onClick$={() => actions.previous$()}
    >
      <Slot />
    </button>
  );
});
