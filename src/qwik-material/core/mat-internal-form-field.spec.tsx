import {describe, it, expect} from 'vitest';
import {MatInternalFormField} from './public-api';

// DOM output is covered by the checkbox / radio / slide-toggle parity specs
// (qwik-cdk-parity-tests), which render it inside each control.
describe('MatInternalFormField (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(typeof MatInternalFormField).toBe('function');
  });
});
