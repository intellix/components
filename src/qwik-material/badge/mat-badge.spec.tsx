import {describe, it, expect} from 'vitest';
import {MatBadge} from './mat-badge';

describe('MatBadge (module-import smoke)', () => {
  it('MatBadge is a Qwik component', () => {
    expect(MatBadge).toBeDefined();
    expect(typeof MatBadge).toBe('function');
  });
});
