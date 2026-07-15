import {describe, it, expect} from 'vitest';
import {MatButton} from './mat-button';

describe('MatButton (module-import smoke)', () => {
  it('MatButton is a Qwik component', () => {
    expect(MatButton).toBeDefined();
    expect(typeof MatButton).toBe('function');
  });
});
