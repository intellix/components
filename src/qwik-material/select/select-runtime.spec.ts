import {describe, it, expect} from 'vitest';
import {getOptionScrollPosition} from './select-runtime';

describe('getOptionScrollPosition', () => {
  it('scrolls up when the option is above the current viewport', () => {
    expect(getOptionScrollPosition(10, 20, 50, 100)).toBe(10);
  });

  it('scrolls down when the option is below the current viewport', () => {
    // option at 150-170, viewport is [0, 100) -> needs to scroll so the
    // option's bottom (170) is at the viewport's bottom.
    expect(getOptionScrollPosition(150, 20, 0, 100)).toBe(70);
  });

  it('leaves the scroll position unchanged when already visible', () => {
    expect(getOptionScrollPosition(60, 20, 50, 100)).toBe(50);
  });

  it('clamps to 0 when the computed position would go negative', () => {
    // Mirrors upstream's defensive Math.max(0, ...) — realistic
    // (non-negative) scroll positions never actually reach this branch;
    // exercised directly with a contrived currentScrollPosition.
    expect(getOptionScrollPosition(0, 10, -2000, 1000)).toBe(0);
  });
});
