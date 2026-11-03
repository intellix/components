/**
 * `useCdkDomPortal()` calls `useSignal()`/`useVisibleTask$()` — same `createDOM()`-
 * unreliable note as `qwik-cdk/accordion/accordion-hooks.spec.ts` for the HOOK form — shape
 * sanity only here. Real DOM-relocation behavior (attach moves the element, detach restores
 * it to the exact original position, re-attach works) is a Playwright functional spec in the
 * dev-app — see `SYNC.md`.
 */
import {describe, expect, it} from 'vitest';
import {useCdkDomPortal} from './use-cdk-dom-portal';

describe('useCdkDomPortal — sanity', () => {
  it('is exported and function-shaped', () => {
    expect(typeof useCdkDomPortal).toBe('function');
  });
});
