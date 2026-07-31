import {component$, useContext, type Component, type FunctionComponent} from '@builder.io/qwik';
import type {MatProgressSpinnerColor} from './progress-spinner-color';
import type {MatProgressSpinnerMode} from './progress-spinner-mode';
import {
  MAT_PROGRESS_SPINNER_CONFIG,
  type MatProgressSpinnerConfig,
} from './progress-spinner-config';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';

/**
 * Props for <MatProgressSpinner> and <MatSpinner>. Both components accept the
 * same surface; they differ only in host tag and default mode. See design spec
 * §2.3 for prop docs and §3 for rendered DOM shape.
 */
export interface MatProgressSpinnerProps {
  /** Progress percentage 0-100 (clamped). Ignored in indeterminate mode. */
  value?: number;
  /** Pixel diameter. Defaults to config.diameter, then 100. */
  diameter?: number;
  /** Pixel stroke width. Defaults to config.strokeWidth, then diameter / 10. */
  strokeWidth?: number;
  color?: MatProgressSpinnerColor;
  /** Explicit mode. Overrides the component's per-tag default. */
  mode?: MatProgressSpinnerMode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/** MatSpinner accepts the same props — it's a real component with a different tag + default mode. */
export type MatSpinnerProps = MatProgressSpinnerProps;

const BASE_SIZE = 100;
const BASE_STROKE_WIDTH = 10;
const DEFAULTS: MatProgressSpinnerConfig = {};

function clampValue(v: number): number {
  return Math.max(0, Math.min(100, v || 0));
}

function circleRadius(diameter: number): number {
  return (diameter - BASE_STROKE_WIDTH) / 2;
}

function viewBoxSide(diameter: number, strokeWidth: number): number {
  return circleRadius(diameter) * 2 + strokeWidth;
}

function strokeCircumference(diameter: number): number {
  return 2 * Math.PI * circleRadius(diameter);
}

function strokeDashOffset(diameter: number, value: number): number {
  return (strokeCircumference(diameter) * (100 - value)) / 100;
}

function circleStrokeWidthPct(diameter: number, strokeWidth: number): number {
  return (strokeWidth / diameter) * 100;
}

interface SpinnerCircleProps {
  variant: 'determinate' | 'indeterminate';
  viewBox: string;
  radius: number;
  circumference: number;
  /** stroke-dashoffset in px; omitted from inline style when undefined. */
  dashOffset: number | undefined;
  strokeWidthPct: number;
}

/**
 * Internal reusable <svg><circle/></svg>. Replaces upstream's <ng-template
 * #circle> shared template (§6 deviation #6). Rendered 4× per <MatProgressSpinner>
 * instance (1 determinate + 3 indeterminate clippers).
 */
const SpinnerCircle = component$<SpinnerCircleProps>(props => {
  const svgClass =
    props.variant === 'determinate'
      ? 'mdc-circular-progress__determinate-circle-graphic'
      : 'mdc-circular-progress__indeterminate-circle-graphic';
  const circleClass =
    props.variant === 'determinate' ? 'mdc-circular-progress__determinate-circle' : undefined;

  // Build the circle's inline style object. Omit stroke-dashoffset when undefined
  // so Qwik drops it from the emitted DOM (matches upstream's null handling).
  const circleStyle: Record<string, string> = {
    strokeDasharray: `${props.circumference}px`,
    strokeWidth: `${props.strokeWidthPct}%`,
  };
  if (props.dashOffset !== undefined) {
    circleStyle.strokeDashoffset = `${props.dashOffset}px`;
  }

  return (
    <svg
      viewBox={props.viewBox}
      class={svgClass}
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <circle r={props.radius} style={circleStyle} class={circleClass} cx="50%" cy="50%" />
    </svg>
  );
});

function createSpinner(
  hostTag: 'mat-progress-spinner' | 'mat-spinner',
  defaultMode: MatProgressSpinnerMode,
): Component<MatProgressSpinnerProps> {
  return component$<MatProgressSpinnerProps>(props => {
    const config = useContext(MAT_PROGRESS_SPINNER_CONFIG, DEFAULTS);
    const animationsDisabled = useAnimationsDisabled();

    const color = props.color ?? config.color ?? 'primary';
    const mode = props.mode ?? defaultMode;
    const diameter = props.diameter ?? config.diameter ?? BASE_SIZE;
    const strokeWidth = props.strokeWidth ?? config.strokeWidth ?? diameter / 10;
    const value = clampValue(props.value ?? 0);

    const isIndeterminate = mode === 'indeterminate';
    const noopable = animationsDisabled.value;
    const vb = viewBoxSide(diameter, strokeWidth);
    const viewBox = `0 0 ${vb} ${vb}`;
    const radius = circleRadius(diameter);
    const circumference = strokeCircumference(diameter);
    const determinateDashOffset = isIndeterminate ? undefined : strokeDashOffset(diameter, value);
    const indeterminateDashOffset = circumference / 2;
    const strokeWidthPct = circleStrokeWidthPct(diameter, strokeWidth);

    const classes = [
      'mat-mdc-progress-spinner',
      'mdc-circular-progress',
      `mat-${color}`,
      noopable && '_mat-animation-noopable',
      isIndeterminate && 'mdc-circular-progress--indeterminate',
      props.class,
    ].filter(Boolean) as string[];

    // Render the dynamic host tag via a FunctionComponent-typed alias.
    // See implementer note in the plan brief.
    const HostTag = hostTag as unknown as FunctionComponent<Record<string, unknown>>;

    return (
      <HostTag
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
        style={{
          width: `${diameter}px`,
          height: `${diameter}px`,
          '--mat-progress-spinner-size': `${diameter}px`,
          '--mat-progress-spinner-active-indicator-width': `${diameter}px`,
        }}
      >
        <div class="mdc-circular-progress__determinate-container" aria-hidden="true">
          <SpinnerCircle
            variant="determinate"
            viewBox={viewBox}
            radius={radius}
            circumference={circumference}
            dashOffset={determinateDashOffset}
            strokeWidthPct={strokeWidthPct}
          />
        </div>
        <div class="mdc-circular-progress__indeterminate-container" aria-hidden="true">
          <div class="mdc-circular-progress__spinner-layer">
            <div class="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-left">
              <SpinnerCircle
                variant="indeterminate"
                viewBox={viewBox}
                radius={radius}
                circumference={circumference}
                dashOffset={indeterminateDashOffset}
                strokeWidthPct={strokeWidthPct}
              />
            </div>
            <div class="mdc-circular-progress__gap-patch">
              <SpinnerCircle
                variant="indeterminate"
                viewBox={viewBox}
                radius={radius}
                circumference={circumference}
                dashOffset={indeterminateDashOffset}
                strokeWidthPct={strokeWidthPct}
              />
            </div>
            <div class="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-right">
              <SpinnerCircle
                variant="indeterminate"
                viewBox={viewBox}
                radius={radius}
                circumference={circumference}
                dashOffset={indeterminateDashOffset}
                strokeWidthPct={strokeWidthPct}
              />
            </div>
          </div>
        </div>
      </HostTag>
    );
  });
}

/** Renders <mat-progress-spinner>; `mode` defaults to 'determinate'. */
export const MatProgressSpinner = createSpinner('mat-progress-spinner', 'determinate');

/** Renders <mat-spinner>; `mode` defaults to 'indeterminate'. Non-deprecated alias per upstream. */
export const MatSpinner = createSpinner('mat-spinner', 'indeterminate');
