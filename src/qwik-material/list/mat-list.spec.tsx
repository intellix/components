import {describe, it, expect} from 'vitest';
import {MatList, MatNavList, MatActionList, MatSubheader} from './mat-list';

describe('MatList container variants (smoke)', () => {
  it('MatList is exported and is a function-shaped component', () => {
    expect(MatList).toBeDefined();
    expect(typeof MatList).toBe('function');
  });

  it('MatNavList is exported and is a function-shaped component', () => {
    expect(MatNavList).toBeDefined();
    expect(typeof MatNavList).toBe('function');
  });

  it('MatActionList is exported and is a function-shaped component', () => {
    expect(MatActionList).toBeDefined();
    expect(typeof MatActionList).toBe('function');
  });

  it('MatSubheader is exported and is a function-shaped component', () => {
    expect(MatSubheader).toBeDefined();
    expect(typeof MatSubheader).toBe('function');
  });
});
