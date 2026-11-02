import {describe, it, expect} from 'vitest';
import {MatToolbar} from './mat-toolbar';

describe('MatToolbar (module-import smoke)', () => {
  it('MatToolbar is a Qwik component', () => {
    expect(MatToolbar).toBeDefined();
    expect(typeof MatToolbar).toBe('function');
  });
});
