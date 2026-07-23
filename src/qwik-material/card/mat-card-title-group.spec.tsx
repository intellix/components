import {describe, it, expect} from 'vitest';
import {MatCardTitleGroup} from './mat-card-title-group';

describe('MatCardTitleGroup (module-import smoke)', () => {
  it('MatCardTitleGroup is a Qwik component', () => {
    expect(MatCardTitleGroup).toBeDefined();
    expect(typeof MatCardTitleGroup).toBe('function');
  });
});
