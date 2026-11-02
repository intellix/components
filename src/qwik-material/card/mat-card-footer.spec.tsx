import {describe, it, expect} from 'vitest';
import {MatCardFooter} from './mat-card-footer';

describe('MatCardFooter (module-import smoke)', () => {
  it('MatCardFooter is a Qwik component', () => {
    expect(MatCardFooter).toBeDefined();
    expect(typeof MatCardFooter).toBe('function');
  });
});
