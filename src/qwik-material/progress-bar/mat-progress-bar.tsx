import {component$, useContext, useSignal, useVisibleTask$, type QRL} from '@builder.io/qwik';
import type {MatProgressBarColor} from './progress-bar-color';
import type {MatProgressBarMode} from './progress-bar-mode';
import {MAT_PROGRESS_BAR_CONFIG, type MatProgressBarConfig} from './progress-bar-config';
import {MAT_ANIMATIONS_DISABLED} from '../dialog/mat-dialog-tokens';

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
  const animationsDisabled = useContext(MAT_ANIMATIONS_DISABLED);

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

  const hostRef = useSignal<Element>();

  useVisibleTask$(({cleanup}) => {
    const el = hostRef.value;
    if (!el) return;
    const handler = (event: TransitionEvent) => {
      // Filter to the primary bar's own transitionend (children bubble).
      const target = event.target as HTMLElement | null;
      if (!target || !target.classList.contains('mdc-linear-progress__primary-bar')) return;
      // Read LIVE prop values via the Qwik props proxy — this handler may fire
      // long after this useVisibleTask$ callback ran, and mode/value/callback
      // may have changed. props.X stays current across renders.
      const currentMode = props.mode ?? config.mode ?? 'determinate';
      if (currentMode !== 'determinate' && currentMode !== 'buffer') return;
      const cb = props.onAnimationEnd$;
      if (!cb) return;
      cb(clamp(props.value ?? 0));
    };
    // Cast to HTMLElement: Qwik's Ref<EL> type forces hostRef to be
    // Signal<Element | undefined>, but Element's addEventListener overloads
    // use ElementEventMap, which (unlike HTMLElementEventMap) omits
    // 'transitionend'. <mat-progress-bar> is an HTMLElement at runtime.
    (el as HTMLElement).addEventListener('transitionend', handler);
    cleanup(() => (el as HTMLElement).removeEventListener('transitionend', handler));
  });

  return (
    <mat-progress-bar
      ref={hostRef}
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
