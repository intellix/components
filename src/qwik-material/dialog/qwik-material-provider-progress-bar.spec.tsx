import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatProgressBarConfig} from '../progress-bar/progress-bar-config';

describe('QwikMaterialProvider — matProgressBarConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts a matProgressBarConfig field', () => {
    const cfg: MatProgressBarConfig = {color: 'accent', mode: 'buffer'};
    const props: QwikMaterialProviderProps = {matProgressBarConfig: cfg};
    expect(props.matProgressBarConfig?.color).toBe('accent');
    expect(props.matProgressBarConfig?.mode).toBe('buffer');
  });

  it('QwikMaterialProviderProps.matProgressBarConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matProgressBarConfig).toBeUndefined();
  });
});
