import {describe, it, expect} from 'vitest';
import type {MatProgressSpinnerMode} from './progress-spinner-mode';

describe('MatProgressSpinnerMode', () => {
  it('accepts the two documented values', () => {
    const a: MatProgressSpinnerMode = 'determinate';
    const b: MatProgressSpinnerMode = 'indeterminate';
    expect([a, b]).toEqual(['determinate', 'indeterminate']);
  });
});
