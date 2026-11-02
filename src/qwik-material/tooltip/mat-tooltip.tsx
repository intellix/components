import {component$, Slot, type QRL} from '@qwik.dev/core';
import {mergeHostProps} from '../core/host-props';
import type {TooltipPosition, TooltipTouchGestures} from './tooltip-position';
import {useMatTooltip} from './use-mat-tooltip';

/**
 * Props for `<MatTooltip>`. Mirrors upstream's `[matTooltip]` directive
 * (`src/material/tooltip/tooltip.ts`'s `MatTooltip`).
 *
 * Polymorphic host via the `as` prop — same pattern as `MatBadge`/
 * `MatListItem` (design spec rule 4). `<MatTooltip>` is now a thin wrapper
 * around `useMatTooltip()` (see `use-mat-tooltip.ts`) for the common case
 * of a trigger that doesn't need to be combined with ANOTHER directive.
 * When it does (e.g. a trigger that's ALSO a menu trigger), call
 * `useMatTooltip()` directly and compose with `mergeHostProps()` — see
 * `qwik-material/README.md`'s "Composing directives" section.
 */
export interface MatTooltipProps {
  /** Which host tag to render. Default `'span'`. Every parity scenario uses `'button'`. */
  as?: 'button' | 'a' | 'div' | 'span';
  /** The message to show in the tooltip. Mirrors `[matTooltip]`. Falsy/whitespace-only hides. */
  message?: string | number | null;
  /** Mirrors `[matTooltipPosition]`. Default `'below'` (or the provider's `matTooltipDefaults.position`). */
  position?: TooltipPosition;
  /** Mirrors `[matTooltipPositionAtOrigin]`. */
  positionAtOrigin?: boolean;
  /** Mirrors `[matTooltipDisabled]`. Hides immediately when toggled true. */
  disabled?: boolean;
  /** Mirrors `[matTooltipShowDelay]`, in ms. */
  showDelay?: number;
  /** Mirrors `[matTooltipHideDelay]`, in ms. */
  hideDelay?: number;
  /** Mirrors `[matTooltipTouchGestures]`. See `use-mat-tooltip.ts`'s prop doc for the same caveat. */
  touchGestures?: TooltipTouchGestures;
  /** Mirrors `[matTooltipClass]`. Supports the same shapes as Angular's `ngClass` (minus `Set`). */
  tooltipClass?: string | readonly string[] | Readonly<Record<string, boolean>>;
  class?: string | ReadonlyArray<string>;
  style?: string | Record<string, string | number>;
  id?: string;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  tabIndex?: number;
  /** When `as='a'`, sets the href. Ignored for other tags. */
  href?: string;
  /** Native `<button>` type. Ignored for other tags. */
  type?: 'button' | 'submit' | 'reset';
  onClick$?: QRL<(event: MouseEvent) => void>;
  /**
   * Forwarded onto whichever host tag `as` renders — same rationale as
   * `MatListItem`'s `onClick$` doc comment.
   */
  onKeyDown$?: QRL<(event: KeyboardEvent) => void>;
}

export const MatTooltip = component$<MatTooltipProps>(props => {
  const as = props.as ?? 'span';

  // Passes `props` THROUGH AS-IS, rather than rebuilding `{message:
  // props.message, ...}` — load-bearing, not cosmetic: `useMatTooltip()`'s
  // `useTask$`s `track()` live prop changes (`message`, `disabled`) to
  // react to them after mount (e.g. `message-change`'s route swapping
  // `message` on a keydown). `track()` only establishes a subscription by
  // reading through Qwik's OWN reactive props proxy; a brand-new plain
  // object literal rebuilt from its fields on every render is NOT that
  // proxy, so `track(() => rebuiltObj.message)` silently tracks nothing —
  // confirmed live: `message-change` kept the stale message forever before
  // this fix, despite `props.message` on THIS component correctly updating
  // every render. `MatTooltipProps` is a superset of `UseMatTooltipProps`'s
  // fields (identical names/types), so this satisfies the hook's parameter
  // type with no cast.
  const tip = useMatTooltip(props);

  const hostProps = mergeHostProps(tip.hostProps, {
    class: props.class,
    style: props.style,
    id: props.id,
    role: props.role,
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    tabIndex: props.tabIndex,
    onClick$: props.onClick$,
    onKeyDown$: props.onKeyDown$,
  });

  if (as === 'a') {
    return (
      <a {...hostProps} href={props.href}>
        <Slot />
      </a>
    );
  }

  if (as === 'button') {
    return (
      <button {...hostProps} type={props.type}>
        <Slot />
      </button>
    );
  }

  if (as === 'div') {
    return (
      <div {...hostProps}>
        <Slot />
      </div>
    );
  }

  return (
    <span {...hostProps}>
      <Slot />
    </span>
  );
});
