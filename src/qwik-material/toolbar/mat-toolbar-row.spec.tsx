import {describe, it, expect} from 'vitest';
import {MatToolbarRow} from './mat-toolbar-row';

describe('MatToolbarRow (module-import smoke)', () => {
  it('MatToolbarRow is a Qwik component', () => {
    expect(MatToolbarRow).toBeDefined();
    expect(typeof MatToolbarRow).toBe('function');
  });
});
