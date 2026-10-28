import {
  $,
  component$,
  Slot,
  useContext,
  useSignal,
  type NoSerialize,
  type QRL,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import type {FocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MAT_MENU_DEFAULT_OPTIONS} from './mat-menu-tokens';
import type {MatMenuRef} from './menu-ref';
import {openMenu, closeMenu, type MenuRuntimeSignals} from './menu-runtime';
import type {MenuCloseReason} from './menu-close-reason';

/**
 * Props for `<MatMenuTrigger>`. Mirrors upstream's `[matMenuTriggerFor]`
 * directive (`src/material/menu/menu-trigger.ts`'s `MatMenuTrigger`).
 *
 * Polymorphic host via the `as` prop — same pattern as `MatTooltip`/
 * `MatBadge`/`MatListItem` (design doc rule 4): `[matMenuTriggerFor]` is a
 * directive that attaches to the CONSUMER's own element without
 * introducing a wrapper, so `<MatMenuTrigger as="button" menu={menu}>…`
 * renders a single `<button>` — no `<MatMenuTrigger>` element of its own
 * ever appears in the DOM. For a menu ITEM that is itself a submenu
 * trigger, use `<MatMenuItem menu={…}>` instead (see mat-menu-item.tsx) —
 * `MatMenuTrigger` is only for TOP-LEVEL triggers on their own arbitrary
 * host element.
 */
export interface MatMenuTriggerProps {
  /** Which host tag to render. Default `'button'`. */
  as?: 'button' | 'a' | 'div' | 'span';
  /** The menu this trigger opens — see `createMatMenu()` (menu-ref.ts). */
  menu: MatMenuRef;
  /**
   * Whether focus should be restored to this trigger when the menu closes.
   * Mirrors `[matMenuTriggerRestoreFocus]`. Default `true`.
   */
  restoreFocus?: boolean;
  class?: string | ReadonlyArray<string>;
  style?: string | Record<string, string | number>;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  tabIndex?: number;
  /** When `as='a'`, sets the href. Ignored for other tags. */
  href?: string;
  /** Native `<button>` type. Ignored for other tags. */
  type?: 'button' | 'submit' | 'reset';
  onMenuOpened$?: QRL<() => void>;
  onMenuClosed$?: QRL<() => void>;
  onClick$?: QRL<(event: MouseEvent) => void>;
}

export const MatMenuTrigger = component$<MatMenuTriggerProps>(props => {
  const as = props.as ?? 'button';
  const ctx = useContext(QWIK_CDK);
  const defaults = useContext(MAT_MENU_DEFAULT_OPTIONS, {});
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
    openMenu(itemsJsx, {
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
    });
    props.onMenuOpened$?.();
  });

  const close$ = $(() => closeMenu(signals, undefined));

  const handleClick$ = $((event: MouseEvent) => {
    if (isOpen.value) {
      void close$();
    } else {
      void open$();
    }
    props.onClick$?.(event);
  });

  const handleMouseDown$ = $((event: MouseEvent) => {
    openedBy.value = event.button === 0 ? 'mouse' : null;
  });

  const handleKeyDown$ = $((event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      openedBy.value = 'keyboard';
    }
  });

  const classes = [
    'mat-mdc-menu-trigger',
    ...(Array.isArray(props.class) ? props.class : props.class ? [props.class] : []),
  ].filter(Boolean) as string[];

  const sharedAttrs = {
    ref: hostRef,
    id: props.id,
    class: classes,
    style: props.style,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': isOpen.value ? ('true' as const) : ('false' as const),
    'aria-controls': isOpen.value ? panelId.value : undefined,
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    tabIndex: props.tabIndex,
    onClick$: handleClick$,
    onMouseDown$: handleMouseDown$,
    onKeyDown$: handleKeyDown$,
  };

  if (as === 'a') {
    return (
      <a {...sharedAttrs} href={props.href}>
        <Slot />
      </a>
    );
  }

  if (as === 'div') {
    return (
      <div {...sharedAttrs}>
        <Slot />
      </div>
    );
  }

  if (as === 'span') {
    return (
      <span {...sharedAttrs}>
        <Slot />
      </span>
    );
  }

  return (
    <button {...sharedAttrs} type={props.type}>
      <Slot />
    </button>
  );
});
