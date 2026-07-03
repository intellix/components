import {describe, it, expect} from 'vitest';
import type {
  MatDialogConfig,
  AutoFocusTarget,
  DialogRole,
  DialogPosition,
} from './mat-dialog-config';

describe('MatDialogConfig', () => {
  it('accepts an empty config', () => {
    const c: MatDialogConfig = {};
    expect(c).toBeDefined();
  });

  it('accepts every documented field', () => {
    const c: MatDialogConfig<{message: string}> = {
      id: 'my-dialog',
      role: 'alertdialog',
      panelClass: ['klass-a', 'klass-b'],
      hasBackdrop: true,
      backdropClass: 'my-backdrop',
      disableClose: false,
      width: '400px',
      height: '300px',
      minWidth: 200,
      minHeight: '10rem',
      maxWidth: '80vw',
      maxHeight: 500,
      direction: 'ltr',
      ariaDescribedBy: 'desc',
      ariaLabelledBy: 'title',
      ariaLabel: null,
      ariaModal: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      closeOnNavigation: true,
      data: {message: 'hi'},
      enterAnimationDuration: 150,
      exitAnimationDuration: '75ms',
      position: {top: '10px', right: '20px'},
    };
    expect(c.data?.message).toBe('hi');
  });

  it('AutoFocusTarget covers the documented literal values plus arbitrary selector strings', () => {
    const a: AutoFocusTarget = 'first-tabbable';
    const b: AutoFocusTarget = 'first-heading';
    const c: AutoFocusTarget = 'dialog';
    const d: AutoFocusTarget = 'button.primary'; // arbitrary CSS selector
    expect([a, b, c, d]).toHaveLength(4);
  });

  it('DialogRole is exactly dialog|alertdialog', () => {
    const a: DialogRole = 'dialog';
    const b: DialogRole = 'alertdialog';
    expect([a, b]).toEqual(['dialog', 'alertdialog']);
  });

  it('DialogPosition accepts partial coord overrides', () => {
    const p: DialogPosition = {top: '10px'};
    expect(p.top).toBe('10px');
  });
});
