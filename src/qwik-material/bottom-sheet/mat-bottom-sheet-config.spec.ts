import {describe, it, expect} from 'vitest';
import type {MatBottomSheetConfig, AutoFocusTarget} from './mat-bottom-sheet-config';

describe('MatBottomSheetConfig', () => {
  it('accepts an empty config', () => {
    const c: MatBottomSheetConfig = {};
    expect(c).toBeDefined();
  });

  it('accepts every documented field', () => {
    const c: MatBottomSheetConfig<{message: string}> = {
      panelClass: ['klass-a', 'klass-b'],
      direction: 'rtl',
      data: {message: 'hi'},
      hasBackdrop: true,
      backdropClass: 'my-backdrop',
      disableClose: false,
      ariaLabel: 'Settings sheet',
      ariaModal: true,
      closeOnNavigation: true,
      autoFocus: 'first-heading',
      restoreFocus: true,
      height: '300px',
      minHeight: 200,
      maxHeight: '80vh',
    };
    expect(c.data?.message).toBe('hi');
  });

  it('has no `id` field — matches upstream MatBottomSheetConfig, which never exposes one', () => {
    // @ts-expect-error - id is intentionally not part of this config's type.
    const c: MatBottomSheetConfig = {id: 'nope'};
    expect(c).toBeDefined();
  });

  it('AutoFocusTarget covers the documented literal values plus arbitrary selector strings', () => {
    const a: AutoFocusTarget = 'first-tabbable';
    const b: AutoFocusTarget = 'first-heading';
    const c: AutoFocusTarget = 'dialog';
    const d: AutoFocusTarget = 'button.primary'; // arbitrary CSS selector
    expect([a, b, c, d]).toHaveLength(4);
  });

  it('ariaModal defaults are the caller’s responsibility — the type itself just allows true|false|undefined', () => {
    const a: MatBottomSheetConfig = {ariaModal: false};
    const b: MatBottomSheetConfig = {ariaModal: true};
    const c: MatBottomSheetConfig = {};
    expect([a.ariaModal, b.ariaModal, c.ariaModal]).toEqual([false, true, undefined]);
  });
});
