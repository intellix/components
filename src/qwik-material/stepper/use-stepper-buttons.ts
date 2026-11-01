import {$, useContext} from '@qwik.dev/core';
import type {HostProps} from '../core/host-props';
import {MAT_STEPPER_ACTIONS} from './stepper-actions';

/**
 * Directive-hook form of upstream's `button[matStepperNext]`/
 * `button[matStepperPrevious]` (`src/cdk/stepper/stepper-button.ts` +
 * `src/material/stepper/stepper-button.ts`'s `MatStepperNext`/
 * `MatStepperPrevious` overrides) — see `qwik-material/README.md`
 * ("Composing directives"). Returns exactly what the directive contributes
 * to its host (its own `class`/`type` host bindings — not consumer-chosen,
 * same category as `matRipple`, see `angular-parity.spec.ts` note 10 —
 * plus the click handler that calls the owning `MatStepper`'s
 * `next()`/`previous()`). Spread onto whatever element should become the
 * button — typically `<MatButton>`, mirroring the documented
 * `stepper-overview` usage (`<button matButton matStepperNext>Next</button>`,
 * material.angular.dev's own stepper docs example):
 *
 * ```tsx
 * const next = useMatStepperNext();
 * return <MatButton {...next.hostProps}>Next</MatButton>;
 * ```
 *
 * **Must be called from a component instance that ends up rendered INSIDE
 * a step's `content`** (not the route that BUILDS that `content`, even
 * though the two can look identical at the call site) — same constraint
 * `MAT_STEPPER_ACTIONS`'s own doc comment documents: Qwik resolves
 * `useContext()` by the component's ACTUAL position in the rendered tree,
 * not by where the JSX literal was lexically written. A route that builds
 * `steps: [{content: <MatButton {...useMatStepperNext().hostProps}>…}]`
 * calls `useMatStepperNext()` as part of the ROUTE's OWN render (before
 * `<MatStepper>` has mounted anything), so it would see no context at all.
 * Wrap the hook call in its own small `component$` placed INSIDE `content`
 * instead — see `mat-stepper/example`'s `StepperNextButton`/
 * `StepperPreviousButton` for the pattern a real consumer would use.
 *
 * `<MatStepperNext>`/`<MatStepperPrevious>` (`stepper-buttons.tsx`) are now
 * thin wrappers around these hooks for the common case of a bare
 * `CdkStepperNext`/`CdkStepperPrevious` with no `matButton` chrome.
 */
export interface UseMatStepperNextProps {
  /** Mirrors `CdkStepperNext.type`. Default 'submit'. */
  type?: 'submit' | 'button' | 'reset';
  disabled?: boolean;
}

export interface UseMatStepperPreviousProps {
  /** Mirrors `CdkStepperPrevious.type`. Default 'button'. */
  type?: 'submit' | 'button' | 'reset';
  disabled?: boolean;
}

export interface MatStepperButtonHook {
  /** Spread onto the stepper button's host element. */
  hostProps: HostProps;
}

export function useMatStepperNext(props?: UseMatStepperNextProps): MatStepperButtonHook {
  const actions = useContext(MAT_STEPPER_ACTIONS);
  return {
    hostProps: {
      class: 'mat-stepper-next',
      type: props?.type ?? 'submit',
      disabled: props?.disabled,
      onClick$: $(() => actions.next$()),
    },
  };
}

export function useMatStepperPrevious(props?: UseMatStepperPreviousProps): MatStepperButtonHook {
  const actions = useContext(MAT_STEPPER_ACTIONS);
  return {
    hostProps: {
      class: 'mat-stepper-previous',
      type: props?.type ?? 'button',
      disabled: props?.disabled,
      onClick$: $(() => actions.previous$()),
    },
  };
}
