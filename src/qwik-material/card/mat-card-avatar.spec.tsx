import {describe, it, expect} from 'vitest';
import {MatCardAvatar} from './mat-card-avatar';

describe('MatCardAvatar (module-import smoke)', () => {
  it('MatCardAvatar is a Qwik component', () => {
    expect(MatCardAvatar).toBeDefined();
    expect(typeof MatCardAvatar).toBe('function');
  });
});
