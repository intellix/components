import {describe, it, expect} from 'vitest';
import {OverlayConfig} from './public-api';

describe('OverlayConfig', () => {
  it('constructs with defaults', () => {
    const c = {};
    expect(c.hasBackdrop).toBeUndefined();
    expect(c.panelClass).toBeUndefined();
  });
  it('accepts a partial', () => {
    const c = {hasBackdrop: true, panelClass: 'x'};
    expect(c.hasBackdrop).toBe(true);
    expect(c.panelClass).toBe('x');
  });
});
