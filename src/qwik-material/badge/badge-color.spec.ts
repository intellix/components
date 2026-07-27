import {describe, it, expect} from 'vitest';
import type {MatBadgeColor} from './badge-color';

describe('MatBadgeColor', () => {
  it('accepts the three documented literal values', () => {
    const a: MatBadgeColor = 'primary';
    const b: MatBadgeColor = 'accent';
    const c: MatBadgeColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
