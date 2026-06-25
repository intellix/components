import {createContextId, useContext} from '@builder.io/qwik';

export class _IdGenerator {
  private counter = 0;
  getId(prefix: string): string {
    return `${prefix}${this.counter++}`;
  }
}

export const ID_GENERATOR = createContextId<_IdGenerator>('qwik-cdk/id-generator');

export function useIdGenerator(): _IdGenerator {
  return useContext(ID_GENERATOR);
}
