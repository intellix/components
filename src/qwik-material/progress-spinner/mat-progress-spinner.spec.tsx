import {describe, it, expect} from 'vitest';
import {MatProgressSpinner, MatSpinner} from './mat-progress-spinner';

describe('MatProgressSpinner / MatSpinner (smoke)', () => {
  it('MatProgressSpinner is exported and is a function-shaped component', () => {
    expect(MatProgressSpinner).toBeDefined();
    expect(typeof MatProgressSpinner).toBe('function');
  });

  it('MatSpinner is exported and is a function-shaped component', () => {
    expect(MatSpinner).toBeDefined();
    expect(typeof MatSpinner).toBe('function');
  });
});
