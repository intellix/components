import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider} from './qwik-material-provider';

describe('QwikMaterialProvider', () => {
  it('is a callable component$', () => {
    expect(typeof QwikMaterialProvider).toBe('function');
  });
});
