import {describe, it, expect} from 'vitest';
import type {MatCardAppearance} from './card-appearance';

describe('MatCardAppearance', () => {
  it('accepts the three documented literal values', () => {
    const a: MatCardAppearance = 'raised';
    const b: MatCardAppearance = 'outlined';
    const c: MatCardAppearance = 'filled';
    expect([a, b, c]).toEqual(['raised', 'outlined', 'filled']);
  });
});
