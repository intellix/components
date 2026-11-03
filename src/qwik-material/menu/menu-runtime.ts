/**
 * Module-level orchestration for opening/closing a `mat-menu` overlay,
 * ported from `MatMenuTriggerBase._openMenu()`/`_destroyMenu()`/
 * `_createOverlay()`/`_getOverlayConfig()`/`_setPosition()` plus `MatMenu`'s
 * own `_handleKeydown()` (`src/material/menu/menu-trigger-base.ts` +
 * `menu.ts`).
 *
 * Deliberately free functions, not closures inside a `component$` body —
 * same rationale as `qwik-material/tooltip/tooltip-runtime.ts`'s identical
 * header comment: Qwik's optimizer can't reliably capture a plain local
 * closure across a `$()` boundary, and BOTH `MatMenuTrigger` (top-level
 * triggers) and `MatMenuItem` (submenu triggers) need this exact logic.
 */
import {
  $,
  noSerialize,
  type NoSerialize,
  type QRL,
  type JSXOutput,
  type Signal,
} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {ensureCdkDispatchers, type QwikCdkInternals} from '@angular-community/qwik-cdk';
import {
  focusVia,
  type FocusOrigin,
  createFocusKeyManager,
  type FocusKeyManager,
} from '@angular-community/qwik-cdk/a11y';
import {
  createOverlayService,
  createFlexibleConnectedPositionStrategy,
  createRepositionScrollStrategy,
  type OverlayEntry,
  type OverlayRef,
  type OverlayRegistry,
} from '@angular-community/qwik-cdk/overlay';
import {MenuPanel} from './menu-panel';
import type {MenuCloseReason} from './menu-close-reason';
import type {MenuPositionX, MenuPositionY} from './menu-positions';
import type {MatMenuRef} from './menu-ref';
import type {MatMenuDefaultOptions} from './mat-menu-tokens';
import {MAT_MENU_DEFAULT_OPTIONS_FACTORY} from './mat-menu-tokens';

/** Signals one open/close "session" owns — created by the caller (`MatMenuTrigger`/`MatMenuItem`), mutated here. */
export interface MenuRuntimeSignals {
  overlayRef: Signal<NoSerialize<OverlayRef> | undefined>;
  isOpen: Signal<boolean>;
  panelId: Signal<string | undefined>;
  /** The reason passed to the in-flight close, read once the exit animation finishes. */
  pendingReason: Signal<MenuCloseReason | undefined>;
}

/** Resolved, defaults-merged view of a `MatMenuRef` — see `resolveMenuConfig`. */
export interface ResolvedMenuConfig {
  xPosition: MenuPositionX;
  yPosition: MenuPositionY;
  overlapTrigger: boolean;
  /** `undefined` mirrors upstream's `menu.hasBackdrop == null` branch — resolved per-open by `computeHasBackdrop`. */
  hasBackdrop: boolean | undefined;
  backdropClass: string;
  overlayPanelClass?: string | string[];
  panelClassList: string[];
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  content$: QRL<() => JSXOutput>;
}

function splitClassList(value: string | ReadonlyArray<string> | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return [...(value as readonly string[])];
  return (value as string).split(/\s+/).filter(Boolean);
}

/** Merges a `MatMenuRef`'s own fields with `MAT_MENU_DEFAULT_OPTIONS` and upstream's hardcoded defaults. */
export function resolveMenuConfig(
  menu: MatMenuRef,
  defaults: MatMenuDefaultOptions,
): ResolvedMenuConfig {
  return {
    xPosition: menu.xPosition ?? defaults.xPosition ?? MAT_MENU_DEFAULT_OPTIONS_FACTORY.xPosition,
    yPosition: menu.yPosition ?? defaults.yPosition ?? MAT_MENU_DEFAULT_OPTIONS_FACTORY.yPosition,
    overlapTrigger:
      menu.overlapTrigger ??
      defaults.overlapTrigger ??
      MAT_MENU_DEFAULT_OPTIONS_FACTORY.overlapTrigger,
    hasBackdrop: menu.hasBackdrop ?? defaults.hasBackdrop,
    backdropClass:
      menu.backdropClass ??
      defaults.backdropClass ??
      MAT_MENU_DEFAULT_OPTIONS_FACTORY.backdropClass,
    overlayPanelClass: menu.overlayPanelClass ?? defaults.overlayPanelClass,
    panelClassList: splitClassList(menu.panelClass),
    ariaLabel: menu['aria-label'],
    ariaLabelledby: menu['aria-labelledby'],
    ariaDescribedby: menu['aria-describedby'],
    content$: menu.content$,
  };
}

