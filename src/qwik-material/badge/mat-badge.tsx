import {component$, Slot, useContext, type QRL} from '@builder.io/qwik';
import {createIdGenerator} from '@angular-community/qwik-cdk/a11y';
import type {MatBadgeColor} from './badge-color';
import type {MatBadgePosition} from './badge-position';
import type {MatBadgeSize} from './badge-size';
import {MAT_BADGE_CONFIG, type MatBadgeConfig} from './badge-config';

/**
 * Props for <MatBadge>. Upstream's [matBadge] directive attaches to the
 * consumer's own host element and appends a <span class="mat-badge-content">
 * as its last child; it never introduces a wrapper. MatBadge mirrors that by
 * rendering the host element itself via the polymorphic `as` prop (the same
 * pattern MatListItem uses) — no extra wrapper elements.
 * See design spec §3.1/§5 rule 4, and badge/SYNC.md for the full deviation
 * list.
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

const DEFAULTS: MatBadgeConfig = {
  position: 'above after',
  size: 'medium',
  // `color: 'primary'` is upstream's conceptual default, but per the `color`
  // prop doc above it never produces a class — so it's intentionally omitted
  // here; nothing reads `config.color` for rendering.
  overlap: true,
};

/**
 * Shared monotonic id generator (qwik-cdk/a11y `_IdGenerator` port), mirroring
 * upstream's root-provided `_IdGenerator` singleton: one counter shared by
 * every `.mat-badge-content` across the app, not request-scoped. See
 * badge/SYNC.md.
 */
const idGenerator = createIdGenerator();

/**
 * Approximates upstream's `InteractivityChecker.isFocusable(host, {
 * ignoreVisibility: true })` for the concrete host tags MatBadge can render.
 * The real CDK check inspects a live DOM element; MatBadge instead derives
 * the same answer statically from the tag + the props that determine it
 * (there is no live element yet at SSR-render time). See badge/SYNC.md.
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
  const config = useContext(MAT_BADGE_CONFIG, DEFAULTS);
  const as = props.as ?? 'span';
  const position = props.position ?? config.position ?? 'above after';
  const size = props.size ?? config.size ?? 'medium';
  const overlap = props.overlap ?? config.overlap ?? true;
  const disabled = props.disabled ?? false;
  const hidden = props.hidden ?? false;

  // See the `color` prop doc above: no class unless explicitly provided.
  const colorClass = props.color ? `mat-badge-${props.color}` : undefined;

  const contentStr = props.content == null ? '' : `${props.content}`.trim();
  const hasBadgeElement = !!contentStr;
  const isAbove = !position.includes('below');
  const isAfter = !position.includes('before');
  const isHidden = hidden || !contentStr;

  const classes = [
    'mat-badge',
    colorClass,
    overlap && 'mat-badge-overlap',
    isAbove ? 'mat-badge-above' : 'mat-badge-below',
    isAfter ? 'mat-badge-after' : 'mat-badge-before',
    `mat-badge-${size}`,
    isHidden && 'mat-badge-hidden',
    disabled && 'mat-badge-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const interactive = isHostInteractive(as, props.href, props.tabIndex);
  // aria-describedby is independent of badge content (matches upstream:
  // `_updateDescription` never checks `_badgeElement`).
  const describedBy =
    props.description && interactive ? idGenerator.getId('cdk-describedby-message-') : undefined;
  // The inline description is appended INTO the badge-content span, so it
  // only exists when that span exists (matches upstream: the inline node is
  // created either way, but only ever appended when `_badgeElement` exists —
  // otherwise it's an orphaned node, invisible either way).
  const inlineDescription =
    props.description && !interactive && hasBadgeElement ? props.description : undefined;

  const badgeContentId = hasBadgeElement ? idGenerator.getId('mat-badge-content-') : undefined;
  const badgeChild = hasBadgeElement && (
    <span id={badgeContentId} class="mat-badge-content mat-badge-active" aria-hidden="true">
      {contentStr}
      {inlineDescription && <span class="cdk-visually-hidden">{inlineDescription}</span>}
    </span>
  );

  if (as === 'a') {
    return (
      <a
        id={props.id}
        class={classes}
        href={props.href}
        role={props.role}
        tabIndex={props.tabIndex}
        aria-describedby={describedBy}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        onClick$={props.onClick$}
      >
        <Slot />
        {badgeChild}
      </a>
    );
  }

  if (as === 'button') {
    return (
      <button
        id={props.id}
        class={classes}
        type={props.type}
        role={props.role}
        tabIndex={props.tabIndex}
        aria-describedby={describedBy}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        onClick$={props.onClick$}
      >
        <Slot />
        {badgeChild}
      </button>
    );
  }

  if (as === 'div') {
    return (
      <div
        id={props.id}
        class={classes}
        role={props.role}
        tabIndex={props.tabIndex}
        aria-describedby={describedBy}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        onClick$={props.onClick$}
      >
        <Slot />
        {badgeChild}
      </div>
    );
  }

  return (
    <span
      id={props.id}
      class={classes}
      role={props.role}
      tabIndex={props.tabIndex}
      aria-describedby={describedBy}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      onClick$={props.onClick$}
    >
      <Slot />
      {badgeChild}
    </span>
  );
});
