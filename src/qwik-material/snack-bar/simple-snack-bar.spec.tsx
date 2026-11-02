import {describe, it, expect} from 'vitest';
import {SimpleSnackBar} from './simple-snack-bar';

describe('SimpleSnackBar', () => {
  it('is a callable component$', () => {
    expect(typeof SimpleSnackBar).toBe('function');
  });
});
