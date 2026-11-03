/**
 * `useCdkScrollable()` calls `useSignal()`/`useVisibleTask$()` — same `createDOM()`-
 * unreliable note as `qwik-cdk/accordion/accordion-hooks.spec.ts` — shape/export sanity
 * only here. The registration logic it wires up is fully covered by
 * `scroll-dispatcher.spec.ts`.
 */
import {describe, expect, it} from 'vitest';
import {useCdkScrollable} from './use-cdk-scrollable';
import {getSharedScrollDispatcher, getSharedViewportRuler} from './shared-instances';

describe('qwik-cdk/scrolling hook surface — sanity', () => {
  it('useCdkScrollable is exported and function-shaped', () => {
    expect(typeof useCdkScrollable).toBe('function');
  });

  it('getSharedScrollDispatcher()/getSharedViewportRuler() return the same instance each call', () => {
    expect(getSharedScrollDispatcher()).toBe(getSharedScrollDispatcher());
    expect(getSharedViewportRuler()).toBe(getSharedViewportRuler());
  });
});
