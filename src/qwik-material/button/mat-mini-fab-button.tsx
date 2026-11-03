import {component$, Slot, useContext, $} from '@qwik.dev/core';
import type {MatFabOwnProps} from './mat-fab-button';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';
import {disabledAttr} from './internal/disabled-attr';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {callHostHandler, extraHostAttrs, useForwardedHostHandlers} from '../core/host-props';
import {cloneJsxForReuse} from '../core/jsx-reuse';

// Mini-FAB has no 'extended' prop; everything else matches MatFabProps
// (via its index-signature-free MatFabOwnProps — see that type's doc
// comment for why `Omit` needs the index-signature-free version).
export interface MatMiniFabProps extends Omit<MatFabOwnProps, 'extended'> {
  [extraAttr: string]: unknown;
}

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
  'icon',
]);

// Same accent default as MatFabButton (see fab.ts line 130-143).
const DEFAULTS: MatButtonConfig = {
  color: 'accent',
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatMiniFabButton = component$<MatMiniFabProps>(props => {
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
    'mdc-fab--mini',
    'mat-mdc-mini-fab',
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

  const preventDisabledClick$ = $(async (e: MouseEvent, el: Element) => {
    if (props.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    await callHostHandler(props.onClick$, e, el);
  });

  // Returns a signal (not a side effect) — see ripple-loader.ts's
  // useRippleLoader() doc comment: this component's focus classes above
  // ALSO come from a signal, so the ripple span/attribute must too, or an
  // unrelated focus-triggered re-render would clobber an imperative mutation.
  // Directive-hook handlers via useOn(), not JSX props — see useForwardedHostHandlers().
  useForwardedHostHandlers(props);
  const rippleInitialized = useRippleLoader();

  const children = (
    <>
      <PersistentRipple isFab={true} />
      {/* The ripple loader re-renders this on first hover; Qwik v2 corrupts a JSXOutput
          rendered twice (core/jsx-reuse.ts), which emptied the icon. */}
      {cloneJsxForReuse(props.icon)}
      <span class="mdc-button__label">
        <Slot />
      </span>
      <FocusIndicator />
      <TouchTarget />
      {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
    </>
  );

  // Mini-FAB extends MatButtonBase directly, same as MatFabButton: no
  // MatIconButton-style configureRipple({centered: true}) call.
  const rippleAttrs = rippleLoaderHostAttrs({
    className: 'mat-mdc-button-ripple',
    disabled: props.disableRipple || props.disabled,
  });

  const extraAttrs = extraHostAttrs(props as Record<string, unknown>, KNOWN_PROPS);
  const describedBy = props.ariaDescribedBy ?? (props['aria-describedby'] as string | undefined);

  if (isAnchor) {
    return (
      <a
        ref={props.ref}
        href={props.href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={describedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
        {...extraAttrs}
        {...rippleAttrs}
        mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
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
      {...extraAttrs}
      {...rippleAttrs}
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
    >
      {children}
    </button>
  );
});
