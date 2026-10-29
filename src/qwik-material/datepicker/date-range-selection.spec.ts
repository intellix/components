import {describe, expect, it} from 'vitest';
import {createNativeDateAdapter} from '../core/datetime/native-date-adapter';
import {
  isRangeComplete,
  rangeCreatePreview,
  rangeModelAdd,
  rangeSelectionFinished,
  type DateRange,
} from './date-range-selection';

const adapter = createNativeDateAdapter('en-US');
const d = (y: number, m: number, day: number) => new Date(y, m, day);
const empty: DateRange<Date> = {start: null, end: null};

describe('rangeSelectionFinished — range-basic scenario (click 10, then 20)', () => {
  it('first click sets start only', () => {
    const r1 = rangeSelectionFinished(adapter, d(2024, 0, 10), empty);
    expect(r1.start).toEqual(d(2024, 0, 10));
    expect(r1.end).toBeNull();
    expect(isRangeComplete(r1)).toBe(false);
  });

  it('second (later) click completes the range', () => {
    const r1 = rangeSelectionFinished(adapter, d(2024, 0, 10), empty);
    const r2 = rangeSelectionFinished(adapter, d(2024, 0, 20), r1);
    expect(r2).toEqual({start: d(2024, 0, 10), end: d(2024, 0, 20)});
    expect(isRangeComplete(r2)).toBe(true);
  });

  it('clicking an EARLIER date than the pending start restarts the range (no auto-swap)', () => {
    const r1 = rangeSelectionFinished(adapter, d(2024, 0, 20), empty);
    const r2 = rangeSelectionFinished(adapter, d(2024, 0, 10), r1);
    expect(r2).toEqual({start: d(2024, 0, 10), end: null});
  });

  it('clicking again after a complete range starts a brand new range', () => {
    const complete = {start: d(2024, 0, 10), end: d(2024, 0, 20)};
    const restarted = rangeSelectionFinished(adapter, d(2024, 0, 5), complete);
    expect(restarted).toEqual({start: d(2024, 0, 5), end: null});
  });

  it('clicking the same date as the pending start completes a one-day range', () => {
    const r1 = rangeSelectionFinished(adapter, d(2024, 0, 10), empty);
    const r2 = rangeSelectionFinished(adapter, d(2024, 0, 10), r1);
    expect(r2).toEqual({start: d(2024, 0, 10), end: d(2024, 0, 10)});
  });
});

describe('rangeCreatePreview — hover preview classes', () => {
  it('pending start + hovered later date -> preview range', () => {
    const pending = {start: d(2024, 0, 10), end: null};
    expect(rangeCreatePreview(d(2024, 0, 20), pending)).toEqual({
      start: d(2024, 0, 10),
      end: d(2024, 0, 20),
    });
  });

  it('no pending start -> no preview', () => {
    expect(rangeCreatePreview(d(2024, 0, 20), empty)).toEqual({start: null, end: null});
  });

  it('range already complete -> no preview', () => {
    const complete = {start: d(2024, 0, 10), end: d(2024, 0, 20)};
    expect(rangeCreatePreview(d(2024, 0, 15), complete)).toEqual({start: null, end: null});
  });

  it('hovering BEFORE the pending start produces an inverted (non-rendering) range, not a swap', () => {
    const pending = {start: d(2024, 0, 10), end: null};
    const preview = rangeCreatePreview(d(2024, 0, 5), pending);
    expect(preview.start).toEqual(d(2024, 0, 10));
    expect(preview.end).toEqual(d(2024, 0, 5));
  });
});

describe('rangeModelAdd — model-level fill order', () => {
  it('fills start, then end, then restarts', () => {
    let r = rangeModelAdd(empty, d(2024, 0, 10));
    expect(r).toEqual({start: d(2024, 0, 10), end: null});
    r = rangeModelAdd(r, d(2024, 0, 20));
    expect(r).toEqual({start: d(2024, 0, 10), end: d(2024, 0, 20)});
    r = rangeModelAdd(r, d(2024, 0, 1));
    expect(r).toEqual({start: d(2024, 0, 1), end: null});
  });
});
