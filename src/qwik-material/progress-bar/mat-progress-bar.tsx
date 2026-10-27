import {$, component$, useContext, useOn, type QRL} from '@builder.io/qwik';
import type {MatProgressBarColor} from './progress-bar-color';
import type {MatProgressBarMode} from './progress-bar-mode';
import {MAT_PROGRESS_BAR_CONFIG, type MatProgressBarConfig} from './progress-bar-config';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';

/**
 * Props for <MatProgressBar>. Renders <mat-progress-bar> custom element with
 * the upstream MDC linear-progress DOM structure. See design spec §3.
 */
export interface MatProgressBarProps {
  /** Progress percentage 0-100 (clamped). Ignored in indeterminate/query mode. */
  value?: number;
  /** Buffer percentage 0-100 (clamped). Only visually applied in `buffer` mode. */
  bufferValue?: number;
  color?: MatProgressBarColor;
  mode?: MatProgressBarMode;
  /**
   * Fires when the primary bar's `transitionend` event completes in
   * `determinate` or `buffer` mode. Not called for `indeterminate` / `query`.
   * The callback receives the current clamped value at fire time.
   */
  onAnimationEnd$?: QRL<(value: number) => void>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatProgressBarConfig = {};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v || 0));
}

export const MatProgressBar = component$<MatProgressBarProps>(props => {
  const config = useContext(MAT_PROGRESS_BAR_CONFIG, DEFAULTS);
  const animationsDisabled = useAnimationsDisabled();

  const color = props.color ?? config.color ?? 'primary';
  const mode = props.mode ?? config.mode ?? 'determinate';
  const value = clamp(props.value ?? 0);
  const bufferValue = clamp(props.bufferValue ?? 0);

  const isIndeterminate = mode === 'indeterminate' || mode === 'query';
  const noopable = animationsDisabled.value;
  const primaryTransform = `scaleX(${isIndeterminate ? 1 : value / 100})`;
  const bufferFlexBasis = `${mode === 'buffer' ? bufferValue : 100}%`;

  const classes = [
    'mat-mdc-progress-bar',
    'mdc-linear-progress',
    `mat-${color}`,
    noopable && '_mat-animation-noopable',
    !noopable && 'mdc-linear-progress--animation-ready',
    isIndeterminate && 'mdc-linear-progress--indeterminate',
    props.class,
  ].filter(Boolean) as string[];

  // Upstream `ngAfterViewInit()`'s `renderer.listen(elementRef, 'transitionend',
  // this._transitionendHandler)` — always attached eagerly there (it no-ops
  // internally when nobody subscribed to `animationEnd`), firing
  // `onAnimationEnd$` only for the primary bar's own transitionend
  // (`transitionend` bubbles, so children firing it is expected and
  // filtered below) in determinate/buffer mode.
  //
  // `useOn()` is the lazy, per-instance replacement (rule 7 of the
  // lazy-interactions remediation: no per-instance `useVisibleTask$` for
  // interaction/measuring plumbing in components that appear many times per
  // page): it attaches a serialized `on:transitionend` reference to this
  // component's own host element at SSR time, and qwikloader loads/runs the
  // handler chunk only the first time a transition actually completes on
  // this element — e.g. never at all for an `indeterminate`/`query` bar, or
  // one whose `value` never changes after first paint. No `hostRef`/`ref` is
  // needed: the handler receives the host element as its second argument
  // (unused here — the filtering only needs `event.target`).
  useOn(
    'transitionend',
    $((event: TransitionEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !target.classList.contains('mdc-linear-progress__primary-bar')) return;
      // Read LIVE prop values via the Qwik props proxy — this handler may
      // fire long after render, and mode/value/callback may have changed.
      // props.X stays current across renders.
      const currentMode = props.mode ?? config.mode ?? 'determinate';
      if (currentMode !== 'determinate' && currentMode !== 'buffer') return;
      const cb = props.onAnimationEnd$;
      if (!cb) return;
      cb(clamp(props.value ?? 0));
    }),
  );

  return (
    <mat-progress-bar
      id={props.id}
      class={classes}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isIndeterminate ? undefined : value}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
      tabIndex={-1}
      mode={mode}
    >
      <div class="mdc-linear-progress__buffer" aria-hidden="true">
        <div class="mdc-linear-progress__buffer-bar" style={{flexBasis: bufferFlexBasis}} />
        {mode === 'buffer' && <div class="mdc-linear-progress__buffer-dots" />}
      </div>
      <div
        class="mdc-linear-progress__bar mdc-linear-progress__primary-bar"
        aria-hidden="true"
        style={{transform: primaryTransform}}
      >
        <span class="mdc-linear-progress__bar-inner" />
      </div>
      <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar" aria-hidden="true">
        <span class="mdc-linear-progress__bar-inner" />
      </div>
    </mat-progress-bar>
  );
});
