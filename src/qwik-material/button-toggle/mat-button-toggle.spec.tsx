import {describe, it, expect} from 'vitest';
import {MatButtonToggle} from './mat-button-toggle';

describe('MatButtonToggle (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatButtonToggle).toBeDefined();
    expect(typeof MatButtonToggle).toBe('function');
  });
});
