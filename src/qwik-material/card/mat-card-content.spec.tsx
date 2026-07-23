import {describe, it, expect} from 'vitest';
import {MatCardContent} from './mat-card-content';

describe('MatCardContent (module-import smoke)', () => {
  it('MatCardContent is a Qwik component', () => {
    expect(MatCardContent).toBeDefined();
    expect(typeof MatCardContent).toBe('function');
  });
});
