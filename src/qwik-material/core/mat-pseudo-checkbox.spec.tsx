import {describe, it, expect} from 'vitest';
import {MatPseudoCheckbox} from './public-api';

describe('MatPseudoCheckbox (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatPseudoCheckbox).toBeDefined();
    expect(typeof MatPseudoCheckbox).toBe('function');
  });
});
