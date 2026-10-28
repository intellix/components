// Public API for @angular-community/qwik-material/sort.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md.

export type {SortDirection, Sort} from './sort-direction';
export type {SortHeaderArrowPosition, MatSortConfig} from './sort-config';
export {MAT_SORT_CONFIG} from './sort-config';

export {MatSort, type MatSortProps} from './mat-sort';
export {MatSortHeader, type MatSortHeaderProps} from './mat-sort-header';

// Shared sort-state context, re-exported so other entry points (e.g.
// qwik-material/table, whose `<MatTable sort={...}>` hosts the SAME
// MAT_SORT_STATE context itself rather than requiring a separate
// `<MatSort>` wrapper element — see table/mat-table.tsx) can provide/read
// it without duplicating the context id.
export {
  MAT_SORT_STATE,
  MAT_SORT_TABLE_CONFIG_DEFAULTS,
  readSortState,
  type MatSortSharedState,
  type MatSortTableConfig,
} from './sort-state';
