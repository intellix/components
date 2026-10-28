// Mirrors src/material/sort/sort-direction.ts.

/** The direction a MatSort/MatSortHeader can be sorted in, or '' (cleared). */
export type SortDirection = 'asc' | 'desc' | '';

/**
 * The current sort state, as emitted by MatSort's `onSortChange$`. Mirrors
 * upstream's `Sort` interface (src/material/sort/sort.ts).
 */
export interface Sort {
  /** The id of the column being sorted. */
  active: string;
  /** The sort direction. */
  direction: SortDirection;
}
