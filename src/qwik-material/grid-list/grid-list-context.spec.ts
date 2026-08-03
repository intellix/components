import {describe, it, expect} from 'vitest';
import {MAT_GRID_LIST_CONFIG, type MatGridListConfig} from './grid-list-config';
import {
  MAT_GRID_LIST_INSTANCE,
  MAT_GRID_LIST_INSTANCE_DEFAULTS,
  type MatGridListInstance,
  type MatGridListMode,
} from './grid-list-context';

describe('MAT_GRID_LIST_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_GRID_LIST_CONFIG.id).toBe('qwik-material/grid-list-config');
  });

  it('MatGridListConfig accepts an empty object', () => {
    const cfg: MatGridListConfig = {};
    expect(cfg).toBeDefined();
  });
});

describe('MAT_GRID_LIST_INSTANCE', () => {
  it('has the expected context id string', () => {
    expect(MAT_GRID_LIST_INSTANCE.id).toBe('qwik-material/grid-list-instance');
  });

  it('MAT_GRID_LIST_INSTANCE_DEFAULTS has all 5 fields with sensible values', () => {
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.rowHeight).toBe('1:1');
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.cols).toBe(1);
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.mode).toBe('ratio');
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.ratioW).toBe(1);
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.ratioH).toBe(1);
  });

  it('MatGridListInstance accepts a well-formed object', () => {
    const inst: MatGridListInstance = {
      rowHeight: '4:3',
      cols: 3,
      mode: 'ratio' satisfies MatGridListMode,
      ratioW: 4,
      ratioH: 3,
    };
    expect(inst.mode).toBe('ratio');
  });
});
