import {component$} from '@builder.io/qwik';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';

/**
 * Possible states for a pseudo checkbox. Mirrors upstream's
 * `MatPseudoCheckboxState`.
 */
export type MatPseudoCheckboxState = 'unchecked' | 'checked' | 'indeterminate';

/**
 * Props for <MatPseudoCheckbox>. Renders upstream's `mat-pseudo-checkbox`
 * custom element with an empty body — purely decorative, no screen-reader
 * surface (upstream's own doc comment: "this component will be completely
 * invisible to screen-reader users"). See
 * `src/material/core/selection/pseudo-checkbox/pseudo-checkbox.ts`.
 */
export interface MatPseudoCheckboxProps {
  /** Display state of the checkbox. Default 'unchecked'. */
  state?: MatPseudoCheckboxState;
  /** Whether the checkbox is disabled. Default false. */
  disabled?: boolean;
  /**
   * Appearance of the pseudo checkbox. Default 'full' renders a
   * checkmark/mixedmark indicator inside a square box. 'minimal' appearance
   * only renders the checkmark/mixedmark.
   */
  appearance?: 'minimal' | 'full';
  'aria-hidden'?: 'true' | 'false';
  class?: string | ReadonlyArray<string>;
  /**
   * Also render `state` / `appearance` as DOM attributes. Angular keeps them
   * only when the parent template writes them statically (button-toggle.html:
   * `state="checked" appearance="minimal"`); bound inputs (option.html:
   * `[state]="…"`) leave no attribute. Default false.
   */
  echoAttributes?: boolean;
}

export const MatPseudoCheckbox = component$<MatPseudoCheckboxProps>(props => {
  const animationsDisabled = useAnimationsDisabled();
  const state = props.state ?? 'unchecked';
  const appearance = props.appearance ?? 'full';

  const classes = [
    'mat-pseudo-checkbox',
    state === 'indeterminate' && 'mat-pseudo-checkbox-indeterminate',
    state === 'checked' && 'mat-pseudo-checkbox-checked',
    props.disabled && 'mat-pseudo-checkbox-disabled',
    appearance === 'minimal' && 'mat-pseudo-checkbox-minimal',
    appearance === 'full' && 'mat-pseudo-checkbox-full',
    animationsDisabled.value && '_mat-animation-noopable',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-pseudo-checkbox
      class={classes}
      aria-hidden={props['aria-hidden']}
      // See `echoAttributes`. `disabled` is never echoed: upstream binds it.
      state={props.echoAttributes ? state : undefined}
      appearance={props.echoAttributes ? appearance : undefined}
    />
  );
});
