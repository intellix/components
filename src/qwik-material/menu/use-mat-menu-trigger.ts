import {$, useContext, useSignal, type NoSerialize, type QRL} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {OverlayRef, ScrollStrategyDescriptor} from '@angular-community/qwik-cdk/overlay';
import type {FocusOrigin} from '@angular-community/qwik-cdk/a11y';
import type {HostProps} from '../core/host-props';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MAT_MENU_DEFAULT_OPTIONS, MAT_MENU_SCROLL_STRATEGY} from './mat-menu-tokens';
import type {MatMenuRef} from './menu-ref';
import {openMenu, closeMenu, type MenuRuntimeSignals} from './menu-runtime';
import type {MenuCloseReason} from './menu-close-reason';

/**
 * Directive-hook form of upstream's `[matMenuTriggerFor]` (`src/material/
 * menu/menu-trigger.ts`'s `MatMenuTrigger`) — see `qwik-material/README.md`
 * ("Composing directives") and `core/host-props.ts` for the pattern this
 * implements. Returns everything the real directive would have contributed
 * to the consumer's own host element; spread `hostProps` onto whatever
 * element should become the trigger:
 *
 * ```tsx
 * const trigger = useMatMenuTrigger({menu});
 * return (
 *   <>
 *     <button {...trigger.hostProps}>Menu</button>
 *     <MatMenu />
 *   </>
 * );
 * ```
 *
 * `<MatMenuTrigger>` (`mat-menu-trigger.tsx`) is now a thin wrapper around
 * this hook for the common case where the trigger doesn't need to be
 * combined with another directive. Composing with a SECOND directive
 * (e.g. `matTooltip` also on the trigger) needs `mergeHostProps()`:
 * `<MatButton {...mergeHostProps(trigger.hostProps, tip.hostProps)}>`.
 *
 * `menu` must stay stable identity-wise across renders (same as the
 * `<MatMenuTrigger menu={…}>` prop already required) — it's read fresh on
 * every `open$()` call, not captured once.
 */
export interface UseMatMenuTriggerProps {
  /** The menu this trigger opens — see `createMatMenu()` (menu-ref.ts). */
  menu: MatMenuRef;
  /** Mirrors `[matMenuTriggerRestoreFocus]`. Default `true`. */
  restoreFocus?: boolean;
  onMenuOpened$?: QRL<() => void>;
  onMenuClosed$?: QRL<() => void>;
}

export interface MatMenuTriggerHook {
  /** Spread onto the trigger's host element. */
  hostProps: HostProps;
  /** Whether the menu is currently open. */
  isOpen: {readonly value: boolean};
  open$: QRL<() => void>;
  close$: QRL<() => void>;
}

export function useMatMenuTrigger(props: UseMatMenuTriggerProps): MatMenuTriggerHook {
  const ctx = useContext(QWIK_CDK);
  const defaults = useContext(MAT_MENU_DEFAULT_OPTIONS, {});
  // `MAT_MENU_SCROLL_STRATEGY` is a plain, serializable
  // `ScrollStrategyDescriptor` — see `select-config.ts`'s
  // `MAT_SELECT_SCROLL_STRATEGY` doc comment for why that's safe as a
  // plain default here (no `useContext()` function-typed-default pitfall).
  // `{type: 'reposition', scrollThrottle: 20}` is this port's pre-existing,
  // previously hard-coded default behaviour.
  const scrollStrategyDescriptor = useContext(MAT_MENU_SCROLL_STRATEGY, {
    type: 'reposition',
    scrollThrottle: 20,
  } as ScrollStrategyDescriptor);
  const animationsDisabled = useAnimationsDisabled();

  const overlayRef = useSignal<NoSerialize<OverlayRef>>();
  const isOpen = useSignal(false);
  const panelId = useSignal<string>();
  const pendingReason = useSignal<MenuCloseReason | undefined>();
  const openedBy = useSignal<FocusOrigin>(null);
  const hostRef = useSignal<HTMLElement>();

  const signals: MenuRuntimeSignals = {overlayRef, isOpen, panelId, pendingReason};

  const open$ = $(async () => {
    if (!isBrowser || !hostRef.value || isOpen.value) return;
    const itemsJsx = await props.menu.content$();
    if (overlayRef.value || !hostRef.value) return;
    await openMenu(itemsJsx, {
      ctx,
      signals,
      menu: props.menu,
      defaults,
      triggerEl: hostRef.value,
      isSubmenu: false,
      animationsDisabled: animationsDisabled.value,
      direction: ctx.direction.value === 'rtl' ? 'rtl' : 'ltr',
      autoFocus: true,
      origin: openedBy.value || 'program',
      restoreFocus: props.restoreFocus ?? true,
      // The trigger is never `useFocusOrigin()`-monitored — plain `.focus()`,
      // no visible class (confirmed live, see menu-runtime.ts's doc comment
      // on `OpenMenuOptions.restoreFocusTo`).
      restoreFocusTo: () => hostRef.value?.focus(),
      onClosed: () => {
        openedBy.value = null;
        props.onMenuClosed$?.();
      },
      scrollStrategyDescriptor,
    });
    props.onMenuOpened$?.();
  });

  const close$ = $(() => closeMenu(signals, undefined));

  const handleClick$ = $(() => {
    if (isOpen.value) {
      void close$();
    } else {
      void open$();
    }
  });

  const handleMouseDown$ = $((event: MouseEvent) => {
    openedBy.value = event.button === 0 ? 'mouse' : null;
  });

  const handleKeyDown$ = $((event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      openedBy.value = 'keyboard';
    }
  });

  const hostProps: HostProps = {
    ref: hostRef,
    class: 'mat-mdc-menu-trigger',
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen.value ? 'true' : 'false',
    'aria-controls': isOpen.value ? panelId.value : undefined,
    onClick$: handleClick$,
    onMouseDown$: handleMouseDown$,
    onKeyDown$: handleKeyDown$,
  };

  return {hostProps, isOpen, open$, close$};
}
