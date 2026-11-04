import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Defaults applied to every MatList / MatNavList / MatActionList / MatSubheader
 * in a subtree. Consumers provide this via
 * `useMatListProvider(...)`. Currently empty — the display
 * list has no consumer-configurable defaults today. Kept for family shape
 * parity with the other qwik-material components (divider, grid-list) and to
 * allow future fields without an API break.
 */
export interface MatListConfig {}

/**
 * Context id used by MatList / MatNavList / MatActionList / MatSubheader to
 * read config. The id string is exposed publicly and MUST remain stable
 * across releases — consumers may inject it directly in advanced scenarios.
 */
export const MAT_LIST_CONFIG = createContextId<MatListConfig>('qwikMaterial/listConfig');

/**
 * Provides {@link MAT_LIST_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatList / MatNavList / MatActionList / MatSubheader
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatListProvider(config?: MatListConfig): void {
  useContextProvider(MAT_LIST_CONFIG, config ?? {});
}
