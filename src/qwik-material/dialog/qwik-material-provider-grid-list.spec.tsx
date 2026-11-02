import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatGridListConfig} from '../grid-list/grid-list-config';

describe('QwikMaterialProvider — matGridListConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts an empty matGridListConfig', () => {
    const cfg: MatGridListConfig = {};
    const props: QwikMaterialProviderProps = {matGridListConfig: cfg};
    expect(props.matGridListConfig).toBeDefined();
  });

  it('QwikMaterialProviderProps.matGridListConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matGridListConfig).toBeUndefined();
  });
});
