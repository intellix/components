import {describe, it, expect} from 'vitest';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';

describe('MatButtonConfig', () => {
  it('accepts an empty config', () => {
    const c: MatButtonConfig = {};
    expect(c).toBeDefined();
  });

  it('accepts every documented field', () => {
    const c: MatButtonConfig = {
      color: 'primary',
      disabledInteractive: true,
      defaultAppearance: 'filled',
    };
    expect(c.color).toBe('primary');
    expect(c.disabledInteractive).toBe(true);
    expect(c.defaultAppearance).toBe('filled');
  });

  it('accepts null for color to explicitly opt-out of a palette', () => {
    const c: MatButtonConfig = {color: null};
    expect(c.color).toBeNull();
  });

  it('MAT_BUTTON_CONFIG carries the expected context id', () => {
    expect(MAT_BUTTON_CONFIG.id).toBe('qwik-material/button-config');
  });
});