/**
 * Mirrors `MatMenuTriggerBase._openMenu`'s backdrop computation
 * (`_getOverlayConfig` reached only via the always-true `_canHaveBackdrop`
 * branch, since `MatMenuTrigger` always calls `super(true)`):
 * `hasBackdrop == null ? !triggersSubmenu : hasBackdrop`.
 */
export function computeHasBackdrop(resolved: ResolvedMenuConfig, isSubmenu: boolean): boolean {
  return resolved.hasBackdrop ?? !isSubmenu;
}

/** Mirrors `MatMenuTriggerBase._setPosition`'s position-pair computation. */
export function computePositions(
  resolved: ResolvedMenuConfig,
  isSubmenu: boolean,
  parentInnerPadding: number,
) {
  let [originX, originFallbackX] =
    resolved.xPosition === 'before' ? (['end', 'start'] as const) : (['start', 'end'] as const);
  let [overlayY, overlayFallbackY] =
    resolved.yPosition === 'above' ? (['bottom', 'top'] as const) : (['top', 'bottom'] as const);
  let [originY, originFallbackY]: ('top' | 'bottom')[] = [overlayY, overlayFallbackY];
  let [overlayX, overlayFallbackX]: ('start' | 'end')[] = [originX, originFallbackX];
  let offsetY = 0;

  if (isSubmenu) {
    overlayFallbackX = originX = resolved.xPosition === 'before' ? 'start' : 'end';
    originFallbackX = overlayX = originX === 'end' ? 'start' : 'end';
    offsetY = overlayY === 'bottom' ? parentInnerPadding : -parentInnerPadding;
  } else if (!resolved.overlapTrigger) {
    originY = overlayY === 'top' ? 'bottom' : 'top';
    originFallbackY = overlayFallbackY === 'top' ? 'bottom' : 'top';
  }

  return [
    {originX, originY, overlayX, overlayY, offsetY},
    {originX: originFallbackX, originY, overlayX: overlayFallbackX, overlayY, offsetY},
    {originX, originY: originFallbackY, overlayX, overlayY: overlayFallbackY, offsetY: -offsetY},
    {
      originX: originFallbackX,
      originY: originFallbackY,
      overlayX: overlayFallbackX,
      overlayY: overlayFallbackY,
      offsetY: -offsetY,
    },
  ];
}

/**
 * Walks up from a just-opened submenu's trigger item to its PARENT panel's
 * first item, mirroring `this._parentInnerPadding = firstItem._getHostElement().offsetTop`
 * — the vertical compensation so a submenu's first item visually aligns
 * with its trigger instead of sitting 8px (the panel content's own top
 * padding) too low.
 */
export function getParentInnerPadding(itemEl: HTMLElement): number {
  const parentPanel = itemEl.closest<HTMLElement>('.mat-mdc-menu-panel');
  const firstItem = parentPanel?.querySelector<HTMLElement>('.mat-mdc-menu-item');
  return firstItem?.offsetTop ?? 0;
}

function makeIdGen(ctx: QwikCdkInternals) {
  return {
    getId(prefix: string): string {
      return `${prefix}${ctx.idCounter.value++}`;
    },
  };
}

function makeRegistry(ctx: QwikCdkInternals): OverlayRegistry {
  return {
    entries: ctx.entries,
    push: e => {
      ctx.overlayContainerCreated.value = true;
      ctx.entries.value = [...ctx.entries.value, e];
    },
    remove: id => {
      ctx.entries.value = ctx.entries.value.filter(x => x.id !== id);
    },
    get: id => ctx.entries.value.find((x: OverlayEntry) => x.id === id),
  };
}

/**
 * Polls until the overlay's host/pane DOM refs exist (mirrors
 * `qwik-material/tooltip/tooltip-runtime.ts`'s identical helper — see its
 * doc comment for why polling, not a direct call, is needed: `OverlayHost`'s
 * own `useVisibleTask$` and this menu's opening code run in different Qwik
 * render passes with no guaranteed ordering between sibling visible tasks).
 */
