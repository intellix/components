import {describe, it, expect} from 'vitest';
import {MatListItem} from './mat-list-item';

describe('MatListItem (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatListItem).toBeDefined();
    expect(typeof MatListItem).toBe('function');
  });
});
