import {describe, it, expect} from 'vitest';
import {MatRadioButton} from './mat-radio-button';

describe('MatRadioButton (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatRadioButton).toBeDefined();
    expect(typeof MatRadioButton).toBe('function');
  });
});
