import {describe, it, expect} from 'vitest';
import {PersistentRipple} from './persistent-ripple';
import {FocusIndicator} from './focus-indicator';
import {TouchTarget} from './touch-target';

describe('button internal helpers (module-import smoke)', () => {
  it('PersistentRipple, FocusIndicator, TouchTarget are all defined', () => {
    expect(PersistentRipple).toBeDefined();
    expect(FocusIndicator).toBeDefined();
    expect(TouchTarget).toBeDefined();
  });
});
