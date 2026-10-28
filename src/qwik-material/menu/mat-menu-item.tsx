import {
  $,
  component$,
  Slot,
  useContext,
  useSignal,
  useVisibleTask$,
  type JSXOutput,
  type NoSerialize,
  type QRL,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {QWIK_CDK, ensureCdkDispatchers} from '@angular-community/qwik-cdk';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import {useFocusOrigin, type FocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MAT_MENU_DEFAULT_OPTIONS} from './mat-menu-tokens';
import type {MatMenuRef} from './menu-ref';
import {openMenu, type MenuRuntimeSignals} from './menu-runtime';
import type {MenuCloseReason} from './menu-close-reason';

/**
 * Props for `<MatMenuItem>`. Mirrors upstream's `[mat-menu-item]` directive
 * (`src/material/menu/menu-item.ts`'s `MatMenuItem`), PLUS — when `menu` is
 * set — the `[matMenuTriggerFor]` directive's own behaviour applied to the
 * SAME element (upstream lets any element carry both selectors at once;
 * this is the only way a submenu is declared: see angular-parity.spec.ts's
 * `nested` scenario and this package's `menu/SYNC.md`).
 */
export interface MatMenuItemProps {
  /** Mirrors `[role]`. Default `'menuitem'`. */
  role?: 'menuitem' | 'menuitemradio' | 'menuitemcheckbox';
  /** Mirrors `[disabled]`. */
  disabled?: boolean;
  /** Mirrors `[disableRipple]`. */
  disableRipple?: boolean;
  /**
   * Content projected BEFORE the item's own text span — mirrors
   * `<ng-content select="mat-icon, [matMenuItemIcon]">`. Pass markup that
   * already carries whatever selector attribute it needs (e.g.
   * `<span matMenuItemIcon>…</span>`) — there is nothing for this prop
   * itself to bind, see angular-parity.spec.ts's `icons` scenario notes.
   */
  icon?: JSXOutput;
  /**
   * When set, this item ALSO triggers the given submenu — mirrors
   * `[matMenuTriggerFor]` applied to the same element as `[mat-menu-item]`.
   * See `menu-ref.ts`'s `createMatMenu()`.
   */
  menu?: MatMenuRef;
  /** Mirrors `[matMenuTriggerRestoreFocus]`. Only meaningful when `menu` is set. Default `true`. */
  restoreFocus?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
  /** Forwarded onto the rendered `<button>` — same rationale as every other polymorphic host's `onClick$` passthrough. */
  onClick$?: QRL<(event: MouseEvent) => void>;
}

/**
 * Qwik port of `src/material/menu/menu-item.ts` + `menu-item.html`
 * (`MatMenuItem`). Rendered by whichever `MenuPanel` resolves it as part of
 * a menu's `content$` output — NOT a `<mat-menu-item>` wrapper of its own;
 * it renders a single `<button>` carrying every host class/attribute
 * upstream's directive puts on `[mat-menu-item]`.
 */
export const MatMenuItem = component$<MatMenuItemProps>(props => {
  const ctx = useContext(QWIK_CDK);
  const defaults = useContext(MAT_MENU_DEFAULT_OPTIONS, {});
  const animationsDisabled = useAnimationsDisabled();
  const focusOrigin = useFocusOrigin();

  const hasSubmenu = !!props.menu;
  const disabled = props.disabled ?? false;

  const overlayRef = useSignal<NoSerialize<OverlayRef>>();
  const isOpen = useSignal(false);
  const panelId = useSignal<string>();
  const pendingReason = useSignal<MenuCloseReason | undefined>();
  const openedBy = useSignal<FocusOrigin>(null);
  const hostRef = useSignal<HTMLElement>();

  const signals: MenuRuntimeSignals = {overlayRef, isOpen, panelId, pendingReason};

  // Only relevant for a submenu-trigger item: cascades the close when THIS
  // item is unmounted (e.g. its parent menu is being torn down). Angular's
  // equivalent is automatic (destroying the parent view destroys this
  // directive instance, which disposes its own `_overlayRef` in
  // `ngOnDestroy`); Qwik has no such implicit cascade across sibling
  // overlay entries (the submenu's `OverlayHost` isn't a DOM/component
  // descendant of the parent's), so it's reproduced explicitly here. One
  // `useVisibleTask$` per submenu-trigger item (not every plain item) —
  // a narrow, justified exception to the "no per-instance useVisibleTask$"
  // rule: there is no lazy/useOn-based way to observe "this component is
  // about to unmount" in Qwik.
  useVisibleTask$(({cleanup}) => {
    if (!hasSubmenu) return;
    cleanup(() => {
      const ref = overlayRef.value;
      if (!ref || !isBrowser) return;
      const {keyboardDispatcher, outsideClickDispatcher} = ensureCdkDispatchers(ctx);
      keyboardDispatcher.remove(ref);
      outsideClickDispatcher.remove(ref);
      ref.detach();
    });
  });

  const openSubmenu = $(async (autoFocus: boolean) => {
    if (!isBrowser || !props.menu || !hostRef.value) return;
    const menuRef = props.menu;
    const itemsJsx = await menuRef.content$();
    // Re-check after the (async) content$ resolution — guards against a
    // hover immediately followed by a click/keydown both racing to open
    // the same submenu before either's `openMenu` call has run.
    if (overlayRef.value || !hostRef.value) return;
    openMenu(itemsJsx, {
      ctx,
      signals,
      menu: menuRef,
      defaults,
      triggerEl: hostRef.value,
      isSubmenu: true,
      animationsDisabled: animationsDisabled.value,
      direction: ctx.direction.value === 'rtl' ? 'rtl' : 'ltr',
      autoFocus,
      origin: openedBy.value || 'program',
      restoreFocus: props.restoreFocus ?? true,
      onClosed: () => {
        openedBy.value = null;
      },
    });
  });

  const handleClick$ = $((event: MouseEvent) => {
    if (disabled) return;
    if (hasSubmenu) {
      event.stopPropagation();
      void openSubmenu(true);
    }
    props.onClick$?.(event);
  });

  const handleMouseDown$ = $((event: MouseEvent) => {
    if (disabled || !hasSubmenu) return;
    openedBy.value = event.button === 0 ? 'mouse' : null;
    // Prevent focus from moving onto the trigger via click — it would
    // leave a lingering highlight (mirrors `MatMenuTrigger._handleMousedown`).
    event.preventDefault();
  });

  const handleMouseEnter$ = $(() => {
    if (disabled || !hasSubmenu) return;
    openedBy.value = 'mouse';
    void openSubmenu(false);
  });

  const handleKeyDown$ = $((event: KeyboardEvent) => {
    if (disabled || !hasSubmenu) return;
    if (event.key === 'Enter' || event.key === ' ') {
      openedBy.value = 'keyboard';
      return;
    }
    const dir = ctx.direction.value === 'rtl' ? 'rtl' : 'ltr';
    if (
      (event.key === 'ArrowRight' && dir === 'ltr') ||
      (event.key === 'ArrowLeft' && dir === 'rtl')
    ) {
      openedBy.value = 'keyboard';
      void openSubmenu(true);
    }
  });

  const focusClasses = [
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
  ].filter(Boolean) as string[];

  const classes = [
    'mat-mdc-menu-item',
    'mat-focus-indicator',
    isOpen.value && 'mat-mdc-menu-item-highlighted',
    hasSubmenu && 'mat-mdc-menu-trigger',
    hasSubmenu && 'mat-mdc-menu-item-submenu-trigger',
    ...focusClasses,
    ...(Array.isArray(props.class) ? props.class : props.class ? [props.class] : []),
  ].filter(Boolean) as string[];

  return (
    <button
      ref={hostRef}
      id={props.id}
      type="button"
      class={classes}
      role={props.role ?? 'menuitem'}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled ? 'true' : 'false'}
      disabled={(disabled ? 'true' : undefined) as unknown as boolean}
      aria-haspopup={hasSubmenu ? 'menu' : undefined}
      aria-expanded={hasSubmenu ? (isOpen.value ? 'true' : 'false') : undefined}
      aria-controls={hasSubmenu && isOpen.value ? panelId.value : undefined}
      onClick$={handleClick$}
      onMouseDown$={handleMouseDown$}
      onMouseEnter$={handleMouseEnter$}
      onKeyDown$={handleKeyDown$}
    >
      {props.icon}
      <span class="mat-mdc-menu-item-text">
        <Slot />
      </span>
      {/* `matripple` mirrors upstream's bare `matRipple` directive-selector
          attribute, lowercased by the DOM (confirmed live — see
          angular-parity.spec.ts's header note); the directive's own
          click-driven ripple animation itself is out of scope per design
          doc rule 6 (same treatment as radio/button-toggle's ripple spans) —
          only this static container is reproduced. */}
      <div
        {...({matripple: ''} as Record<string, string>)}
        class="mat-ripple mat-mdc-menu-ripple"
      />
      {hasSubmenu && (
        <svg
          class="mat-mdc-menu-submenu-icon"
          viewBox="0 0 5 10"
          focusable="false"
          aria-hidden="true"
        >
          <polygon points="0,0 5,5 0,10" />
        </svg>
      )}
    </button>
  );
});
