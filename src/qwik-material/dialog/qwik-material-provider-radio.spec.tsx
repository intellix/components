import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatRadioConfig} from '../radio/radio-config';

describe('QwikMaterialProvider — matRadioConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts a matRadioConfig', () => {
    const cfg: MatRadioConfig = {color: 'primary', disabledInteractive: true};
    const props: QwikMaterialProviderProps = {matRadioConfig: cfg};
    expect(props.matRadioConfig).toBeDefined();
  });

  it('QwikMaterialProviderProps.matRadioConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matRadioConfig).toBeUndefined();
  });
});
