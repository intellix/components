import {createContextId, useContext} from '@builder.io/qwik';

/**
 * Monotonic ID generator used to mint stable `cdk-overlay-N`, `cdk-dialog-N`,
 * etc. IDs across SSR and CSR. The interface mirrors CDK's `_IdGenerator`.
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

export const ID_GENERATOR = createContextId<IdGenerator>('qwik-cdk/id-generator');

export function useIdGenerator(): IdGenerator {
  return useContext(ID_GENERATOR);
}

/** @deprecated alias retained for one release while consumers migrate to `IdGenerator`. */
export type _IdGenerator = IdGenerator;
