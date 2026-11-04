import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Defaults applied to every <MatDivider> in a subtree. Consumers provide this
 * via `useMatDividerProvider(...)`. Currently empty — the
 * divider has no consumer-configurable defaults today. Kept for family shape
 * parity with the other qwik-material components and to allow future fields
 * without an API break.
 */
export interface MatDividerConfig {}

/**
 * Context id used by <MatDivider> to read config. The id string is exposed
 * publicly and MUST remain stable across releases — consumers may inject it
 * directly in advanced scenarios.
 */
export const MAT_DIVIDER_CONFIG = createContextId<MatDividerConfig>('qwikMaterial/dividerConfig');

/**
 * Provides {@link MAT_DIVIDER_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatDivider
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatDividerProvider(config?: MatDividerConfig): void {
  useContextProvider(MAT_DIVIDER_CONFIG, config ?? {});
}
