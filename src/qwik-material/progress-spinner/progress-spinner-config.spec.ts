import {describe, it, expect} from 'vitest';
import {
  MAT_PROGRESS_SPINNER_CONFIG,
  type MatProgressSpinnerConfig,
} from './progress-spinner-config';

describe('MAT_PROGRESS_SPINNER_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_PROGRESS_SPINNER_CONFIG.id).toBe('qwik-material/progress-spinner-config');
  });

  it('MatProgressSpinnerConfig accepts an empty object', () => {
    const cfg: MatProgressSpinnerConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatProgressSpinnerConfig accepts every documented field', () => {
    const cfg: MatProgressSpinnerConfig = {color: 'accent', diameter: 40, strokeWidth: 3};
    expect(cfg.color).toBe('accent');
    expect(cfg.diameter).toBe(40);
    expect(cfg.strokeWidth).toBe(3);
  });
});
