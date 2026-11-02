import {component$, Slot} from '@qwik.dev/core';
import {mergeHostProps} from '../core/host-props';
import {useMatStepperNext, useMatStepperPrevious} from './use-stepper-buttons';

/**
 * `button[matStepperNext]`/`button[matStepperPrevious]`
 * (`src/cdk/stepper/stepper-button.ts` + `src/material/stepper/
 * stepper-button.ts`'s `MatStepperNext extends CdkStepperNext` override).
 * Place anywhere inside a `MatStepDef.content` tree — see
 * `stepper-actions.ts`'s doc comment for how it reaches the owning
 * `MatStepper` without the content author wiring anything.
 *
 * Thin wrappers around `useMatStepperNext()`/`useMatStepperPrevious()` (see
 * `use-stepper-buttons.ts`) for the common case of a BARE
 * `CdkStepperNext`/`CdkStepperPrevious` button with no `matButton` chrome.
 * When the real template stacks `matButton` on the SAME element
 * (`<button matButton matStepperNext>Next</button>`, material.angular.dev's
 * own stepper docs example), call the hook directly and spread onto
 * `<MatButton>` instead — see `qwik-material/README.md`'s "Composing
 * directives" section and `mat-stepper/example`'s `StepperNextButton`/
 * `StepperPreviousButton`. (`matButton` composition used to be a prop
 * ON these components — `MatStepperNextProps.matButton` — duplicating
 * `MatButton`'s own chrome; removed in the directive-hooks remediation.)
 */
export interface MatStepperNextProps {
  /** Mirrors `CdkStepperNext.type`. Default 'submit'. */
  type?: 'submit' | 'button' | 'reset';
  disabled?: boolean;
  class?: string | ReadonlyArray<string>;
}

export const MatStepperNext = component$<MatStepperNextProps>(props => {
  const next = useMatStepperNext({type: props.type, disabled: props.disabled});
  const hostProps = mergeHostProps(next.hostProps, {class: props.class});
  return (
    <button {...hostProps}>
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
  const previous = useMatStepperPrevious({type: props.type, disabled: props.disabled});
  const hostProps = mergeHostProps(previous.hostProps, {class: props.class});
  return (
    <button {...hostProps}>
      <Slot />
    </button>
  );
});
