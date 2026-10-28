import {describe, it, expect} from 'vitest';
import {MAT_SLIDE_TOGGLE_CONFIG, type MatSlideToggleConfig} from './slide-toggle-config';

describe('MAT_SLIDE_TOGGLE_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_SLIDE_TOGGLE_CONFIG.id).toBe('qwik-material/slide-toggle-config');
  });

  it('MatSlideToggleConfig accepts an empty object and a fully-populated one', () => {
    const empty: MatSlideToggleConfig = {};
    expect(empty).toBeDefined();

    const full: MatSlideToggleConfig = {
      disableToggleValue: true,
      color: 'warn',
      hideIcon: true,
      disabledInteractive: true,
    };
    expect(full.color).toBe('warn');
  });
});
