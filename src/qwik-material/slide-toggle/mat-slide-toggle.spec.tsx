import {describe, it, expect} from 'vitest';
import {MatSlideToggle} from './mat-slide-toggle';

describe('MatSlideToggle (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatSlideToggle).toBeDefined();
    expect(typeof MatSlideToggle).toBe('function');
  });
});
