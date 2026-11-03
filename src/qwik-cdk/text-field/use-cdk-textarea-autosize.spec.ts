/**
 * `useCdkTextareaAutosize()` calls `useSignal()`/`useVisibleTask$()`, which throw outside of
 * a component's render (same `createDOM()`-unreliable note as
 * `qwik-cdk/accordion/accordion-hooks.spec.ts`) — shape/export sanity only here. The
 * measuring/resizing engine it wires up is fully covered by `textarea-autosize.spec.ts`; real
 * rendered-DOM behavior (typing grows the height up to `maxRows`, then scrolls) is a
 * Playwright functional spec in the dev-app — see `SYNC.md`.
 */
import {describe, expect, it} from 'vitest';
import {useCdkTextareaAutosize} from './use-cdk-textarea-autosize';

describe('qwik-cdk/text-field useCdkTextareaAutosize — sanity', () => {
  it('is exported and function-shaped', () => {
    expect(typeof useCdkTextareaAutosize).toBe('function');
  });
});
