import {describe, it, expect} from 'vitest';
import {
  MAT_DIALOG_DATA,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
  MAT_DIALOG_REF,
  MAT_DIALOG_CONTAINER,
  MAT_ANIMATIONS_DISABLED,
} from './mat-dialog-tokens';

describe('mat-dialog-tokens', () => {
  it('all six context IDs are distinct objects', () => {
    const ids = [
      MAT_DIALOG_DATA,
      MAT_DIALOG_DEFAULT_OPTIONS,
      MAT_DIALOG_SCROLL_STRATEGY,
      MAT_DIALOG_REF,
      MAT_DIALOG_CONTAINER,
      MAT_ANIMATIONS_DISABLED,
    ];
    expect(new Set(ids).size).toBe(6);
  });

  it('context IDs carry the qwik-material/ namespace prefix', () => {
    // ContextId exposes `.id` as its string identifier under Qwik's runtime.
    // (The property name is stable in the current Qwik release we depend on.)
    const asAny = (x: unknown) => x as {id: string};
    expect(asAny(MAT_DIALOG_DATA).id).toBe('qwik-material/dialog-data');
    expect(asAny(MAT_DIALOG_DEFAULT_OPTIONS).id).toBe('qwik-material/dialog-default-options');
    expect(asAny(MAT_DIALOG_SCROLL_STRATEGY).id).toBe('qwik-material/dialog-scroll-strategy');
    expect(asAny(MAT_DIALOG_REF).id).toBe('qwik-material/dialog-ref');
    expect(asAny(MAT_DIALOG_CONTAINER).id).toBe('qwik-material/dialog-container-api');
    expect(asAny(MAT_ANIMATIONS_DISABLED).id).toBe('qwik-material/animations-disabled');
  });
});
