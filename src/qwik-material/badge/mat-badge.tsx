import {component$, Slot, type QRL} from '@builder.io/qwik';
import {mergeHostProps} from '../core/host-props';
import type {MatBadgeColor} from './badge-color';
import type {MatBadgePosition} from './badge-position';
import type {MatBadgeSize} from './badge-size';
import {useMatBadge} from './use-mat-badge';

/**
 * Props for <MatBadge>. Upstream's [matBadge] directive attaches to the
 * consumer's own host element and appends a <span class="mat-badge-content">
 * as its last child; it never introduces a wrapper. MatBadge mirrors that by
 * rendering the host element itself via the polymorphic `as` prop (the same
 * pattern MatListItem uses) — no extra wrapper elements.
 * See design spec §3.1/§5 rule 4, and badge/SYNC.md for the full deviation
 * list.
 *
 * `<MatBadge>` is now a thin wrapper around `useMatBadge()` (see
 * `use-mat-badge.ts`) for the common case of a badge that doesn't need to
 * be combined with ANOTHER directive on the same element. When it does
 * (e.g. a badge on a `MatButton`/`MatIcon`), call `useMatBadge()` directly
 * — see `qwik-material/README.md`'s "Composing directives" section.
 */
export interface MatBadgeProps {
  /** Which host tag MatBadge renders. Default 'span'. The parity scenarios
   *  all use 'button' (mirrors `<button matBadge>` in the Angular dev-app). */
  as?: 'span' | 'div' | 'button' | 'a';
  /** Content shown inside .mat-badge-content. Empty/whitespace-only content
   *  (after trim) renders NO badge-content element at all — matches upstream
   *  (the directive never creates the span when there's nothing to show). */
  content?: string | number;
  /**
   * M2 palette color. Deprecated in M3 but honoured. Upstream quirk
   * (preserved here): the `mat-badge-<color>` class is only ever added by
   * the `matBadgeColor` input's imperative setter — which Angular only
   * invokes when the template explicitly binds `[matBadgeColor]`. The
   * directive's *default* color ('primary', or the config's default) is
   * assigned straight to the backing field in the constructor, bypassing
   * that setter, so it never produces a class. Concretely: no `color` prop
   * here ⇒ no color class, even though the conceptual default is 'primary'.
   */
  color?: MatBadgeColor;
  /** Whether the badge overlaps its content. Defaults to config or true. */
  overlap?: boolean;
  /** Disables the badge (grays it out via .mat-badge-disabled). Default
   *  false. This is `matBadgeDisabled` — a purely visual class, distinct
   *  from the host's own native `disabled` attribute/state. */
  disabled?: boolean;
  /** Position of the badge overlay. Defaults to config or 'above after'. */
  position?: MatBadgePosition;
  /**
   * Message describing the decorated element. When the rendered host is
   * interactive (focusable), this becomes an `aria-describedby` reference on
   * the host (matches upstream's `AriaDescriber` path). Otherwise it's
   * rendered as an inline `<span class="cdk-visually-hidden">` inside the
   * badge-content span (matches upstream's non-interactive-host path) — and,
   * like upstream, that inline span only appears when there IS a
   * badge-content element to attach it to.
   */
  description?: string;
  /** Badge size. Defaults to config or 'medium'. */
  size?: MatBadgeSize;
  /** When true, applies .mat-badge-hidden class. Default false. Independent
   *  of whether the badge-content element is actually rendered. */
  hidden?: boolean;
  /** When as='a', sets the href. Also makes the anchor interactive for the
   *  `description` → aria-describedby decision (mirrors upstream's
   *  `isAnchorWithHref`). */
  href?: string;
  /** Native <button> type. Ignored for other tags. Omitted by default —
   *  upstream's host is a plain element; matBadge never injects a type. */
  type?: 'button' | 'submit' | 'reset';
  /** Explicit tabIndex. A valid (non-NaN) value makes div/span hosts count
   *  as interactive for the `description` → aria-describedby decision
   *  (mirrors upstream's `hasValidTabIndex`). */
  tabIndex?: number;
  onClick$?: QRL<(e: MouseEvent) => void>;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/**
 * Approximates upstream's `InteractivityChecker.isFocusable(host, {
 * ignoreVisibility: true })` for the concrete host tags MatBadge can render.
 * See `use-mat-badge.ts`'s `interactive` prop doc — MatBadge (which DOES
 * know its own `as`/`href`/`tabIndex`) resolves this itself and passes the
 * result in, rather than the hook guessing.
 */
function isHostInteractive(
  as: NonNullable<MatBadgeProps['as']>,
  href?: string,
  tabIndex?: number,
): boolean {
  if (as === 'button') return true; // isNativeFormElement; MatBadge exposes no native-disabled passthrough yet.
  if (as === 'a') return !!href; // isAnchorWithHref
  return typeof tabIndex === 'number' && !Number.isNaN(tabIndex); // hasValidTabIndex
}

export const MatBadge = component$<MatBadgeProps>(props => {
  const as = props.as ?? 'span';

  const badge = useMatBadge({
    content: props.content,
    color: props.color,
    overlap: props.overlap,
    disabled: props.disabled,
    position: props.position,
    description: props.description,
    size: props.size,
    hidden: props.hidden,
    interactive: isHostInteractive(as, props.href, props.tabIndex),
  });

  const hostProps = mergeHostProps(badge.hostProps, {
    class: props.class,
    id: props.id,
    role: props.role,
    tabIndex: props.tabIndex,
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    onClick$: props.onClick$,
  });

  if (as === 'a') {
    return (
      <a {...hostProps} href={props.href}>
        <Slot />
        {badge.content}
      </a>
    );
  }

  if (as === 'button') {
    return (
      <button {...hostProps} type={props.type}>
        <Slot />
        {badge.content}
      </button>
    );
  }

  if (as === 'div') {
    return (
      <div {...hostProps}>
        <Slot />
        {badge.content}
      </div>
    );
  }

  return (
    <span {...hostProps}>
      <Slot />
      {badge.content}
    </span>
  );
});
