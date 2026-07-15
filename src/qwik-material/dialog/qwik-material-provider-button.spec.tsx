/**
 * Smoke spec for QwikMaterialProvider button-config integration.
 *
 * createDOM variant was attempted but fails with "node.isAncestor is not a
 * function" — a pre-existing infra bug in the qwik/testing DOM shim (same
 * root cause as Task 5 regression). Flow-through behaviour will be covered by
 * Task 12 (scenario port) or Task 15 (Playwright E2E).
 */
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider} from './qwik-material-provider';
import {MAT_BUTTON_CONFIG} from '../button/button-config';

describe('QwikMaterialProvider (button config) — smoke', () => {
  it('exports QwikMaterialProvider as a callable component$', () => {
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('exports MAT_BUTTON_CONFIG context token', () => {
    expect(MAT_BUTTON_CONFIG).toBeDefined();
    expect(typeof MAT_BUTTON_CONFIG.id).toBe('string');
  });
});
