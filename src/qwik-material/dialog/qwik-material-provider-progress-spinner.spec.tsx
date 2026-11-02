import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatProgressSpinnerConfig} from '../progress-spinner/progress-spinner-config';

describe('QwikMaterialProvider — matProgressSpinnerConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts a matProgressSpinnerConfig field', () => {
    const cfg: MatProgressSpinnerConfig = {color: 'accent', diameter: 40, strokeWidth: 3};
    const props: QwikMaterialProviderProps = {matProgressSpinnerConfig: cfg};
    expect(props.matProgressSpinnerConfig?.color).toBe('accent');
    expect(props.matProgressSpinnerConfig?.diameter).toBe(40);
    expect(props.matProgressSpinnerConfig?.strokeWidth).toBe(3);
  });

  it('QwikMaterialProviderProps.matProgressSpinnerConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matProgressSpinnerConfig).toBeUndefined();
  });
});
