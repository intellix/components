import {describe, it, expect} from 'vitest';
import {MatProgressBar} from './mat-progress-bar';

describe('MatProgressBar (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatProgressBar).toBeDefined();
    expect(typeof MatProgressBar).toBe('function');
  });
});
