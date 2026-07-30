import {describe, it, expect} from 'vitest';
import {MAT_PROGRESS_BAR_CONFIG, type MatProgressBarConfig} from './progress-bar-config';

describe('MAT_PROGRESS_BAR_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_PROGRESS_BAR_CONFIG.id).toBe('qwik-material/progress-bar-config');
  });

  it('MatProgressBarConfig accepts an empty object', () => {
    const cfg: MatProgressBarConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatProgressBarConfig accepts every documented field', () => {
    const cfg: MatProgressBarConfig = {color: 'accent', mode: 'buffer'};
    expect(cfg.color).toBe('accent');
    expect(cfg.mode).toBe('buffer');
  });
});