function whenAttached(overlayRef: OverlayRef, fn: () => void, triesLeft = 30): void {
  if (!isBrowser) return;
  if (overlayRef.hasAttached()) {
    fn();
    return;
  }
  if (triesLeft <= 0) return;
  setTimeout(() => whenAttached(overlayRef, fn, triesLeft - 1), 4);
}

export interface OpenMenuOptions {
  ctx: QwikCdkInternals;
  signals: MenuRuntimeSignals;
  menu: MatMenuRef;
  defaults: MatMenuDefaultOptions;
  /** The element the overlay connects to (the trigger button, or the submenu-trigger item). */
  triggerEl: HTMLElement;
  isSubmenu: boolean;
  animationsDisabled: boolean;
  direction: 'ltr' | 'rtl';
  /** Whether to auto-focus the first (enabled) item once attached. */
  autoFocus: boolean;
  /** Focus origin used both for auto-focus and for restoring focus to `triggerEl` on close. */
  origin: FocusOrigin;
  /** Whether focus should be restored to `triggerEl` on close (mirrors `matMenuTriggerRestoreFocus`, default `true`). */
  restoreFocus: boolean;
  /**
   * Restores focus to the trigger on close, given the origin to restore
   * with. Split out from a plain `focusVia(triggerEl, origin)` call because
   * the two trigger kinds need DIFFERENT restoration: a top-level
   * `MatMenuTrigger` is never `useFocusOrigin()`-monitored (confirmed live
   * — "plain .focus(), no visible class", see angular-parity.spec.ts's
   * `basic` notes), so calling qwik-cdk's `focusVia()` on it would write a
   * `data-cdk-pending-focus-origin` attribute that nothing ever consumes,
   * leaking into the DOM forever; a submenu-trigger `MatMenuItem` IS
   * monitored (it calls `useFocusOrigin()` on itself), so it DOES need the
   * real `focusVia()` to get the correct `cdk-*-focused` class back.
   */
  restoreFocusTo: (origin: FocusOrigin) => void;
  /** Called once the overlay has fully detached (after the exit animation). */
  onClosed: (reason: MenuCloseReason | undefined) => void;
}

/**
 * Opens a menu (or submenu) overlay. Mirrors `MatMenuTriggerBase._openMenu`:
 * builds the position strategy + overlay config, creates the overlay,
 * wires the keyboard/outside-click dispatchers, and (once attached) builds
 * a `FocusKeyManager` over the rendered `.mat-mdc-menu-item` elements and
 * optionally auto-focuses the first one.
 *
 * Simplifications vs. upstream (see `menu/SYNC.md`): items are resolved via
 * `menu.content$()` by the CALLER before this is invoked (`itemsJsx`
 * parameter) rather than inside the panel component, so no `JSXOutput`
 * ever crosses an SSR-serialization boundary (this whole flow only ever
 * runs client-side, after a real interaction — see `menu-ref.ts`'s doc
 * comment); the key manager's items are built from the LIVE rendered DOM
 * (`.mat-mdc-menu-item` elements) rather than a `QueryList`, since nothing
 * in this port adds/removes items while a menu is already open; panel
 * position classes use the statically configured `xPosition`/`yPosition`
 * rather than the position strategy's resolved connection pair (every
 * parity scenario's preferred position always fits the viewport, so the
 * two are always equal in practice).
 */
