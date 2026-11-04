import {createContextId, useContextProvider} from '@qwik.dev/core';

/** Position of the arrow that displays when sorted. Mirrors upstream's
 *  `SortHeaderArrowPosition` (src/material/sort/sort.ts). */
export type SortHeaderArrowPosition = 'before' | 'after';

/**
 * Defaults applied to every MatSort / MatSortHeader in a subtree. Consumers
 * provide this via `useMatSortProvider(...)`. Mirrors
 * upstream's `MatSortDefaultOptions` (`MAT_SORT_DEFAULT_OPTIONS` injection
 * token, src/material/sort/sort.ts).
 */
export interface MatSortConfig {
  /** Whether to disable clearing the sorting state, by default. Overridden
   *  by MatSort's own `disableClear` prop when explicitly set, which in
   *  turn is overridden per-header by MatSortHeader's own `disableClear`
   *  prop. */
  disableClear?: boolean;
  /** Default position of the arrow that displays when sorted. Overridden
   *  by MatSortHeader's own `arrowPosition` prop when explicitly set. */
  arrowPosition?: SortHeaderArrowPosition;
}

/**
 * Context id used by MatSort / MatSortHeader to read config. The id string
 * is exposed publicly and MUST remain stable across releases.
 */
export const MAT_SORT_CONFIG = createContextId<MatSortConfig>('qwikMaterial/sortConfig');

/**
 * Provides {@link MAT_SORT_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatSort / MatSortHeader
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatSortProvider(config?: MatSortConfig): void {
  useContextProvider(MAT_SORT_CONFIG, config ?? {});
}
