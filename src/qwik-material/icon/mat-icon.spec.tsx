import {describe, it, expect} from 'vitest';
import {MatIcon} from './mat-icon';

describe('MatIcon (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatIcon).toBeDefined();
    expect(typeof MatIcon).toBe('function');
  });
});
