import {describe, it, expect} from 'vitest';
import type {MatProgressBarColor} from './progress-bar-color';

describe('MatProgressBarColor', () => {
  it('accepts the three documented values', () => {
    const a: MatProgressBarColor = 'primary';
    const b: MatProgressBarColor = 'accent';
    const c: MatProgressBarColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
