import {describe, expect, it} from 'vitest';
import {
  computeNextHeaderIndex,
  findBoundaryEnabledIndex,
  findNextEnabledIndexWrapping,
} from './accordion-keyboard';

const noneDisabled = () => false;

describe('findBoundaryEnabledIndex (Home/End)', () => {
  it('returns the starting index when it is enabled', () => {
    expect(findBoundaryEnabledIndex(3, 0, 1, noneDisabled)).toBe(0);
    expect(findBoundaryEnabledIndex(3, 2, -1, noneDisabled)).toBe(2);
  });

  it('skips disabled items in the fallback direction', () => {
    const isDisabled = (i: number) => i === 0;
    expect(findBoundaryEnabledIndex(3, 0, 1, isDisabled)).toBe(1);
  });

  it('returns null when it runs off the end without finding an enabled item', () => {
    expect(findBoundaryEnabledIndex(3, 0, 1, () => true)).toBeNull();
  });

  it('returns null for an empty range', () => {
    expect(findBoundaryEnabledIndex(0, 0, 1, noneDisabled)).toBeNull();
  });
});

describe('findNextEnabledIndexWrapping (ArrowDown/ArrowUp with an active item)', () => {
  it('moves to the next index', () => {
    expect(findNextEnabledIndexWrapping(3, 0, 1, noneDisabled)).toBe(1);
  });

  it('moves to the previous index', () => {
    expect(findNextEnabledIndexWrapping(3, 1, -1, noneDisabled)).toBe(0);
  });

  it('wraps from the last index to the first on ArrowDown (withWrap())', () => {
    expect(findNextEnabledIndexWrapping(3, 2, 1, noneDisabled)).toBe(0);
  });

  it('wraps from the first index to the last on ArrowUp (withWrap())', () => {
    expect(findNextEnabledIndexWrapping(3, 0, -1, noneDisabled)).toBe(2);
  });

  it('skips disabled items while wrapping', () => {
    const isDisabled = (i: number) => i === 0;
    expect(findNextEnabledIndexWrapping(3, 2, 1, isDisabled)).toBe(1);
  });

  it('returns null when every item is disabled', () => {
    expect(findNextEnabledIndexWrapping(3, 0, 1, () => true)).toBeNull();
  });
});

describe('computeNextHeaderIndex', () => {
  it('Home jumps to the first header; End jumps to the last', () => {
    expect(computeNextHeaderIndex('Home', 3, 2, noneDisabled)).toBe(0);
    expect(computeNextHeaderIndex('End', 3, 0, noneDisabled)).toBe(2);
  });

  it('Home while already first / End while already last is a no-op (upstream: not withWrap-dependent)', () => {
    expect(computeNextHeaderIndex('Home', 3, 0, noneDisabled)).toBe(0);
    expect(computeNextHeaderIndex('End', 3, 2, noneDisabled)).toBe(2);
  });

  it('ArrowDown/ArrowUp move by one and wrap at the ends (accordion-multi scenario shape)', () => {
    expect(computeNextHeaderIndex('ArrowDown', 3, 0, noneDisabled)).toBe(1);
    expect(computeNextHeaderIndex('ArrowDown', 3, 1, noneDisabled)).toBe(2);
    expect(computeNextHeaderIndex('ArrowDown', 3, 2, noneDisabled)).toBe(0);
    expect(computeNextHeaderIndex('ArrowUp', 3, 0, noneDisabled)).toBe(2);
  });

  it('ArrowDown with no active header (-1) jumps to the first, like Home; ArrowUp jumps to the last, like End', () => {
    expect(computeNextHeaderIndex('ArrowDown', 3, -1, noneDisabled)).toBe(0);
    expect(computeNextHeaderIndex('ArrowUp', 3, -1, noneDisabled)).toBe(2);
  });
});
