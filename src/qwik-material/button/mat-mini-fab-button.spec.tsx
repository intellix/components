import {describe, it, expect} from 'vitest';
import {MatMiniFabButton} from './mat-mini-fab-button';

describe('MatMiniFabButton (module-import smoke)', () => {
  it('MatMiniFabButton is a Qwik component', () => {
    expect(MatMiniFabButton).toBeDefined();
    expect(typeof MatMiniFabButton).toBe('function');
  });
});
