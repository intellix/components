import {component$, Slot, useContext} from '@builder.io/qwik';
import {APPEARANCE_CLASSES, type MatButtonAppearance} from '../button/button-appearance';
import {PersistentRipple} from '../button/internal/persistent-ripple';
import {FocusIndicator} from '../button/internal/focus-indicator';
import {TouchTarget} from '../button/internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from '../button/internal/ripple-loader';
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
 *
 * `matButton` composes the co-located `matButton` directive's OWN chrome
 * directly onto this same host element — mirroring the documented
 * `stepper-overview` usage (`<button matButton matStepperNext>Next</button>`,
 * material.angular.dev's own stepper docs example): upstream stacks BOTH
 * directives on one native `<button>`, so the combined element carries
 * `matButton`'s ripple/focus-indicator/touch-target/ripple-loader markup
 * AND `mat-stepper-next`'s own class, all at once. Neither `<MatButton>`
 * nor `<MatStepperNext>` can be nested inside the other (both are
 * host-rendering `component$`s with their own `<button>` root — nesting
 * would add a wrapper element, failing DOM parity), so this renders the
 * combined markup directly in its OWN single `<button>`, reusing the SAME
 * internal pieces `<MatButton>` itself is built from — the identical
 * precedent `qwik-material/paginator`'s `PaginatorNavButton` already set
 * for `matIconButton` + `matTooltip` on one element (see that file's doc
 * comment). The chrome is inlined directly in each component below (not
 * factored into a shared child component) because forwarding `<Slot/>`
 * content through a second, nested `component$` layer is unverified in
 * this port — every existing double-directive composition here renders
 * its combined markup in one single component body. Omitted (default):
 * renders the bare `CdkStepperNext` directive only — every OTHER parity
 * scenario's plain `<button matStepperNext>` (no `matButton`), unaffected.
 */
export interface MatStepperNextProps {
  /** Mirrors `CdkStepperNext.type`. Default 'submit'. */
  type?: 'submit' | 'button' | 'reset';
  disabled?: boolean;
  class?: string | ReadonlyArray<string>;
  /** See the component doc comment above. `true` composes the default
   *  ('text') appearance, matching `<button matButton matStepperNext>`'s
   *  unvalued `matButton` attribute. */
  matButton?: boolean | MatButtonAppearance;
}

export const MatStepperNext = component$<MatStepperNextProps>(props => {
  const actions = useContext(MAT_STEPPER_ACTIONS);
  const rippleInitialized = useRippleLoader();

  if (props.matButton) {
    const appearance = props.matButton === true ? 'text' : props.matButton;
    const classes = [
      'mat-mdc-button-base',
      'mdc-button',
      ...APPEARANCE_CLASSES[appearance],
      'mat-stepper-next',
      'mat-unthemed',
      props.class,
    ].filter(Boolean) as string[];
    return (
      <button
        type={props.type ?? 'submit'}
        disabled={props.disabled}
        class={classes}
        onClick$={() => actions.next$()}
        {...rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple'})}
        mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      >
        <PersistentRipple isFab={false} />
        <span class="mdc-button__label">
          <Slot />
        </span>
        <FocusIndicator />
        <TouchTarget />
        {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
      </button>
    );
  }

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
  /** See `MatStepperNextProps.matButton`'s doc comment — identical composition,
   *  for `<button matButton matStepperPrevious>`. */
  matButton?: boolean | MatButtonAppearance;
}

export const MatStepperPrevious = component$<MatStepperPreviousProps>(props => {
  const actions = useContext(MAT_STEPPER_ACTIONS);
  const rippleInitialized = useRippleLoader();

  if (props.matButton) {
    const appearance = props.matButton === true ? 'text' : props.matButton;
    const classes = [
      'mat-mdc-button-base',
      'mdc-button',
      ...APPEARANCE_CLASSES[appearance],
      'mat-stepper-previous',
      'mat-unthemed',
      props.class,
    ].filter(Boolean) as string[];
    return (
      <button
        type={props.type ?? 'button'}
        disabled={props.disabled}
        class={classes}
        onClick$={() => actions.previous$()}
        {...rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple'})}
        mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      >
        <PersistentRipple isFab={false} />
        <span class="mdc-button__label">
          <Slot />
        </span>
        <FocusIndicator />
        <TouchTarget />
        {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
      </button>
    );
  }

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
