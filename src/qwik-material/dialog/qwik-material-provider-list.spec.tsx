import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatListConfig} from '../list/list-config';

describe('QwikMaterialProvider — matListConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts an empty matListConfig', () => {
    const cfg: MatListConfig = {};
    const props: QwikMaterialProviderProps = {matListConfig: cfg};
    expect(props.matListConfig).toBeDefined();
  });

  it('QwikMaterialProviderProps.matListConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matListConfig).toBeUndefined();
  });
});
