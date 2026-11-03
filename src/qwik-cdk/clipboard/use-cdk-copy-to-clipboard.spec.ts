/**
 * `useCdkCopyToClipboard()` calls `useContext()`, which throws outside of a component's
 * render (same `createDOM()`-unreliable note as `qwik-cdk/accordion/accordion-hooks.spec.ts`)
 * — shape/export sanity only here. Real click-triggered copy behavior is covered by
 * `clipboard.spec.ts` (the plain functions this hook calls) and the dev-app functional spec
 * (`src/qwik-cdk-dev-app`'s clipboard scenario, driven by Playwright).
 */
import {describe, expect, it} from 'vitest';
import {CDK_COPY_TO_CLIPBOARD_CONFIG, useCdkCopyToClipboard} from './use-cdk-copy-to-clipboard';

describe('qwik-cdk/clipboard hook surface — sanity', () => {
  it('useCdkCopyToClipboard is exported and function-shaped', () => {
    expect(typeof useCdkCopyToClipboard).toBe('function');
  });

  it('CDK_COPY_TO_CLIPBOARD_CONFIG is a context id', () => {
    expect(typeof CDK_COPY_TO_CLIPBOARD_CONFIG).toBe('object');
  });
});
