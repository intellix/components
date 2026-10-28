import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatSortConfig} from '../sort/sort-config';

describe('QwikMaterialProvider — matSortConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts a fully-populated matSortConfig', () => {
    const cfg: MatSortConfig = {disableClear: true, arrowPosition: 'before'};
    const props: QwikMaterialProviderProps = {matSortConfig: cfg};
    expect(props.matSortConfig).toEqual(cfg);
  });

  it('QwikMaterialProviderProps.matSortConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matSortConfig).toBeUndefined();
  });
});
