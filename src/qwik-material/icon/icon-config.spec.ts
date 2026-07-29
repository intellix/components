import {describe, it, expect} from 'vitest';
import {MAT_ICON_CONFIG, type MatIconConfig} from './icon-config';

describe('MAT_ICON_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_ICON_CONFIG.id).toBe('qwik-material/icon-config');
  });

  it('MatIconConfig accepts an empty object', () => {
    const cfg: MatIconConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatIconConfig accepts every documented field', () => {
    const cfg: MatIconConfig = {
      color: 'accent',
      fontSet: 'material-symbols-outlined',
    };
    expect(cfg.color).toBe('accent');
    expect(cfg.fontSet).toBe('material-symbols-outlined');
  });
});