export function openMenu(itemsJsx: JSXOutput, options: OpenMenuOptions): void {
  if (!isBrowser) return;
  if (options.signals.overlayRef.value) return;

  const {ctx, signals} = options;
  const resolved = resolveMenuConfig(options.menu, options.defaults);
  const {keyboardDispatcher, outsideClickDispatcher} = ensureCdkDispatchers(ctx);
  const idGen = makeIdGen(ctx);
  const registry = makeRegistry(ctx);
  const overlay = createOverlayService(registry, idGen, ctx.overlayDefaultConfig);

  const parentInnerPadding = options.isSubmenu ? getParentInnerPadding(options.triggerEl) : 0;
  const positions = computePositions(resolved, options.isSubmenu, parentInnerPadding);
  const strategy = createFlexibleConnectedPositionStrategy(options.triggerEl)
    .withLockedPosition()
    .withGrowAfterOpen()
    .withTransformOriginOn('.mat-menu-panel, .mat-mdc-menu-panel')
    .withPositions(positions);

  const panelId = idGen.getId('mat-menu-panel-');
  signals.panelId.value = panelId;
  signals.isOpen.value = true;

  const hasBackdrop = computeHasBackdrop(resolved, options.isSubmenu);

  let keyManager:
    | FocusKeyManager<{
        disabled?: boolean;
        getLabel?(): string;
        focus(origin?: FocusOrigin): void;
      }>
    | undefined;

  const requestClose = (reason: MenuCloseReason | undefined) => {
    if (!signals.overlayRef.value || !signals.isOpen.value) return;
    signals.pendingReason.value = reason;
    signals.isOpen.value = false;
  };

  const handleExitDone = $(() => {
    const ref = signals.overlayRef.value;
    if (!ref) return;
    const reason = signals.pendingReason.value;
    keyboardDispatcher.remove(ref);
    outsideClickDispatcher.remove(ref);
    ref.detach();
    signals.overlayRef.value = undefined;
    signals.panelId.value = undefined;
    signals.pendingReason.value = undefined;
    if (options.restoreFocus && (reason === 'keydown' || !options.isSubmenu)) {
      options.restoreFocusTo(options.origin);
    }
    options.onClosed(reason);
  });

  const handlePanelClick = $(() => requestClose('click'));

  const overlayRef = overlay.create(
    MenuPanel,
    {
      panelId,
      content: itemsJsx,
      panelClassList: resolved.panelClassList,
      xPositionClass: resolved.xPosition,
      yPositionClass: resolved.yPosition,
      animationsDisabled: options.animationsDisabled,
      isOpen: signals.isOpen,
      ariaLabel: resolved.ariaLabel,
      ariaLabelledby: resolved.ariaLabelledby,
      ariaDescribedby: resolved.ariaDescribedby,
      onPanelClick$: handlePanelClick,
      onExitDone$: handleExitDone,
    },
    {
      positionStrategy: strategy,
      backdropClass: resolved.backdropClass,
      panelClass: resolved.overlayPanelClass,
      hasBackdrop,
      direction: options.direction,
      disableAnimations: options.animationsDisabled,
      scrollStrategy: createRepositionScrollStrategy({scrollThrottle: 20}),
    },
  );

  signals.overlayRef.value = noSerialize(overlayRef);

  keyboardDispatcher.add(overlayRef, {
    onKeydown(event) {
      switch (event.key) {
        case 'Escape': {
          const hasModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
          if (!hasModifier) {
            event.preventDefault();
            requestClose('keydown');
          }
          return;
        }
        case 'ArrowLeft':
          if (options.isSubmenu && options.direction === 'ltr') requestClose('keydown');
          return;
        case 'ArrowRight':
          if (options.isSubmenu && options.direction === 'rtl') requestClose('keydown');
          return;
        default:
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            keyManager?.setFocusOrigin('keyboard');
          }
          keyManager?.onKeydown(event);
      }
    },
  });

  if (hasBackdrop) {
    outsideClickDispatcher.add(overlayRef, {
      onOutsideClick: () => requestClose(undefined),
    });
  }

  whenAttached(overlayRef, () => {
    const itemEls = Array.from(
      overlayRef.overlayElement?.querySelectorAll<HTMLElement>('.mat-mdc-menu-item') ?? [],
    );
    const items = itemEls.map(el => ({
      disabled: el.hasAttribute('disabled'),
      getLabel: () => el.textContent?.trim() ?? '',
      focus: (origin?: FocusOrigin) => focusVia(el, origin ?? null),
    }));
    keyManager = createFocusKeyManager(items).withWrap().withHomeAndEnd().withTypeAhead();

    if (options.autoFocus) {
      keyManager.setFocusOrigin(options.origin).setFirstItemActive();
      if (!keyManager.activeItem) {
        overlayRef.overlayElement?.querySelector<HTMLElement>('.mat-mdc-menu-panel')?.focus();
      } else if (overlayRef.overlayElement && keyManager.activeItemIndex === 0) {
        const panelEl = overlayRef.overlayElement.querySelector<HTMLElement>('.mat-mdc-menu-panel');
        if (panelEl) panelEl.scrollTop = 0;
      }
    }
  });
}

/** Closes an open menu session, if any. Mirrors `MatMenuTriggerBase._closeMenu` / `_destroyMenu`'s entry point. */
export function closeMenu(signals: MenuRuntimeSignals, reason: MenuCloseReason | undefined): void {
  if (!isBrowser) return;
  if (!signals.overlayRef.value || !signals.isOpen.value) return;
  signals.pendingReason.value = reason;
  signals.isOpen.value = false;
}
