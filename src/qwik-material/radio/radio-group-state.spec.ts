import {describe, it, expect} from 'vitest';
import {MAT_RADIO_CONFIG, MAT_RADIO_CONFIG_DEFAULTS, type MatRadioConfig} from './radio-config';
import {
  MAT_RADIO_GROUP_STATE,
  MAT_RADIO_GROUP_STATE_DEFAULTS,
  type MatRadioGroupState,
} from './radio-group-state';

describe('MAT_RADIO_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_RADIO_CONFIG.id).toBe('qwik-material/radio-config');
  });

  it('MAT_RADIO_CONFIG_DEFAULTS mirrors upstream MAT_RADIO_DEFAULT_OPTIONS factory', () => {
    expect(MAT_RADIO_CONFIG_DEFAULTS).toEqual({color: 'accent', disabledInteractive: false});
  });

  it('MatRadioConfig accepts an empty object', () => {
    const cfg: MatRadioConfig = {};
    expect(cfg).toBeDefined();
  });
});

describe('MAT_RADIO_GROUP_STATE', () => {
  it('has the expected context id string', () => {
    expect(MAT_RADIO_GROUP_STATE.id).toBe('qwik-material/radio-group-state');
  });

  it('MAT_RADIO_GROUP_STATE_DEFAULTS has all 9 fields with sensible values', () => {
    expect(MAT_RADIO_GROUP_STATE_DEFAULTS.value).toBeUndefined();
    expect(MAT_RADIO_GROUP_STATE_DEFAULTS.name).toBe('');
    expect(MAT_RADIO_GROUP_STATE_DEFAULTS.disabled).toBe(false);
    expect(MAT_RADIO_GROUP_STATE_DEFAULTS.required).toBe(false);
    expect(MAT_RADIO_GROUP_STATE_DEFAULTS.disabledInteractive).toBe(false);
    expect(MAT_RADIO_GROUP_STATE_DEFAULTS.labelPosition).toBe('after');
    expect(MAT_RADIO_GROUP_STATE_DEFAULTS.color).toBeUndefined();
    expect(typeof MAT_RADIO_GROUP_STATE_DEFAULTS.onChange$).toBe('function');
    expect(MAT_RADIO_GROUP_STATE_DEFAULTS.standalone).toBe(true);
  });

  it('DEFAULTS.onChange$ is a no-op that does not throw when invoked', async () => {
    await expect(MAT_RADIO_GROUP_STATE_DEFAULTS.onChange$('foo', 123)).resolves.toBeUndefined();
  });

  it('MatRadioGroupState accepts a well-formed grouped object', () => {
    const inst: MatRadioGroupState = {
      value: 'spring',
      name: 'mat-radio-group-0',
      disabled: false,
      required: true,
      disabledInteractive: false,
      labelPosition: 'before',
      color: 'primary',
      onChange$: MAT_RADIO_GROUP_STATE_DEFAULTS.onChange$,
      standalone: false,
    };
    expect(inst.value).toBe('spring');
    expect(inst.standalone).toBe(false);
    expect(inst.color).toBe('primary');
  });
});
