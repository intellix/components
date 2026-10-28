import {describe, it, expect} from 'vitest';
import {
  calcTranslateXByValue,
  clampSingle,
  fillPercentage,
  fixValueFromClientX,
  inactiveWidthStyleNonRange,
  isShortValue,
  percentage,
  rangeMinMax,
  rangeWidthInactive,
  tickMarkCountsNonRange,
  tickMarkCountsRange,
  tickMarkTrackWidth,
  tickMarkTransform,
  trackActiveStyleNonRange,
  trackActiveStyleRange,
} from './slider-math';

// Every expected number below is taken verbatim from
// specs/material-slider/angular-parity.spec.ts's header comment (notes 1, 3,
// 4, 6, 9), which documents values confirmed live against upstream Angular
// Material. Matching them here pins the pure math to that contract.

describe('percentage / calcTranslateXByValue', () => {
  it('basic: value 0 on a 0-100 slider, 300px wide -> translateX 3 (tickMarkOffset, never 0)', () => {
    const x = calcTranslateXByValue(0, 0, 100, 300, false);
    expect(x).toBe(3);
  });

  it('range: 30/70 on a 0-100, 300px slider -> translateX 91.2 / 208.8', () => {
    expect(calcTranslateXByValue(30, 0, 100, 300, false)).toBeCloseTo(91.2, 5);
    expect(calcTranslateXByValue(70, 0, 100, 300, false)).toBeCloseTo(208.8, 5);
  });
});

describe('fillPercentage', () => {
  it('note 3: a 300px slider at value 0 renders scaleX(0.01), never scaleX(0)', () => {
    const translateX = clampSingle(calcTranslateXByValue(0, 0, 100, 300, false), 300);
    expect(translateX).toBe(3);
    const fill = fillPercentage(translateX, 300, false);
    expect(fill).toBeCloseTo(0.01, 5);
  });
});

describe('trackActiveStyleNonRange', () => {
  it('LTR renders left:0px, right:auto, transform-origin left, scaleX(fill)', () => {
    expect(trackActiveStyleNonRange(0.75, false)).toEqual({
      left: '0px',
      right: 'auto',
      transformOrigin: 'left',
      transform: 'scaleX(0.75)',
    });
  });
});

describe('inactiveWidthStyleNonRange', () => {
  it('matches the documented native input style: padding 0 16px, width calc(100% + 10px), left -21px', () => {
    expect(inactiveWidthStyleNonRange()).toEqual({
      padding: '0 16px',
      width: 'calc(100% + 10px)',
      left: '-21px',
    });
  });
});

describe('tick marks (tick-marks scenario: min 0, max 100, step 20, width 300)', () => {
  it('value 40 -> 3 active + 3 inactive, marks at 0/58.8/117.6 then 176.4/235.2/294', () => {
    const width = tickMarkTrackWidth(0, 100, 20, 300);
    expect(width).toBe(294);
    const {numActive, numInactive} = tickMarkCountsNonRange(40, 0, 100, 20, false);
    expect(numActive).toBe(3);
    expect(numInactive).toBe(3);
    const total = numActive + numInactive;
    const transforms = Array.from({length: total}, (_, i) =>
      tickMarkTransform(i, total, width, 300, false),
    );
    // 176.4 has no exact binary float representation (294/5*3 = 176.39999999999998
    // in IEEE-754 double arithmetic) — this is the real value both a browser's JS
    // engine and this port compute; the parity spec's prose rounds it for readability.
    expect(transforms).toEqual([
      'translateX(0px)',
      'translateX(58.8px)',
      'translateX(117.6px)',
      'translateX(176.39999999999998px)',
      'translateX(235.2px)',
      'translateX(294px)',
    ]);
  });

  it('value 60 (after ArrowRight) -> 4 active + 2 inactive, still 6 marks total', () => {
    const {numActive, numInactive} = tickMarkCountsNonRange(60, 0, 100, 20, false);
    expect(numActive).toBe(4);
    expect(numInactive).toBe(2);
    expect(numActive + numInactive).toBe(6);
  });
});

describe('fixValueFromClientX (note 9)', () => {
  it('basic: click at 75% of a 0-100 track sets value to exactly 75', () => {
    const value = fixValueFromClientX(225 /* 75% of 300 */, 0, 300, 0, 100, 1, false);
    expect(value).toBe(75);
  });

  it('min-max-step: click at ~42% of a 10-50/step-5 track snaps to 25', () => {
    const value = fixValueFromClientX(126 /* 42% of 300 */, 0, 300, 10, 50, 5, false);
    expect(value).toBe(25);
  });
});

describe('range min/max clamping (note 6: disabled/range scenarios, start=30 end=70, slider 0-100)', () => {
  it('end thumb clamps to min=30 (sibling start value), max=100', () => {
    expect(rangeMinMax(true, 0, 100, 30)).toEqual({min: 30, max: 100});
  });

  it('start thumb clamps to min=0, max=70 (sibling end value)', () => {
    expect(rangeMinMax(false, 0, 100, 70)).toEqual({min: 0, max: 70});
  });
});

describe('rangeWidthInactive (note 6, 300px slider, start=30/end=70, min 0-100)', () => {
  it('start (left) thumb: width 171px, padding 0px, left -21px, right auto', () => {
    const style = rangeWidthInactive(false, true, 30, 70, 0, 70, 0, 100, 300);
    expect(style).toEqual({width: '171px', padding: '0px', left: '-21px', right: 'auto'});
  });

  it('end (right) thumb: width 171px, padding 0px, left auto, right -21px', () => {
    const style = rangeWidthInactive(true, false, 70, 30, 30, 100, 0, 100, 300);
    expect(style).toEqual({width: '171px', padding: '0px', left: 'auto', right: '-21px'});
  });
});

describe('trackActiveStyleRange (note 6: settles on the start/left-thumb branch in LTR)', () => {
  it('300px slider, start translateX 91.2, end translateX 208.8 -> right: cachedWidth-end, scaleX of the gap', () => {
    const style = trackActiveStyleRange(300, 91.2, 208.8, true);
    expect(style.left).toBe('auto');
    expect(style.right).toBe(`${300 - 208.8}px`);
    expect(style.transformOrigin).toBe('right');
    expect(style.transform).toBe(`scaleX(${(208.8 - 91.2) / 300})`);
  });
});

describe('tickMarkCountsRange', () => {
  it('matches the non-range formula applied across both thumbs (start=30, end=70, min 0 max 100 step 1)', () => {
    const {numInactiveBeforeStart, numActive, numInactiveAfterEnd} = tickMarkCountsRange(
      30,
      70,
      0,
      100,
      1,
    );
    expect(numInactiveBeforeStart).toBe(30);
    expect(numActive).toBe(41);
    expect(numInactiveAfterEnd).toBe(30);
  });
});

describe('percentage edge case', () => {
  it('min >= max returns 0 (LTR) or 1 (RTL) rather than NaN', () => {
    expect(percentage(5, 10, 10, false)).toBe(0);
    expect(percentage(5, 10, 10, true)).toBe(1);
  });
});

describe('isShortValue (note 8: string-length check on the formatted label)', () => {
  it('"40" (discrete) and "3k" (display-with) are both short-value', () => {
    expect(isShortValue('40')).toBe(true);
    expect(isShortValue('3k')).toBe(true);
  });

  it('a 3+ character label loses the class', () => {
    expect(isShortValue('100')).toBe(false);
  });
});
