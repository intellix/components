import {component$, Slot, useContext, $, type JSXOutput} from '@qwik.dev/core';
import type {MatButtonColor} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import type {OpenString} from '../core/open-string';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';
import {disabledAttr} from './internal/disabled-attr';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {
  callHostHandler,
  extraHostAttrs,
  type HostHandler,
  type HostRef,
  useForwardedHostHandlers,
} from '../core/host-props';
import {cloneJsxForReuse} from '../core/jsx-reuse';

/** See `mat-button.tsx`'s identical constant doc comment. */
const KNOWN_PROPS = new Set<string>([
  'extended',
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

/**
 * Named fields only, deliberately kept SEPARATE from the `[extraAttr]` index
 * signature below (`MatFabProps`) — `MatMiniFabProps` needs `Omit<_,
 * 'extended'>` over just the named fields. `Omit`/`Pick` collapse every
 * named property to the index signature's type (`unknown`) when applied to
 * an interface that ALREADY has one (`keyof` a type with a string index
 * signature is `string`, not the literal union of its named keys) — a
 * well-known TS gotcha. Exported so `mat-mini-fab-button.tsx` can `Omit`
 * over THIS (index-signature-free) type instead.
 */
export interface MatFabOwnProps {
  /** When true, renders the extended FAB variant (wider, label visible). */
  extended?: boolean;
  /** See `mat-button.tsx`'s identical `color` prop doc comment — widened to
   *  `OpenString<MatButtonColor>` since `MatFabButton`/`MatMiniFabButton`
   *  extend the same upstream `MatButtonBase` (`color: string | null`). */
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
  /**
   * Leading icon — pass a `<MatIcon>` (or any icon element). Rendered as a
   * direct child BEFORE `.mdc-button__label`, not inside it with the rest
   * of `<Slot/>`. Mirrors upstream's `button.html`: it projects
   * `mat-icon`/`.material-icons`/`[matButtonIcon]` content (without
   * `iconPositionEnd`) via a SEPARATE `<ng-content>` ahead of the label's
   * own — content projection there is by TYPE, not by source position, so
   * an icon written inside the button's content still lands outside the
   * label. Qwik can't inspect `<Slot/>` children by type, so (same pattern
   * as `MatListItem`'s section props) the icon is an explicit prop instead.
   * `iconPositionEnd` (icon AFTER the label) isn't exposed — no current
   * scenario needs it.
   */
  icon?: JSXOutput;
}

/** See `mat-button.tsx`'s identical `[extraAttr]` doc comment. */
export interface MatFabProps extends MatFabOwnProps {
  [extraAttr: string]: unknown;
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

  // FAB/mini-FAB extend MatButtonBase directly (no MatIconButton-style extra
  // configureRipple({centered: true}) call) — same className, no centered.
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
