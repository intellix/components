import {describe, expect, it} from 'vitest';
import {createMatSnackBarConfig} from './snack-bar-config';

describe('createMatSnackBarConfig', () => {
  it('matches upstream MatSnackBarConfig class-level field defaults', () => {
    const config = createMatSnackBarConfig();
    expect(config).toEqual({
      politeness: 'polite',
      announcementMessage: '',
      duration: 0,
      data: null,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  });

  it('returns a fresh object on every call (no shared mutable default)', () => {
    const a = createMatSnackBarConfig();
    const b = createMatSnackBarConfig();
    expect(a).not.toBe(b);
    a.politeness = 'off';
    expect(b.politeness).toBe('polite');
  });
});
