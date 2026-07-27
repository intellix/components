import {describe, it, expect} from 'vitest';
import type {MatBadgeSize} from './badge-size';

describe('MatBadgeSize', () => {
  it('accepts the three documented literal values', () => {
    const a: MatBadgeSize = 'small';
    const b: MatBadgeSize = 'medium';
    const c: MatBadgeSize = 'large';
    expect([a, b, c]).toEqual(['small', 'medium', 'large']);
  });
});
