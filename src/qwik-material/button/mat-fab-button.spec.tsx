import {describe, it, expect} from 'vitest';
import {MatFabButton} from './mat-fab-button';
describe('MatFabButton (module-import smoke)', () => {
  it('MatFabButton is a Qwik component', () => {
    expect(MatFabButton).toBeDefined();
    expect(typeof MatFabButton).toBe('function');
  });
});
