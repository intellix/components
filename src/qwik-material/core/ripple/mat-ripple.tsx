import {component$, Slot, type QRL} from '@qwik.dev/core';
import {mergeHostProps} from '../host-props';
import type {RippleAnimationConfig} from './ripple-ref';
import {useMatRipple} from './use-mat-ripple';

/**
 * Props for `<MatRipple>`. Mirrors upstream's `[mat-ripple]`/`[matRipple]`
 * directive (`src/material/core/ripple/ripple.ts`'s `MatRipple`).
 *
 * Polymorphic host via the `as` prop — same pattern as `MatTooltip`/
 * `MatBadge`/`MatListItem` (design spec rule 4). `<MatRipple>` is a thin
 * wrapper around `useMatRipple()` (see `use-mat-ripple.ts`) for the common
 * case of a ripple surface that doesn't need to be combined with ANOTHER
 * directive. When it does, call `useMatRipple()` directly and compose with
 * `mergeHostProps()` — see `qwik-material/README.md`'s "Composing
 * directives" section. `[matRippleTrigger]` (a separate trigger element)
 * isn't exposed here either, for the same reason — call the hook directly.
 */
export interface MatRippleProps {
  /** Which host tag to render. Default `'div'` — upstream's own `ripple-overview` example uses one. */
  as?: 'div' | 'span' | 'button' | 'a';
  /** Mirrors `[matRippleColor]`. */
  color?: string;
  /** Mirrors `[matRippleUnbounded]`. Default `false`. */
  unbounded?: boolean;
  /** Mirrors `[matRippleCentered]`. Default `false`. */
  centered?: boolean;
  /** Mirrors `[matRippleRadius]`. */
  radius?: number;
  /** Mirrors `[matRippleAnimation]`. */
  animation?: RippleAnimationConfig;
  /** Mirrors `[matRippleDisabled]`. Default `false`. */
  disabled?: boolean;
  class?: string | ReadonlyArray<string>;
  style?: string | Record<string, string | number>;
  id?: string;
  role?: string;
  'aria-label'?: string;
  tabIndex?: number;
  /** When `as='a'`, sets the href. Ignored for other tags. */
  href?: string;
  /** Native `<button>` type. Ignored for other tags. */
  type?: 'button' | 'submit' | 'reset';
  onClick$?: QRL<(event: MouseEvent) => void>;
}

export const MatRipple = component$<MatRippleProps>(props => {
  const as = props.as ?? 'div';
  const ripple = useMatRipple(props);

  const hostProps = mergeHostProps(ripple.hostProps, {
    class: props.class,
    style: props.style,
    id: props.id,
    role: props.role,
    'aria-label': props['aria-label'],
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

  if (as === 'button') {
    return (
      <button {...hostProps} type={props.type}>
        <Slot />
      </button>
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
    <div {...hostProps}>
      <Slot />
    </div>
  );
});
