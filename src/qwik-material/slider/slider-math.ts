/**
 * Pure geometry/value math ported from `src/material/slider/slider.ts` and
 * `src/material/slider/slider-input.ts`. Deliberately framework-free (no
 * Qwik imports) so it can be unit-tested directly — see `slider-math.spec.ts`,
 * which cross-checks several of these against the exact numbers verified
 * live in `specs/material-slider/angular-parity.spec.ts`'s header comment
 * (notes 1, 3, 4, 6, 9).
 *
 * Constants mirror upstream's hardcoded values (`slider-thumb.ts`'s
 * `_knobRadius`/`_tickMarkOffset`, `slider.ts`'s `_rippleRadius`/
 * `_knobRadius`-derived `_inputPadding`). `_rippleRadius` is set once from
 * `MatRipple.radius` (always 24 in practice — `MatSliderVisualThumb.
 * ngAfterViewInit` hardcodes `this._ripple.radius = 24`), so it's inlined as
 * a constant here rather than threaded through as a parameter.
 */

/** `MatSliderThumb._knobRadius`. */
export const KNOB_RADIUS = 8;
/** `MatSliderVisualThumb.ngAfterViewInit`: `this._ripple.radius = 24`. */
export const RIPPLE_RADIUS = 24;
/** `MatSliderThumb._tickMarkOffset`. */
export const TICK_MARK_OFFSET = 3;
/** `MatSlider.ngAfterViewInit`: `this._inputPadding = this._rippleRadius - this._knobRadius`. */
export const INPUT_PADDING = RIPPLE_RADIUS - KNOB_RADIUS;

/** `MatSliderThumb.percentage` getter. */
export function percentage(value: number, min: number, max: number, isRtl: boolean): number {
  if (min >= max) return isRtl ? 1 : 0;
  return (value - min) / (max - min);
}

/** `MatSliderThumb._calcTranslateXByValue`. */
export function calcTranslateXByValue(
  value: number,
  min: number,
  max: number,
  cachedWidth: number,
  isRtl: boolean,
): number {
  if (min >= max) return TICK_MARK_OFFSET;
  const pct = percentage(value, min, max, isRtl);
  return isRtl
    ? (1 - pct) * (cachedWidth - TICK_MARK_OFFSET * 2) + TICK_MARK_OFFSET
    : pct * (cachedWidth - TICK_MARK_OFFSET * 2) + TICK_MARK_OFFSET;
}

/** `MatSliderThumb._clamp` (non-range thumb). */
export function clampSingle(translateX: number, cachedWidth: number): number {
  return Math.max(Math.min(translateX, cachedWidth - TICK_MARK_OFFSET), TICK_MARK_OFFSET);
}

/** `MatSliderRangeThumb._clamp`, given this thumb's own min/max allowed positions. */
export function clampRange(translateX: number, minPos: number, maxPos: number): number {
  return Math.max(Math.min(translateX, maxPos), minPos);
}

/** `MatSliderThumb.fillPercentage` getter. */
export function fillPercentage(translateX: number, cachedWidth: number, isRtl: boolean): number {
  if (!cachedWidth) return isRtl ? 1 : 0;
  if (translateX === 0) return 0;
  return translateX / cachedWidth;
}

/** `MatSliderThumb._updateWidthInactive` (non-range thumb). */
export function inactiveWidthStyleNonRange(): {padding: string; width: string; left: string} {
  return {
    padding: `0 ${INPUT_PADDING}px`,
    width: `calc(100% + ${INPUT_PADDING - TICK_MARK_OFFSET * 2}px)`,
    left: `-${RIPPLE_RADIUS - TICK_MARK_OFFSET}px`,
  };
}

export interface TrackActiveStyle {
  left: string;
  right: string;
  transformOrigin: string;
  transform: string;
}

