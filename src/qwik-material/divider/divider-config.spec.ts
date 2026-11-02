import {describe, it, expect} from 'vitest';
import {MAT_DIVIDER_CONFIG, type MatDividerConfig} from './divider-config';

describe('MAT_DIVIDER_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_DIVIDER_CONFIG.id).toBe('qwik-material/divider-config');
  });

  it('MatDividerConfig accepts an empty object', () => {
    const cfg: MatDividerConfig = {};
    expect(cfg).toBeDefined();
  });
});
