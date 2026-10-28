import {describe, expect, it} from 'vitest';
import {MAT_EXPANSION_CONFIG, type MatExpansionConfig} from './expansion-config';

describe('MAT_EXPANSION_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_EXPANSION_CONFIG.id).toBe('qwik-material/expansion-config');
  });

  it('MatExpansionConfig accepts an empty object and a fully-populated one', () => {
    const empty: MatExpansionConfig = {};
    expect(empty).toBeDefined();
    const full: MatExpansionConfig = {
      expandedHeight: '64px',
      collapsedHeight: '32px',
      hideToggle: true,
    };
    expect(full.expandedHeight).toBe('64px');
  });
});
