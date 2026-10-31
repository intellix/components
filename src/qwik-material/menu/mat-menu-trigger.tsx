import {component$, Slot, type QRL} from '@builder.io/qwik';
import {mergeHostProps} from '../core/host-props';
import type {MatMenuRef} from './menu-ref';
import {useMatMenuTrigger} from './use-mat-menu-trigger';

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
 *
 * `<MatMenuTrigger>` is a thin wrapper around `useMatMenuTrigger()` (see
 * `use-mat-menu-trigger.ts`) for the common case of a trigger that doesn't
 * need to be combined with ANOTHER directive on the same element. When it
 * does (e.g. a trigger that's ALSO a tooltip), call `useMatMenuTrigger()`
 * directly and compose with `mergeHostProps()` — see
 * `qwik-material/README.md`'s "Composing directives" section.
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

  const trigger = useMatMenuTrigger({
    menu: props.menu,
    restoreFocus: props.restoreFocus,
    onMenuOpened$: props.onMenuOpened$,
    onMenuClosed$: props.onMenuClosed$,
  });

  const hostProps = mergeHostProps(trigger.hostProps, {
    class: props.class,
    style: props.style,
    id: props.id,
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    tabIndex: props.tabIndex,
    onClick$: props.onClick$,
  });

  if (as === 'a') {
    return (
      <a {...hostProps} href={props.href}>
        <Slot />
      </a>
    );
  }

  if (as === 'div') {
    return (
      <div {...hostProps}>
        <Slot />
      </div>
    );
  }

  if (as === 'span') {
    return (
      <span {...hostProps}>
        <Slot />
      </span>
    );
  }

  return (
    <button {...hostProps} type={props.type}>
      <Slot />
    </button>
  );
});
