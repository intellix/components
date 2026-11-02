import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider} from './qwik-material-provider';

describe('QwikMaterialProvider (badge config smoke)', () => {
  it('QwikMaterialProvider is a Qwik component', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });
});
