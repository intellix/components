import {describe, expect, it} from 'vitest';
import {computeNextTabFocusIndex, shouldActivateOnKey} from './tab-group-keyboard';

describe('computeNextTabFocusIndex', () => {
  it('Home always jumps to 0', () => {
    expect(computeNextTabFocusIndex('Home', 5, 3)).toBe(0);
    expect(computeNextTabFocusIndex('Home', 5, 0)).toBe(0);
  });

  it('End always jumps to the last index', () => {
    expect(computeNextTabFocusIndex('End', 5, 0)).toBe(4);
    expect(computeNextTabFocusIndex('End', 5, 4)).toBe(4);
  });

  it('ArrowRight steps forward and wraps past the end', () => {
    expect(computeNextTabFocusIndex('ArrowRight', 3, 0)).toBe(1);
    expect(computeNextTabFocusIndex('ArrowRight', 3, 2)).toBe(0);
  });

  it('ArrowLeft steps backward and wraps past the start', () => {
    expect(computeNextTabFocusIndex('ArrowLeft', 3, 1)).toBe(0);
    expect(computeNextTabFocusIndex('ArrowLeft', 3, 0)).toBe(2);
  });

  it('falls back to the first/last item when nothing is focused yet', () => {
    expect(computeNextTabFocusIndex('ArrowRight', 3, -1)).toBe(0);
    expect(computeNextTabFocusIndex('ArrowLeft', 3, -1)).toBe(2);
  });

  it('returns null for an empty list', () => {
    expect(computeNextTabFocusIndex('Home', 0, -1)).toBeNull();
    expect(computeNextTabFocusIndex('ArrowRight', 0, -1)).toBeNull();
  });
});

describe('shouldActivateOnKey', () => {
  it('activates a focused, enabled, non-selected tab', () => {
    expect(shouldActivateOnKey(1, 0, false)).toBe(true);
  });

  it('does not activate the already-selected tab', () => {
    expect(shouldActivateOnKey(0, 0, false)).toBe(false);
  });

  it('does not activate a disabled tab', () => {
    expect(shouldActivateOnKey(1, 0, true)).toBe(false);
  });

  it('does not activate when nothing has been focused yet', () => {
    expect(shouldActivateOnKey(null, 0, false)).toBe(false);
  });
});
