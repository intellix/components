import {describe, expect, it} from 'vitest';
import {
  clampScrollDistance,
  getMaxScrollDistance,
  isPaginationEnabled,
  scrollAmount,
  translateXForScrollDistance,
} from './pagination-math';

describe('isPaginationEnabled', () => {
  it('is false when content fits (difference under the 5px threshold)', () => {
    expect(isPaginationEnabled(300, 300)).toBe(false);
    expect(isPaginationEnabled(304, 300)).toBe(false);
  });

  it('is true once the difference reaches 5px', () => {
    expect(isPaginationEnabled(305, 300)).toBe(true);
    expect(isPaginationEnabled(1000, 300)).toBe(true);
  });
});

describe('getMaxScrollDistance', () => {
  it('returns the overflow amount', () => {
    expect(getMaxScrollDistance(1000, 300)).toBe(700);
  });

  it('replaces an exact zero result with 0 (trivially true already)', () => {
    expect(getMaxScrollDistance(300, 300)).toBe(0);
  });

  it('does NOT clamp a negative difference — mirrors upstream verbatim', () => {
    expect(getMaxScrollDistance(300, 400)).toBe(-100);
  });
});

describe('clampScrollDistance', () => {
  it('clamps to [0, max]', () => {
    expect(clampScrollDistance(-50, 700)).toBe(0);
    expect(clampScrollDistance(800, 700)).toBe(700);
    expect(clampScrollDistance(350, 700)).toBe(350);
  });
});

describe('scrollAmount', () => {
  it('is a negative third of the viewport for "before"', () => {
    expect(scrollAmount('before', 300)).toBe(-100);
  });

  it('is a positive third of the viewport for "after"', () => {
    expect(scrollAmount('after', 300)).toBe(100);
  });
});

describe('translateXForScrollDistance', () => {
  it('negates and rounds (LTR)', () => {
    expect(translateXForScrollDistance(0)).toBe(0);
    expect(translateXForScrollDistance(100)).toBe(-100);
    expect(translateXForScrollDistance(99.6)).toBe(-100);
  });
});
