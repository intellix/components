import {describe, it, expect} from 'vitest';
import {MAT_LIST_CONFIG, type MatListConfig} from './list-config';

describe('MAT_LIST_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_LIST_CONFIG.id).toBe('qwik-material/list-config');
  });

  it('MatListConfig accepts an empty object', () => {
    const cfg: MatListConfig = {};
    expect(cfg).toBeDefined();
  });
});
