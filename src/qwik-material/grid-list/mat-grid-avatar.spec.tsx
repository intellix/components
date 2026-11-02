import {describe, it, expect} from 'vitest';
import {MatGridAvatar} from './mat-grid-avatar';

describe('MatGridAvatar (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatGridAvatar).toBeDefined();
    expect(typeof MatGridAvatar).toBe('function');
  });
});
