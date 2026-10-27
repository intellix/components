import {component$, Slot, useContext, $, type QRL} from '@builder.io/qwik';
import type {MatButtonColor} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';
import {disabledAttr} from './internal/disabled-attr';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';

export interface MatFabProps {
  /** When true, renders the extended FAB variant (wider, label visible). */
  extended?: boolean;
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

  // See mat-button.tsx for the full rationale — same lazy useOn()-based
  // replacement for the old useVisibleTask$-based useFocusMonitor.
  const focusOrigin = useFocusOrigin();

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
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
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

  // Returns a signal (not a side effect) — see ripple-loader.ts's
  // useRippleLoader() doc comment: this component's focus classes above
  // ALSO come from a signal, so the ripple span/attribute must too, or an
  // unrelated focus-triggered re-render would clobber an imperative mutation.
  const rippleInitialized = useRippleLoader();

  const children = (
    <>
      <PersistentRipple isFab={true} />
      <span class="mdc-button__label">
        <Slot />
      </span>
      <FocusIndicator />
      <TouchTarget />
      {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
    </>
  );

  // FAB/mini-FAB extend MatButtonBase directly (no MatIconButton-style extra
  // configureRipple({centered: true}) call) — same className, no centered.
  const rippleAttrs = rippleLoaderHostAttrs({
    className: 'mat-mdc-button-ripple',
    disabled: props.disableRipple || props.disabled,
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
        {...rippleAttrs}
        mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      >
        {children}
      </a>
    );
  }

  return (
    <button
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
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
    >
      {children}
    </button>
  );
});
