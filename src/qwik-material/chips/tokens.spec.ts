import {describe, it, expect} from 'vitest';
import {MAT_CHIPS_CONFIG, MAT_CHIPS_CONFIG_DEFAULTS, type MatChipsConfig} from './tokens';

describe('MAT_CHIPS_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_CHIPS_CONFIG.id).toBe('qwik-material/chips-config');
  });

  it('MAT_CHIPS_CONFIG_DEFAULTS mirrors upstream MAT_CHIPS_DEFAULT_OPTIONS', () => {
    expect(MAT_CHIPS_CONFIG_DEFAULTS.separatorKeys).toEqual(['Enter']);
    expect(MAT_CHIPS_CONFIG_DEFAULTS.hideSingleSelectionIndicator).toBe(false);
    expect(MAT_CHIPS_CONFIG_DEFAULTS.inputDisabledInteractive).toBe(false);
  });

  it('MatChipsConfig accepts an empty object (every field optional)', () => {
    const cfg: MatChipsConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatChipsConfig accepts a SeparatorKey object alongside plain key strings', () => {
    const cfg: MatChipsConfig = {
      separatorKeys: ['Enter', {key: ',', modifiers: ['shift']}],
    };
    expect(cfg.separatorKeys).toHaveLength(2);
  });
});
