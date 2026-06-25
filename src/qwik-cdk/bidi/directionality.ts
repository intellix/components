import {createContextId, useContext, type Signal} from '@builder.io/qwik';

export type Direction = 'ltr' | 'rtl';

export function isDirection(v: unknown): v is Direction {
  return v === 'ltr' || v === 'rtl';
}

/** Replacement for CDK's @Injectable Directionality. Carries a signal-backed value. */
export class Directionality {
  readonly value: Signal<Direction>;

  constructor(initial: Direction = 'ltr') {
    // Using a plain object with a `value` field that mimics a Signal. The
    // QwikCdkRoot will replace this with `useSignal()` when it constructs the
    // context-provided instance.
    this.value = {value: initial} as Signal<Direction>;
  }

  change(next: Direction): void {
    (this.value as {value: Direction}).value = next;
  }
}

export const DIRECTIONALITY = createContextId<Directionality>('qwik-cdk/directionality');

export function useDirectionality(): Directionality {
  return useContext(DIRECTIONALITY);
}
