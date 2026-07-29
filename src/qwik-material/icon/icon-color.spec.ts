import {describe, it, expect} from 'vitest';
import type {MatIconColor} from './icon-color';

describe('MatIconColor', () => {
  it('accepts the three documented values', () => {
    const a: MatIconColor = 'primary';
    const b: MatIconColor = 'accent';
    const c: MatIconColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
