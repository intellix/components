/**
 * Sanity coverage for the qwik-cdk/accordion public surface.
 *
 * `useCdkAccordion`/`useCdkAccordionItem` are Qwik hooks — they call
 * `useContext`/`useContextProvider`/`useSignal`/`useTask$`, which throw
 * outside of a component's render (`createDOM()` is not reliable in this
 * package's vitest environment; see `qwik-material/button-toggle`'s own
 * scenario-port comment for the same finding). Real interaction coverage —
 * unique-selection auto-close, openAll/closeAll, disabled gating — is
 * exercised through `qwik-material/expansion`'s components in
 * `src/qwik-cdk-parity-tests/specs/material-expansion/*.spec.ts`, which
 * render real DOM via Playwright. The pure decision logic those hooks
 * delegate to (`shouldAutoClose`) is unit-tested directly in
 * `unique-selection.spec.ts`.
 */
import {describe, expect, it} from 'vitest';
import {useCdkAccordion} from './use-cdk-accordion';
import {useCdkAccordionItem} from './use-cdk-accordion-item';

describe('qwik-cdk/accordion surface — sanity', () => {
  it('useCdkAccordion and useCdkAccordionItem are exported and function-shaped', () => {
    expect(typeof useCdkAccordion).toBe('function');
    expect(typeof useCdkAccordionItem).toBe('function');
  });
});
