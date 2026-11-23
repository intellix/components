import {component$, Slot, useContext, $} from '@qwik.dev/core';
import type {MatButtonColor} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import type {OpenString} from '../core/open-string';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';
import {disabledAttr} from './internal/disabled-attr';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {
  callHostHandler,
  extraHostAttrs,
  mergeHostProps,
  type HostHandler,
  type HostRef,
  useForwardedHostHandlers,
} from '../core/host-props';
import {useMatButtonStyles} from './button-styles';
import {buttonVariantSheet} from './internal/variant-styles';
import {serverRendering} from '../core/ssr-sheets';

/** See `mat-button.tsx`'s identical constant doc comment. */
const KNOWN_PROPS = new Set<string>([
  'color',
  'disabled',
  'disableRipple',
  'disabledInteractive',
  'href',
  'type',
  'onClick$',
  'onMouseDown$',
  'onMouseEnter$',
  'onMouseLeave$',
  'onKeyDown$',
  'onFocusIn$',
  'onFocusOut$',
  'ariaLabel',
  'ariaDescribedBy',
  'ariaLabelledBy',
  'aria-describedby',
  'id',
  'class',
  'ref',
]);

export interface MatIconButtonProps {
  /** See `mat-button.tsx`'s identical `color` prop doc comment — widened to
   *  `OpenString<MatButtonColor>` since `MatIconButton` extends the same
   *  upstream `MatButtonBase` (`color: string | null`). */
  color?: OpenString<MatButtonColor>;
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
  /** See `mat-button.tsx`'s identical prop doc for why `HostHandler`-shaped. */
  onClick$?: HostHandler<MouseEvent>;
  /** Directive-hook passthrough — see `core/host-props.ts`. */
  onMouseDown$?: HostHandler<MouseEvent>;
  onMouseEnter$?: HostHandler<MouseEvent>;
  onMouseLeave$?: HostHandler<MouseEvent>;
  onKeyDown$?: HostHandler<KeyboardEvent>;
  onFocusIn$?: HostHandler<FocusEvent>;
  onFocusOut$?: HostHandler<FocusEvent>;
  ref?: HostRef;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  id?: string;
  class?: string | ReadonlyArray<string>;
  /** See `mat-button.tsx`'s identical `[extraAttr]` doc comment. */
  [extraAttr: string]: unknown;
}

const DEFAULTS: MatButtonConfig = {
  color: null,
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatIconButton = component$<MatIconButtonProps>(props => {
  // During server rendering its `icon` sheet goes inside the host (core/ssr-sheets.ts).
  useMatButtonStyles(...(serverRendering() ? [] : (['icon'] as const)));
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const color = props.color ?? config.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  // `href` is read here anyway (the host tag depends on it), so the attribute takes the plain
  // value: `href={props.href}` would add a derived signal per button.
  const href = props.href;
  const isAnchor = href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  // See mat-button.tsx for the full rationale — same lazy useOn()-based
  // replacement for the old useVisibleTask$-based useFocusMonitor.
  const focusOrigin = useFocusOrigin({hostClasses: true});
  // Untracked: `hostClasses` toggles the focus classes with classList, so focus changes must not
  // re-render the host (a re-render rewrites the whole `class`, undoing classes another
  // script toggled); a re-render for any other reason
  // still writes the current ones.
  const origin = focusOrigin.untrackedValue;

  const classes = [
    'mat-mdc-button-base',
    'mdc-icon-button',
    'mat-mdc-icon-button',
    color ? `mat-${color}` : 'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    disabledInteractive && 'mat-mdc-button-disabled-interactive',
    props.disableRipple && 'mat-mdc-button-ripple-disabled',
    origin && 'cdk-focused',
    origin === 'touch' && 'cdk-touch-focused',
    origin === 'keyboard' && 'cdk-keyboard-focused',
    origin === 'mouse' && 'cdk-mouse-focused',
    origin === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  const preventDisabledClick$ = $(async (e: MouseEvent, el: Element) => {
    if (props.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    await callHostHandler(props.onClick$, e, el);
  });

  // The ripple: nothing per host under the ripple delegate (see internal/ripple-loader.ts).
  // Directive-hook handlers via useOn(), not JSX props — see useForwardedHostHandlers().
  useForwardedHostHandlers(props);
  const rippleLoader = useRippleLoader();

  const children = (
    <>
      <span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple" />
      <Slot />
      <FocusIndicator />
      <TouchTarget />
      {buttonVariantSheet('icon')}
    </>
  );

  // Icon buttons are the one family upstream configures with `centered: true`
  // (icon-button.ts constructor, after the MatButtonBase super() call).
  const rippleAttrs = rippleLoaderHostAttrs({
    className: 'mat-mdc-button-ripple',
    centered: true,
    disabled: props.disableRipple || props.disabled,
  });

  const extraAttrs = extraHostAttrs(props as Record<string, unknown>, KNOWN_PROPS);
  // With the ripple claim's `pointerdown` handler merged in, beside any of the caller's own.
  const hostAttrs = rippleLoader.onPointerDown$
    ? mergeHostProps(extraAttrs, rippleLoader)
    : extraAttrs;
  const describedBy = props.ariaDescribedBy ?? (props['aria-describedby'] as string | undefined);

  if (isAnchor) {
    return (
      <a
        ref={props.ref}
        href={href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={describedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
        {...hostAttrs}
        {...rippleAttrs}
        mat-ripple-loader-uninitialized=""
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={props.ref}
      type={props.type}
      id={props.id}
      class={classes}
      {...disabledAttr(nativelyDisabled)}
      aria-disabled={props.disabled && disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={describedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
      {...hostAttrs}
      {...rippleAttrs}
      mat-ripple-loader-uninitialized=""
    >
      {children}
    </button>
  );
});
