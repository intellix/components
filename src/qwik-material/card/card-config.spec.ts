import {describe, it, expect} from 'vitest';
import {MAT_CARD_CONFIG, type MatCardConfig} from './card-config';

describe('MatCardConfig', () => {
  it('accepts an empty config', () => {
    const c: MatCardConfig = {};
    expect(c).toBeDefined();
  });

  it('accepts every documented field', () => {
    const c: MatCardConfig = {
      appearance: 'outlined',
    };
    expect(c.appearance).toBe('outlined');
  });

  it('MAT_CARD_CONFIG carries the expected context id', () => {
    expect(MAT_CARD_CONFIG.id).toBe('qwik-material/card-config');
  });
});
