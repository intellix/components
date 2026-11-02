import {describe, it, expect} from 'vitest';
import {MatCheckbox} from './mat-checkbox';

describe('MatCheckbox (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatCheckbox).toBeDefined();
    expect(typeof MatCheckbox).toBe('function');
  });
});
