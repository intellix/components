import {describe, it, expect} from 'vitest';
import {MatCardTitle} from './mat-card-title';

describe('MatCardTitle (module-import smoke)', () => {
  it('MatCardTitle is a Qwik component', () => {
    expect(MatCardTitle).toBeDefined();
    expect(typeof MatCardTitle).toBe('function');
  });
});
