import {describe, it, expect} from 'vitest';
import {MatRadioGroup} from './mat-radio-group';

describe('MatRadioGroup (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatRadioGroup).toBeDefined();
    expect(typeof MatRadioGroup).toBe('function');
  });
});
