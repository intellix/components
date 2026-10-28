import {describe, expect, it} from 'vitest';
import {computeNextStepFocusIndex} from './stepper-keyboard';

describe('computeNextStepFocusIndex', () => {
  it('Home/End jump to the boundaries, no wrap', () => {
    expect(computeNextStepFocusIndex('Home', 3, 2, false)).toBe(0);
    expect(computeNextStepFocusIndex('End', 3, 0, false)).toBe(2);
  });

  it('ArrowRight/ArrowLeft wrap around, in both orientations', () => {
    expect(computeNextStepFocusIndex('ArrowRight', 3, 2, false)).toBe(0);
    expect(computeNextStepFocusIndex('ArrowLeft', 3, 0, false)).toBe(2);
    expect(computeNextStepFocusIndex('ArrowRight', 3, 2, true)).toBe(0);
    expect(computeNextStepFocusIndex('ArrowLeft', 3, 0, true)).toBe(2);
  });

  it('ArrowUp/ArrowDown only move focus when vertical', () => {
    expect(computeNextStepFocusIndex('ArrowDown', 3, 0, false)).toBeNull();
    expect(computeNextStepFocusIndex('ArrowUp', 3, 0, false)).toBeNull();
    expect(computeNextStepFocusIndex('ArrowDown', 3, 0, true)).toBe(1);
    expect(computeNextStepFocusIndex('ArrowUp', 3, 0, true)).toBe(2);
  });

  it('falls back to the first/last item when nothing is active yet', () => {
    expect(computeNextStepFocusIndex('ArrowRight', 3, -1, false)).toBe(0);
    expect(computeNextStepFocusIndex('ArrowLeft', 3, -1, false)).toBe(2);
  });

  it('returns null for an empty list', () => {
    expect(computeNextStepFocusIndex('Home', 0, -1, false)).toBeNull();
    expect(computeNextStepFocusIndex('ArrowRight', 0, -1, false)).toBeNull();
  });
});
