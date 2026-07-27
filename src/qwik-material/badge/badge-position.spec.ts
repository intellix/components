import {describe, it, expect} from 'vitest';
import type {MatBadgePosition} from './badge-position';

describe('MatBadgePosition', () => {
  it('accepts all 8 documented combinations', () => {
    const values: MatBadgePosition[] = [
      'above after',
      'above before',
      'below before',
      'below after',
      'before',
      'after',
      'above',
      'below',
    ];
    expect(values).toHaveLength(8);
  });
});
