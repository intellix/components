import {describe, it, expect} from 'vitest';
import type {MatProgressBarMode} from './progress-bar-mode';

describe('MatProgressBarMode', () => {
  it('accepts the four documented values', () => {
    const a: MatProgressBarMode = 'determinate';
    const b: MatProgressBarMode = 'indeterminate';
    const c: MatProgressBarMode = 'buffer';
    const d: MatProgressBarMode = 'query';
    expect([a, b, c, d]).toEqual(['determinate', 'indeterminate', 'buffer', 'query']);
  });
});
