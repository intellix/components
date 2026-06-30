import {describe, it, expect} from 'vitest';
import {DialogConfig} from './public-api';

describe('DialogConfig', () => {
  it('constructs empty', () => {
    const c = {};
    expect(c.role).toBeUndefined();
    expect(c.hasBackdrop).toBeUndefined();
  });
  it('all fields settable', () => {
    const c = {};
    c.data = {x: 1};
    c.role = 'alertdialog';
    c.hasBackdrop = true;
    c.disableClose = true;
    c.panelClass = ['a', 'b'];
    expect(c.role).toBe('alertdialog');
    expect(c.panelClass).toEqual(['a', 'b']);
  });
});
