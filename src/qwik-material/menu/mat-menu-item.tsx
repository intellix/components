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
} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {QWIK_CDK, ensureCdkDispatchers} from '@angular-community/qwik-cdk';
import type {OverlayRef, ScrollStrategyDescriptor} from '@angular-community/qwik-cdk/overlay';
import {useFocusOrigin, focusVia, type FocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {extraHostAttrs} from '../core/host-props';
import {handleRippleEvent, rippleAnimationConfig} from '../core/ripple/ripple-dom';
import {useRippleGlobalOptions} from '../core/ripple/ripple-global-options';
import {MAT_MENU_DEFAULT_OPTIONS, MAT_MENU_SCROLL_STRATEGY} from './mat-menu-tokens';
import type {MatMenuRef} from './menu-ref';
import {openMenu, type MenuRuntimeSignals} from './menu-runtime';
import {cloneJsxForReuse} from '../core/jsx-reuse';
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
  /**
   * Any other attribute (`data-*`, `aria-*`, `title`, …) is forwarded onto the rendered
   * `<button>`, like a static attribute on Angular's `button[mat-menu-item]`. This item's own
   * attributes (role, `aria-*` state, handlers) always win.
   */
  [extraAttr: string]: unknown;
}

/** Props this component names explicitly — excluded from the `extraHostAttrs()` passthrough. */
const KNOWN_PROPS = new Set<string>([
  'role',
  'disabled',
  'disableRipple',
  'icon',
  'menu',
  'restoreFocus',
  'class',
  'id',
  'onClick$',
  'children',
]);

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
  // `MAT_MENU_SCROLL_STRATEGY` is a plain, serializable
  // `ScrollStrategyDescriptor` — see `use-mat-menu-trigger.ts`'s identical
  // read for why a plain default is safe here.
  const scrollStrategyDescriptor = useContext(MAT_MENU_SCROLL_STRATEGY, {
    type: 'reposition',
    scrollThrottle: 20,
  } as ScrollStrategyDescriptor);
  const animationsDisabled = useAnimationsDisabled();
  const rippleGlobalOptions = useRippleGlobalOptions();
  const focusOrigin = useFocusOrigin();

  const hasSubmenu = !!props.menu;
  const disabled = props.disabled ?? false;

  const overlayRef = useSignal<NoSerialize<OverlayRef>>();
  const isOpen = useSignal(false);
  const panelId = useSignal<string>();
  const pendingReason = useSignal<MenuCloseReason | undefined>();
  const openedBy = useSignal<FocusOrigin>(null);
  const hostRef = useSignal<HTMLElement>();
  const rippleContainerRef = useSignal<HTMLElement>();

  // Upstream `menu-item.html`: `[matRippleTrigger]="_getHostElement()"` —
  // the item's own host `<button>` (hostRef below). Reads `props.disabled`/
  // `props.disableRipple` live, matching `handleClick$`'s own convention.
  // ONE shared `$()` reference wired to all six pointer events (`onMouseDown$`
  // also carries the unrelated submenu `handleMouseDown$` alongside it via
  // an array — harmless, since the ripple-ordering concern is only about
  // `rippleEvent$` itself seeing mousedown before mouseup, which still holds
  // regardless of what else shares the `mousedown` event) — see
  // `core/ripple/ripple-renderer.ts`'s module doc comment for why that's
  // required, not just tidy (cross-chunk QRL ordering on a cold chunk).
  const rippleEvent$ = $((event: MouseEvent | TouchEvent) => {
    handleRippleEvent(
      event,
      rippleContainerRef.value,
      {
        rippleDisabled: !!(props.disableRipple || props.disabled),
        rippleConfig: {animation: rippleAnimationConfig(animationsDisabled.value)},
      },
      rippleGlobalOptions,
    );
  });

  const signals: MenuRuntimeSignals = {overlayRef, isOpen, panelId, pendingReason};

  // Every `MatMenuItem` instance only ever exists once a menu has actually
  // been opened (it's resolved from `content$()` inside `openMenu`/
  // `openSubmenu`, never rendered eagerly for an unopened menu) — so,
  // unlike a component that renders unconditionally on every page load,
  // one `useVisibleTask$` here doesn't add eagerness beyond what opening
  // the menu already required. Two things need it:
  //
  // 1. The literal `disabled="true"` attribute (mirrors upstream's
  //    `[attr.disabled]="disabled || null"`, which Angular's attribute
  //    renderer stringifies to the literal string `"true"`, NOT the plain
  //    HTML boolean-attribute empty-string form). A plain `disabled={...}`
  //    JSX prop works for this on SSR-rendered output (see
  //    `qwik-material/button`'s `disabledAttr()`), but `MatMenuItem` is
  //    rendered ENTIRELY client-side (via `overlay.create()`), where
  //    confirmed live — Qwik's client-side DOM patcher reflects a truthy
  //    `disabled` prop as the native boolean property (`disabled=""`)
  //    instead of preserving the literal string. Setting the attribute
  //    imperatively sidesteps that.
  // 2. Only for a submenu-trigger item: cascading the close when THIS item
  //    is unmounted (e.g. its parent menu is being torn down). Angular's
  //    equivalent is automatic (destroying the parent view destroys this
  //    directive instance, which disposes its own `_overlayRef` in
  //    `ngOnDestroy`); Qwik has no such implicit cascade across sibling
  //    overlay entries (the submenu's `OverlayHost` isn't a DOM/component
  //    descendant of the parent's), so it's reproduced explicitly — there
  //    is no lazy/`useOn`-based way to observe "this component is about to
  //    unmount" in Qwik.
  useVisibleTask$(({track, cleanup}) => {
    const isDisabled = track(() => disabled);
    const host = hostRef.value;
    if (host) {
      if (isDisabled) host.setAttribute('disabled', 'true');
      else host.removeAttribute('disabled');
    }
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
    await openMenu(itemsJsx, {
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
      // Unlike a top-level `MatMenuTrigger`, a submenu-trigger item DOES
      // call `useFocusOrigin()` on itself (every `MatMenuItem` does), so
      // restoring focus via `focusVia()` correctly produces the right
      // `cdk-*-focused` class — see menu-runtime.ts's doc comment on
      // `OpenMenuOptions.restoreFocusTo`.
      restoreFocusTo: origin => {
        if (hostRef.value) focusVia(hostRef.value, origin);
      },
      onClosed: () => {
        openedBy.value = null;
      },
      scrollStrategyDescriptor,
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
      {...extraHostAttrs(props as Record<string, unknown>, KNOWN_PROPS)}
      ref={hostRef}
      id={props.id}
      class={classes}
      role={props.role ?? 'menuitem'}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled ? 'true' : 'false'}
      aria-haspopup={hasSubmenu ? 'menu' : undefined}
      aria-expanded={hasSubmenu ? (isOpen.value ? 'true' : 'false') : undefined}
      aria-controls={hasSubmenu && isOpen.value ? panelId.value : undefined}
      onClick$={handleClick$}
      onMouseDown$={[handleMouseDown$, rippleEvent$]}
      onMouseUp$={rippleEvent$}
      onMouseLeave$={rippleEvent$}
      onMouseEnter$={handleMouseEnter$}
      onKeyDown$={handleKeyDown$}
      onTouchStart$={rippleEvent$}
      onTouchEnd$={rippleEvent$}
      onTouchCancel$={rippleEvent$}
    >
      {/* `cloneJsxForReuse`: this item re-renders on its own highlight-state signal change
          (see menu/SYNC.md's "re-rendered twice within the SAME open" writeup) -- rendering the
          SAME static `props.icon` JSXOutput object again on that re-render corrupts it (the
          identical bug `menu-panel.tsx` already works around for `props.content` as a whole;
          this is the same issue one level deeper, for an item's own `icon` prop). */}
      {cloneJsxForReuse(props.icon)}
      <span class="mat-mdc-menu-item-text">
        <Slot />
      </span>
      {/* `matripple` mirrors upstream's bare `matRipple` directive-selector
          attribute, lowercased by the DOM (confirmed live — see
          angular-parity.spec.ts's header note). Real `.mat-ripple-element`
          spans launch here on `mousedown`/`touchstart` of the host `<button>`
          above (`core/ripple/ripple-dom.ts`) — see menu/SYNC.md. */}
      <div
        ref={rippleContainerRef}
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
