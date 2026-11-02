import {describe, it, expect} from 'vitest';
import type {MatToolbarColor} from './toolbar-color';

describe('MatToolbarColor', () => {
  it('accepts the three documented literal values', () => {
    const a: MatToolbarColor = 'primary';
    const b: MatToolbarColor = 'accent';
    const c: MatToolbarColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