/** `MatSlider._updateTrackUINonRange`. */
export function trackActiveStyleNonRange(fillPct: number, isRtl: boolean): TrackActiveStyle {
  return isRtl
    ? {left: 'auto', right: '0px', transformOrigin: 'right', transform: `scaleX(${1 - fillPct})`}
    : {left: '0px', right: 'auto', transformOrigin: 'left', transform: `scaleX(${fillPct})`};
}

/**
 * `MatSlider._updateTrackUIRange`. `sourceIsLeftThumb` picks the branch,
 * where "source" is whichever thumb most recently triggered this update —
 * confirmed live this is NOT always the start/left thumb: `MatSliderThumb.
 * _onFocus` ALSO calls `_updateTrackUI(this)` (not just a native `input`
 * event), so focusing the END thumb re-renders this with source=END (the
 * non-left branch) even with no value change at all. The caller
 * (mat-slider.tsx) tracks which thumb last fired either event in
 * `SliderStore.rangeTrackSource`, defaulting to `'start'` — not because
 * `source` is literally START at mount (upstream's `ngAfterViewInit` calls
 * `_updateTrackUI(eInput)`, i.e. END), but because a `ResizeObserver`
 * fires once asynchronously right after mount per spec (even with no
 * actual size change) and its handler updates the end thumb then the start
 * thumb, in that order — "last write wins" settles mount on START's
 * branch before any real interaction. See SYNC.md "range track-active
 * branch tracks the last focus/input source".
 */
export function trackActiveStyleRange(
  cachedWidth: number,
  sourceTranslateX: number,
  siblingTranslateX: number,
  sourceIsLeftThumb: boolean,
): TrackActiveStyle {
  const activePercentage = Math.abs(siblingTranslateX - sourceTranslateX) / cachedWidth;
  return sourceIsLeftThumb
    ? {
        left: 'auto',
        right: `${cachedWidth - siblingTranslateX}px`,
        transformOrigin: 'right',
        transform: `scaleX(${activePercentage})`,
      }
    : {
        left: `${siblingTranslateX}px`,
        right: 'auto',
        transformOrigin: 'left',
        transform: `scaleX(${activePercentage})`,
      };
}

/** `MatSlider._updateTickMarkTrackUI`'s width (not gated on `showTickMarks` here — callers check). */
export function tickMarkTrackWidth(
  min: number,
  max: number,
  step: number,
  cachedWidth: number,
): number {
  const s = step && step > 0 ? step : 1;
  const maxValue = Math.floor(max / s) * s;
  const pct = (maxValue - min) / (max - min);
  return (cachedWidth - 6) * pct;
}

/** `MatSlider._updateTickMarkUINonRange`. Returns the active/inactive mark counts. */
export function tickMarkCountsNonRange(
  value: number,
  min: number,
  max: number,
  step: number,
  isRtl: boolean,
): {numActive: number; numInactive: number} {
  const s = step > 0 ? step : 1;
  let numActive = Math.max(Math.round((value - min) / s), 0) + 1;
  let numInactive = Math.max(Math.round((max - value) / s), 0) - 1;
  if (isRtl) {
    numActive++;
  } else {
    numInactive++;
  }
  return {numActive, numInactive};
}

/** `MatSlider._updateTickMarkUIRange`. */
export function tickMarkCountsRange(
  startValue: number,
  endValue: number,
  min: number,
  max: number,
  step: number,
): {numInactiveBeforeStart: number; numActive: number; numInactiveAfterEnd: number} {
  const s = step > 0 ? step : 1;
  const numInactiveBeforeStart = Math.max(Math.round((startValue - min) / s), 0);
  const numActive = Math.max(Math.round((endValue - startValue) / s) + 1, 0);
  const numInactiveAfterEnd = Math.max(Math.round((max - endValue) / s), 0);
  return {numInactiveBeforeStart, numActive, numInactiveAfterEnd};
}

