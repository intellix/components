import {describe, it, expect} from 'vitest';
import {MAT_BUTTON_TOGGLE_CONFIG, type MatButtonToggleConfig} from './button-toggle-config';
import {
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
  type MatButtonToggleGroupState,
  type MatButtonToggleGroupMode,
} from './button-toggle-group-state';

describe('MAT_BUTTON_TOGGLE_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_BUTTON_TOGGLE_CONFIG.id).toBe('qwik-material/button-toggle-config');
  });

  it('MatButtonToggleConfig accepts an empty object', () => {
    const cfg: MatButtonToggleConfig = {};
    expect(cfg).toBeDefined();
  });
});

describe('MAT_BUTTON_TOGGLE_GROUP_STATE', () => {
  it('has the expected context id string', () => {
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE.id).toBe('qwik-material/button-toggle-group-state');
  });

  it('MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS has all 6 fields with sensible values', () => {
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.mode).toBe('single');
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.value).toBeUndefined();
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.values).toEqual([]);
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.disabled).toBe(false);
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.name).toBe('');
    expect(typeof MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle).toBe('function');
  });

  it('MatButtonToggleGroupState accepts a well-formed object', () => {
    const inst: MatButtonToggleGroupState = {
      mode: 'multi' satisfies MatButtonToggleGroupMode,
      value: undefined,
      values: ['a', 'b'],
      disabled: false,
      name: 'perms',
      onToggle: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle,
    };
    expect(inst.mode).toBe('multi');
    expect(inst.values).toEqual(['a', 'b']);
  });
});
