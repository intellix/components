import {describe, it, expect} from 'vitest';
import {MatButtonToggleGroup} from './mat-button-toggle-group';

describe('MatButtonToggleGroup (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatButtonToggleGroup).toBeDefined();
    expect(typeof MatButtonToggleGroup).toBe('function');
  });
});
