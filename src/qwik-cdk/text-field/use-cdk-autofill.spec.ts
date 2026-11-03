/**
 * `useCdkAutofill()` calls `useSignal()`/`useVisibleTask$()` — same `createDOM()`-unreliable
 * note as `use-cdk-textarea-autosize.spec.ts` — shape/export sanity only here. The real
 * detection engine is fully covered by `autofill-monitor.spec.ts`.
 */
import {describe, expect, it} from 'vitest';
import {CDK_TEXT_FIELD_AUTOFILL_MONITORED_CLASS, useCdkAutofill} from './use-cdk-autofill';

describe('qwik-cdk/text-field useCdkAutofill — sanity', () => {
  it('is exported and function-shaped', () => {
    expect(typeof useCdkAutofill).toBe('function');
  });

  it('exports the exact marker class MatInput also renders', () => {
    expect(CDK_TEXT_FIELD_AUTOFILL_MONITORED_CLASS).toBe('cdk-text-field-autofill-monitored');
  });
});
