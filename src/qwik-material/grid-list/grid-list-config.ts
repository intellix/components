import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Defaults applied to every <MatGridList> in a subtree. Consumers provide
 * this via `useMatGridListProvider(...)`. Currently empty
 * — the grid-list has no consumer-configurable defaults today. Kept for
 * family shape parity with the other qwik-material components and to
 * allow future fields without an API break.
 */
export interface MatGridListConfig {}

/**
 * Context id reserved for a future `<MatGridList>` config read. Not
 * currently consumed: `<MatGridList>` is a plain function, not a
 * `component$` (see mat-grid-list.tsx's header comment), so it can't call
 * `useContext` — and there are no fields here yet to read anyway. The id
 * string is still exposed publicly and MUST remain stable across releases.
 */
export const MAT_GRID_LIST_CONFIG = createContextId<MatGridListConfig>(
  'qwikMaterial/gridListConfig',
);

/**
 * Provides {@link MAT_GRID_LIST_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatGridList
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatGridListProvider(config?: MatGridListConfig): void {
  useContextProvider(MAT_GRID_LIST_CONFIG, config ?? {});
}
