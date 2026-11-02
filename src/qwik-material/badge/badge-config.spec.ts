import {describe, it, expect} from 'vitest';
import {MAT_BADGE_CONFIG, type MatBadgeConfig} from './badge-config';

describe('MatBadgeConfig', () => {
  it('accepts an empty config', () => {
    const c: MatBadgeConfig = {};
    expect(c).toBeDefined();
  });

  it('accepts every documented field', () => {
    const c: MatBadgeConfig = {
      position: 'below before',
      size: 'large',
      color: 'accent',
      overlap: false,
    };
    expect(c.position).toBe('below before');
    expect(c.size).toBe('large');
    expect(c.color).toBe('accent');
    expect(c.overlap).toBe(false);
  });

  it('MAT_BADGE_CONFIG carries the expected context id', () => {
    expect(MAT_BADGE_CONFIG.id).toBe('qwik-material/badge-config');
  });
});
