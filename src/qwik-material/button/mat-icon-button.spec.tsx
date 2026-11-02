import {describe, it, expect} from 'vitest';
import {MatIconButton} from './mat-icon-button';

describe('MatIconButton (module-import smoke)', () => {
  it('MatIconButton is a Qwik component', () => {
    expect(MatIconButton).toBeDefined();
    expect(typeof MatIconButton).toBe('function');
  });
});
