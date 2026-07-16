import {component$, Slot, useContext, $, type QRL} from '@builder.io/qwik';
import type {MatButtonColor} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';

export interface MatFabProps {
  /** When true, renders the extended FAB variant (wider, label visible). */
  extended?: boolean;
  color?: MatButtonColor;
  disabled?: boolean;
  disableRipple?: boolean;
  disabledInteractive?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick$?: QRL<(e: MouseEvent) => void>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  id?: string;
  class?: string | ReadonlyArray<string>;
}

// FAB defaults differ from standard button: color defaults to 'accent' per
// upstream fab.ts line 84-90 (the historical M2 default for FAB).
const DEFAULTS: MatButtonConfig = {
  color: 'accent',
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatFabButton = component$<MatFabProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const color = props.color ?? config.color ?? DEFAULTS.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  const classes = [
    'mat-mdc-button-base',
    'mdc-fab',
    'mat-mdc-fab-base',
    'mat-mdc-fab',
    props.extended && 'mdc-fab--extended',
    props.extended && 'mat-mdc-extended-fab',
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

  const children = (
    <>
      <PersistentRipple isFab={true} />
      <span class="mdc-button__label">
        <Slot />
      </span>
      <FocusIndicator />
      <TouchTarget />
    </>
  );

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
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      id={props.id}
      class={classes}
      disabled={nativelyDisabled || undefined}
      aria-disabled={props.disabled && disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
    >
      {children}
    </button>
  );
});
