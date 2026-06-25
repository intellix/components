import {describe, it, expect} from 'vitest';
import {OverlayConfig} from './public-api';

describe('OverlayConfig', () => {
  it('constructs with defaults', () => {
    const c = new OverlayConfig();
    expect(c.hasBackdrop).toBeUndefined();
    expect(c.panelClass).toBeUndefined();
  });
  it('accepts a partial', () => {
    const c = new OverlayConfig({hasBackdrop: true, panelClass: 'x'});
    expect(c.hasBackdrop).toBe(true);
    expect(c.panelClass).toBe('x');
  });
});
