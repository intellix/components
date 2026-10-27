import {describe, it, expect} from 'vitest';
import {MatLine, lineCountClass} from './mat-line';

describe('MatLine (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatLine).toBeDefined();
    expect(typeof MatLine).toBe('function');
  });
});

describe('lineCountClass', () => {
  it('returns undefined for 0 or 1 lines', () => {
    expect(lineCountClass(0)).toBeUndefined();
    expect(lineCountClass(1)).toBeUndefined();
  });

  it('returns mat-2-line / mat-3-line for 2/3 lines', () => {
    expect(lineCountClass(2)).toBe('mat-2-line');
    expect(lineCountClass(3)).toBe('mat-3-line');
  });

  it('returns mat-multi-line for more than 3 lines', () => {
    expect(lineCountClass(4)).toBe('mat-multi-line');
    expect(lineCountClass(10)).toBe('mat-multi-line');
  });

  it('honors a custom prefix', () => {
    expect(lineCountClass(2, 'mdc')).toBe('mdc-2-line');
  });
});
