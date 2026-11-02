import {describe, it, expect} from 'vitest';
import {MatGridList} from './mat-grid-list';

describe('MatGridList (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatGridList).toBeDefined();
    expect(typeof MatGridList).toBe('function');
  });
});
