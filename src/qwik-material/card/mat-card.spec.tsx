import {describe, it, expect} from 'vitest';
import {MatCard} from './mat-card';

describe('MatCard (module-import smoke)', () => {
  it('MatCard is a Qwik component', () => {
    expect(MatCard).toBeDefined();
    expect(typeof MatCard).toBe('function');
  });
});
