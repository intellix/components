import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatDividerConfig} from '../divider/divider-config';

describe('QwikMaterialProvider — matDividerConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts an empty matDividerConfig', () => {
    const cfg: MatDividerConfig = {};
    const props: QwikMaterialProviderProps = {matDividerConfig: cfg};
    expect(props.matDividerConfig).toBeDefined();
  });

  it('QwikMaterialProviderProps.matDividerConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matDividerConfig).toBeUndefined();
  });
});
