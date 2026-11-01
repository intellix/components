import {createContextId, useContext, type Signal} from '@qwik.dev/core';

export type Direction = 'ltr' | 'rtl';

export function isDirection(v: unknown): v is Direction {
  return v === 'ltr' || v === 'rtl';
}

/**
 * Replacement for CDK's @Injectable Directionality. Carries a signal-backed value.
 *
 * Plain object built by `createDirectionality()`; the underlying `.value` is a
 * Qwik-compatible signal-shim that consumers can read directly and mutate via
 * `change()`. `<QwikCdkRoot>` should provide a real `useSignal()`-backed
 * instance via context so reactivity flows through Qwik's tracker.
 */
export interface Directionality {
  readonly value: Signal<Direction>;
  change(next: Direction): void;
}

export function createDirectionality(initial: Direction = 'ltr'): Directionality {
  const value = {value: initial} as Signal<Direction>;
  return {
    value,
    change(next) {
      (value as {value: Direction}).value = next;
    },
  };
}

export const DIRECTIONALITY = createContextId<Directionality>('qwik-cdk/directionality');

export function useDirectionality(): Directionality {
  return useContext(DIRECTIONALITY);
}
