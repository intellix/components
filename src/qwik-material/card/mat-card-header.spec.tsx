import {describe, it, expect} from 'vitest';
import {MatCardHeader} from './mat-card-header';

describe('MatCardHeader (module-import smoke)', () => {
  it('MatCardHeader is a Qwik component', () => {
    expect(MatCardHeader).toBeDefined();
    expect(typeof MatCardHeader).toBe('function');
  });
});
