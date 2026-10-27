import {component$, Slot, useContext, useSignal, $, type QRL} from '@builder.io/qwik';
import type {MatButtonColor} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';
import {disabledAttr} from './internal/disabled-attr';
import {useFocusMonitor} from '@angular-community/qwik-cdk/a11y';

export interface MatIconButtonProps {
  color?: MatButtonColor;
  disabled?: boolean;
  disableRipple?: boolean;
  disabledInteractive?: boolean;
  href?: string;
  /**
   * Native <button> type attribute. Ignored when href is set. Unset by
   * default — matches upstream, which never binds a `type`, so the attribute
   * is only rendered when the caller passes one explicitly.
   */
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

export const MatIconButton = component$<MatIconButtonProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const color = props.color ?? config.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  const classes = [
    'mat-mdc-button-base',
    'mdc-icon-button',
    'mat-mdc-icon-button',
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
      <span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple" />
      <Slot />
      <FocusIndicator />
      <TouchTarget />
    </>
  );

  const hostRef = useSignal<Element>();
  useRippleLoader(hostRef);
  useFocusMonitor(hostRef, {checkChildren: true});
  // Icon buttons are the one family upstream configures with `centered: true`
  // (icon-button.ts constructor, after the MatButtonBase super() call).
  const rippleAttrs = rippleLoaderHostAttrs({
    className: 'mat-mdc-button-ripple',
    centered: true,
    disabled: props.disableRipple || props.disabled,
  });

  if (isAnchor) {
    return (
      <a
        ref={hostRef}
        href={props.href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={props.ariaDescribedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
        {...rippleAttrs}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={hostRef}
      type={props.type}
      id={props.id}
      class={classes}
      disabled={disabledAttr(nativelyDisabled)}
      aria-disabled={props.disabled && disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
      {...rippleAttrs}
    >
      {children}
    </button>
  );
});
