import {describe, it, expect} from 'vitest';
import {MatCardActions} from './mat-card-actions';

describe('MatCardActions (module-import smoke)', () => {
  it('MatCardActions is a Qwik component', () => {
    expect(MatCardActions).toBeDefined();
    expect(typeof MatCardActions).toBe('function');
  });
});
