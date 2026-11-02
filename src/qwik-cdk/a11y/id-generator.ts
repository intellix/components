import {createContextId, useContext, type Signal} from '@qwik.dev/core';

/**
 * Monotonic ID generator used to mint stable `cdk-overlay-N`, `cdk-dialog-N`,
 * `mat-button-toggle-N`, etc. IDs across SSR and CSR. The interface mirrors
 * CDK's `_IdGenerator`.
 */
export interface IdGenerator {
  getId(prefix: string): string;
}

export function createIdGenerator(): IdGenerator {
  let counter = 0;
  return {
    getId(prefix) {
      return `${prefix}${counter++}`;
    },
  };
}

/**
 * Context carries a plain `Signal<number>` counter — NOT a closure-bearing
 * `IdGenerator` object. An `IdGenerator`'s `getId` method is a plain
 * function/closure; providing one directly via `useContextProvider` requires
 * `noSerialize()` (see `<QwikCdkRoot>`'s `keyboardDispatcher` /
 * `outsideClickDispatcher` fields for the established pattern), and a
 * `noSerialize()`-wrapped value becomes `undefined` after the SSR→resume
 * boundary until some client-only `useVisibleTask$` repopulates it — too late
 * for components that need a stable id already baked into the SSR HTML.
 * A `Signal<number>` is plain data: it serializes for free, so `useIdGenerator()`
 * can rebuild a cheap `IdGenerator` wrapper around it on every call, during
 * SSR or CSR, with no synchronization gap.
 */
export const ID_GENERATOR_COUNTER = createContextId<Signal<number>>('qwikCdk/idGeneratorCounter');

/**
 * Fallback counter for components rendered without a `<QwikCdkRoot>` ancestor
 * (e.g. isolated unit tests). Digits are not meaningful across renders in that
 * case — only the shape of the id (`prefix` + digits) is guaranteed.
 */
const _DEFAULT_COUNTER: Signal<number> = {value: 0} as Signal<number>;

/**
 * Reads the shared `ID_GENERATOR_COUNTER` context (provided by
 * `<QwikCdkRoot>`) and returns an `IdGenerator` backed by it, falling back to
 * a private counter when no provider is present.
 */
export function useIdGenerator(): IdGenerator {
  const counter = useContext(ID_GENERATOR_COUNTER, _DEFAULT_COUNTER);
  return {
    getId(prefix) {
      return `${prefix}${counter.value++}`;
    },
  };
}

/** @deprecated alias retained for one release while consumers migrate to `IdGenerator`. */
export type _IdGenerator = IdGenerator;
