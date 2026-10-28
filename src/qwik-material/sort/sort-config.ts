import {createContextId} from '@builder.io/qwik';

/** Position of the arrow that displays when sorted. Mirrors upstream's
 *  `SortHeaderArrowPosition` (src/material/sort/sort.ts). */
export type SortHeaderArrowPosition = 'before' | 'after';

/**
 * Defaults applied to every MatSort / MatSortHeader in a subtree. Consumers
 * provide this via <QwikMaterialProvider matSortConfig={...}>. Mirrors
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
export const MAT_SORT_CONFIG = createContextId<MatSortConfig>('qwik-material/sort-config');
