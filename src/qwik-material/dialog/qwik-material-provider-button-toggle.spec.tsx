import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatButtonToggleConfig} from '../button-toggle/button-toggle-config';

describe('QwikMaterialProvider — matButtonToggleConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts an empty matButtonToggleConfig', () => {
    const cfg: MatButtonToggleConfig = {};
    const props: QwikMaterialProviderProps = {matButtonToggleConfig: cfg};
    expect(props.matButtonToggleConfig).toBeDefined();
  });

  it('QwikMaterialProviderProps.matButtonToggleConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matButtonToggleConfig).toBeUndefined();
  });
});
