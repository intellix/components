import {describe, it, expect} from 'vitest';
import {MatDivider} from './mat-divider';

describe('MatDivider (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatDivider).toBeDefined();
    expect(typeof MatDivider).toBe('function');
  });
});
