import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatIconConfig} from '../icon/icon-config';

describe('QwikMaterialProvider — matIconConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts a matIconConfig field', () => {
    const cfg: MatIconConfig = {color: 'accent', fontSet: 'material-symbols-outlined'};
    const props: QwikMaterialProviderProps = {matIconConfig: cfg};
    expect(props.matIconConfig?.color).toBe('accent');
    expect(props.matIconConfig?.fontSet).toBe('material-symbols-outlined');
  });

  it('QwikMaterialProviderProps.matIconConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matIconConfig).toBeUndefined();
  });
});
