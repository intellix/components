import {describe, it, expect} from 'vitest';
import {MatCardSubtitle} from './mat-card-subtitle';

describe('MatCardSubtitle (module-import smoke)', () => {
  it('MatCardSubtitle is a Qwik component', () => {
    expect(MatCardSubtitle).toBeDefined();
    expect(typeof MatCardSubtitle).toBe('function');
  });
});
