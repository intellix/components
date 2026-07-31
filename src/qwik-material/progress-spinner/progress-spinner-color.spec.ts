import {describe, it, expect} from 'vitest';
import type {MatProgressSpinnerColor} from './progress-spinner-color';

describe('MatProgressSpinnerColor', () => {
  it('accepts the three documented values', () => {
    const a: MatProgressSpinnerColor = 'primary';
    const b: MatProgressSpinnerColor = 'accent';
    const c: MatProgressSpinnerColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
