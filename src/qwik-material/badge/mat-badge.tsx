import {component$, Slot, useContext} from '@builder.io/qwik';
import type {MatBadgeColor} from './badge-color';
import type {MatBadgePosition} from './badge-position';
import type {MatBadgeSize} from './badge-size';
import {MAT_BADGE_CONFIG, type MatBadgeConfig} from './badge-config';

/**
 * Props for <MatBadge>. Upstream's [matBadge] directive is applied to any
 * host element; here MatBadge is a wrapper component that renders a
 * <span class="mat-badge"> around the consumer's <Slot /> content and
 * inserts a <span class="mat-badge-content"> child for the badge overlay.
 * See design spec §3.1 for rendered DOM structure and §8 for deviations.
 */
export interface MatBadgeProps {
  /** Content shown inside .mat-badge-content. Empty string / undefined toggles mat-badge-hidden. */
  content?: string | number;
  /** M2 palette color. Deprecated in M3 but honoured. */
  color?: MatBadgeColor;
  /** Whether the badge overlaps its content. Defaults to config or true. */
  overlap?: boolean;
  /** Disables the badge (grays it out). Default false. */
  disabled?: boolean;
  /** Position of the badge overlay. Defaults to config or 'above after'. */
  position?: MatBadgePosition;
  /** Visually-hidden description read by screen readers. Rendered as an
   * inline <span class="cdk-visually-hidden"> inside the badge content span.
   * Works for both interactive and non-interactive hosts.
   */
  description?: string;
  /** Badge size. Defaults to config or 'medium'. */
  size?: MatBadgeSize;
  /** When true, applies .mat-badge-hidden class. Default false. */
  hidden?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatBadgeConfig = {
  position: 'above after',
  size: 'medium',
  color: 'primary',
  overlap: true,
};

/**
 * Module-level counter for the badge-content id. Global monotonic id per
 * module load — not request-scoped. On SSR + hydration, ids may not match
 * between server and client renders. Same pattern as Dialog + Card _idSeq.
 * Documented in SYNC.md.
 */
let _idSeq = 0;

function nextBadgeContentId(): string {
  return `mat-badge-content-${_idSeq++}`;
}

export const MatBadge = component$<MatBadgeProps>(props => {
  const config = useContext(MAT_BADGE_CONFIG, DEFAULTS);
  const position = props.position ?? config.position ?? 'above after';
  const size = props.size ?? config.size ?? 'medium';
  const color = props.color ?? config.color ?? 'primary';
  const overlap = props.overlap ?? config.overlap ?? true;
  const disabled = props.disabled ?? false;
  const hidden = props.hidden ?? false;

  const contentStr = props.content == null ? '' : `${props.content}`.trim();
  const isAbove = !position.includes('below');
  const isAfter = !position.includes('before');
  const isHidden = hidden || !contentStr;

  const classes = [
    'mat-badge',
    color && `mat-badge-${color}`,
    `mat-badge-${size}`,
    isAbove ? 'mat-badge-above' : 'mat-badge-below',
    isAfter ? 'mat-badge-after' : 'mat-badge-before',
    overlap && 'mat-badge-overlap',
    isHidden && 'mat-badge-hidden',
    disabled && 'mat-badge-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const badgeContentId = nextBadgeContentId();

  return (
    <span id={props.id} class={classes}>
      <Slot />
      <span id={badgeContentId} class="mat-badge-content mat-badge-active" aria-hidden="true">
        {contentStr}
        {props.description && <span class="cdk-visually-hidden">{props.description}</span>}
      </span>
    </span>
  );
});