/** `MatSlider._calcTickMarkTransform`. `totalMarks` is the full tick-mark array length. */
export function tickMarkTransform(
  index: number,
  totalMarks: number,
  tickMarkTrackWidthPx: number,
  cachedWidth: number,
  isRtl: boolean,
): string {
  const offset = index * (tickMarkTrackWidthPx / (totalMarks - 1));
  const translateX = isRtl ? cachedWidth - 6 - offset : offset;
  return `translateX(${translateX}px)`;
}

/** `MatSliderThumb._fixValue`. */
export function fixValueFromClientX(
  clientX: number,
  cachedLeft: number,
  cachedWidth: number,
  min: number,
  max: number,
  step: number,
  isRtl: boolean,
): number {
  const xPos = clientX - cachedLeft;
  const s = step === 0 ? 1 : step;
  const numSteps = Math.floor((max - min) / s);
  const pct = isRtl ? 1 - xPos / cachedWidth : xPos / cachedWidth;
  const fixedPct = Math.round(pct * numSteps) / numSteps;
  const imprecise = fixedPct * (max - min) + min;
  return Math.round(imprecise / s) * s;
}

/** `MatSliderRangeThumb._updateMinMax`. */
export function rangeMinMax(
  isEndThumb: boolean,
  sliderMin: number,
  sliderMax: number,
  siblingValue: number,
): {min: number; max: number} {
  return isEndThumb
    ? {min: Math.max(sliderMin, siblingValue), max: sliderMax}
    : {min: sliderMin, max: Math.min(sliderMax, siblingValue)};
}

export interface RangeWidthInactiveStyle {
  width: string;
  padding: string;
  left: string;
  right: string;
}

/** `MatSliderRangeThumb._updateWidthInactive`. */
export function rangeWidthInactive(
  isEndThumb: boolean,
  isLeftThumb: boolean,
  value: number,
  siblingValue: number,
  ownMin: number,
  ownMax: number,
  sliderMin: number,
  sliderMax: number,
  cachedWidth: number,
): RangeWidthInactiveStyle {
  const maxWidth = cachedWidth - TICK_MARK_OFFSET * 2;
  const midValue = isEndThumb
    ? value - (value - siblingValue) / 2
    : value + (siblingValue - value) / 2;
  const rawPct = isEndThumb
    ? (ownMax - midValue) / (sliderMax - sliderMin)
    : (midValue - ownMin) / (sliderMax - sliderMin);
  const pct = sliderMin < sliderMax ? rawPct : 1;

  let ripplePadding = RIPPLE_RADIUS;
  if (pct === 1) {
    ripplePadding = 48;
  } else if (pct === 0) {
    ripplePadding = 0;
  }
  const width = maxWidth * pct + ripplePadding;

  return isLeftThumb
    ? {
        width: `${width}px`,
        padding: '0px',
        left: `-${RIPPLE_RADIUS - TICK_MARK_OFFSET}px`,
        right: 'auto',
      }
    : {
        width: `${width}px`,
        padding: '0px',
        left: 'auto',
        right: `-${RIPPLE_RADIUS - TICK_MARK_OFFSET}px`,
      };
}

/** `MatSliderRangeThumb._updateWidthActive`. */
export function rangeWidthActive(
  ownMin: number,
  ownMax: number,
  sliderMin: number,
  sliderMax: number,
  cachedWidth: number,
): {width: string; padding: string} {
  const minWidth = RIPPLE_RADIUS * 2 - INPUT_PADDING * 2;
  const maxWidth = cachedWidth + INPUT_PADDING - minWidth - TICK_MARK_OFFSET * 2;
  const pct = sliderMin < sliderMax ? (ownMax - ownMin) / (sliderMax - sliderMin) : 1;
  const width = maxWidth * pct + minWidth;
  return {width: `${width}px`, padding: `0 ${INPUT_PADDING}px`};
}

/** `MatSlider._updateValueIndicatorUI`'s `mdc-slider__thumb--short-value` condition. */
export function isShortValue(valuetext: string): boolean {
  return valuetext.length < 3;
}
