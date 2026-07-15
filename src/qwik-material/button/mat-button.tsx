import {component$, Slot, useContext, $, type QRL} from '@builder.io/qwik';
import {
  APPEARANCE_CLASSES,
  type MatButtonAppearance,
  type MatButtonColor,
} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';

export interface MatButtonProps {
  /** Appearance variant. Default 'text' (or provider's defaultAppearance). */
  appearance?: MatButtonAppearance;
  /** M2 palette class. Deprecated in M3 but honoured. Falls back to provider config. */
  color?: MatButtonColor;
  /** Disables the button. Renders `disabled` attr on <button> or blocks click on <a>. */
  disabled?: boolean;
  /** Adds .mat-mdc-button-ripple-disabled which hides the state-layer overlay. */
  disableRipple?: boolean;
  /** When true, disabled buttons keep focus + click reachable (tooltip-friendly). */
  disabledInteractive?: boolean;
  /** When set, renders <a href> instead of <button>. Click is prevented if disabled. */
  href?: string;
  /** Native <button> type. Ignored when href is set. Default 'button'. */
  type?: 'button' | 'submit' | 'reset';
  onClick$?: QRL<(e: MouseEvent) => void>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  id?: string;
  class?: string | ReadonlyArray<string>;
}

const DEFAULTS: MatButtonConfig = {
  color: null,
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatButton = component$<MatButtonProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const appearance = props.appearance ?? config.defaultAppearance ?? 'text';
  const color = props.color ?? config.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  const classes = [
    'mat-mdc-button-base',
    'mdc-button',
    ...APPEARANCE_CLASSES[appearance],
    color ? `mat-${color}` : 'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    disabledInteractive && 'mat-mdc-button-disabled-interactive',
    props.disableRipple && 'mat-mdc-button-ripple-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const preventDisabledClick$ = $((e: MouseEvent) => {
    if (props.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (props.onClick$) props.onClick$(e);
  });

  if (isAnchor) {
    return (
      <a
        href={props.href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={props.ariaDescribedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
      >
        <PersistentRipple isFab={false} />
        <span class="mdc-button__label">
          <Slot />
        </span>
        <FocusIndicator />
        <TouchTarget />
      </a>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      id={props.id}
      class={classes}
      disabled={nativelyDisabled || undefined}
      aria-disabled={disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
    >
      <PersistentRipple isFab={false} />
      <span class="mdc-button__label">
        <Slot />
      </span>
      <FocusIndicator />
      <TouchTarget />
    </button>
  );
});
