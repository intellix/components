import type {JSXOutput, QRL} from '@builder.io/qwik';
import type {Sort, SortDirection} from '@angular-community/qwik-material/sort';

/**
 * A single column's definition — combines what upstream splits across
 * `matColumnDef`/`matHeaderCellDef`/`matCellDef`/`matFooterCellDef` (each a
 * separate directive with its own `<ng-template>`) into one plain object.
 *
 * SSR-readable-shape rationale (see SYNC.md "Why columns/rows are data, not
 * slotted children"): Qwik cannot read a `<Slot>`'s projected children's
 * shape during SSR (the documented `qwik-material/list`/`tabs`/`stepper`
 * finding), and a `component$`'s render function cannot be async (so a
 * per-row `QRL<(row) => JSXOutput>` cell template, resolved synchronously
 * inside `<MatTable>`'s own render, is not viable either — see
 * `qwik-material/tabs`' SYNC.md "a component$'s render function cannot be
 * async" finding). So `header`/`footer` here are plain, already-built
 * `JSXOutput` (exactly `MatTabDef.labelTemplate`'s shape) — correct for
 * content that is the SAME for every row — and per-row DATA cell content is
 * supplied by the CONSUMER's own `rows` array (`MatTableRow.cells`), already
 * computed per row, exactly how `MatTabGroup`'s `tabs` array already
 * carries fully-realized `content` rather than a template function.
 */
export interface MatColumnDef {
  /** Matches Angular's `matColumnDef` value. Produces `cdk-column-<name>
   *  mat-column-<name>` on every header/data/footer cell for this column —
   *  hyphens and other non-`[a-z0-9_-]` characters survive (replaced 1:1
   *  with `-`, not collapsed; see `qwik-cdk/table`'s `cssClassFriendlyName`). */
  name: string;
  /** Header cell content (`*matHeaderCellDef`). Omit for a column never
   *  used in a header row. */
  header?: JSXOutput | string;
  /** `aria-label` set directly on the generated header `<th>`/
   *  `<mat-header-cell>` (e.g. an icon-only actions column's header). */
  headerAriaLabel?: string;
  /**
   * Renders this column's header cell as a `<MatSortHeader>` (id defaults
   * to `name`) INSTEAD OF a plain generated `<th>` — upstream's
   * `mat-sort-header`/`mat-header-cell` are two directives on the SAME
   * `<th>` element, so `<MatTable>` must emit exactly one merged element
   * rather than nesting `<MatSortHeader>` inside its own generated `<th>`
   * (which would produce two `<th>`s). Only meaningful when the table's
   * own `sort` prop is also set. Native table form only — see SYNC.md.
   */
  sortHeader?: boolean | {id?: string};
  /** Footer cell content (`*matFooterCellDef`). Omit for a column never
   *  used in a footer row. */
  footer?: JSXOutput | string;
  /** `[sticky]` on `matColumnDef` — sticks this column's header/data/footer
   *  cells to the START (left in LTR) edge. */
  sticky?: boolean;
  /** `[stickyEnd]` on `matColumnDef` — sticks this column's cells to the
   *  END (right in LTR) edge. */
  stickyEnd?: boolean;
  /** `CdkTextColumn.justify` — applies `text-align` inline on the header
   *  AND every data/footer cell for this column. See `matTextColumn()`. */
  justify?: 'start' | 'end' | 'center';
}

/** One rendered data row. `cells` is keyed by column name, already
 *  evaluated for THIS row — the migration mapping of
 *  `*matCellDef="let element">{{ element.position }}` is simply
 *  `cells: {position: element.position}` in the consumer's own `.map()`
 *  over its data array (see SYNC.md). */
export interface MatTableRow {
  /** Stable key for Qwik's keyed rendering; falls back to the row's index. */
  key?: string | number;
  cells: Partial<Record<string, JSXOutput | string | number | null | undefined>>;
}

/** One header or footer row definition (`*matHeaderRowDef`/
 *  `*matFooterRowDef`) — which columns it renders, in order, and whether
 *  it's sticky. */
export interface MatTableRowGroupDef {
  columns: string[];
  sticky?: boolean;
}

/** `*matNoDataRow` content, shown instead of any data rows when `rows` is
 *  empty. `rowClass`/`cellClass` are the consumer's OWN authored classes
 *  (mirroring upstream's own doc convention of writing `class="mat-row"`/
 *  `class="mat-cell"` directly on the no-data template) — `MatTable` always
 *  merges its own generated `cdk-no-data-row`/`mat-mdc-no-data-row`/etc.
 *  classes on top, exactly as `CdkTable._updateNoDataRow` does. */
export interface MatNoDataRowDef {
  content: JSXOutput | string;
  rowClass?: string | ReadonlyArray<string>;
  cellClass?: string | ReadonlyArray<string>;
  colSpan?: number;
}

/** `[matSort]` integration. When provided, `MatTable` itself hosts the
 *  shared sort state (see mat-table.tsx) — there is no separate
 *  `<MatSort>` wrapper, since upstream's `matSort` directive and
 *  `mat-table`/`table[mat-table]` component attach to the SAME element. Put
 *  a `<MatSortHeader>` directly in a column's `header`. */
export interface MatTableSortConfig {
  active?: string;
  start?: SortDirection;
  direction?: SortDirection;
  disableClear?: boolean;
  disabled?: boolean;
  onSortChange$?: QRL<(sort: Sort) => void>;
}

export interface MatTableProps {
  /** Native `<table mat-table>` vs the flex `<mat-table>` element form.
   *  Default `'table'`. */
  as?: 'table' | 'mat-table';
  columns: MatColumnDef[];
  rows: MatTableRow[];
  /** Columns rendered by the (single) data row, in order. */
  displayedColumns: string[];
  /** Header row(s). Defaults to one row using `displayedColumns`. Provide
   *  explicitly for multiple header rows (e.g. a grouping row) or to mark
   *  the default row sticky. */
  headerRows?: MatTableRowGroupDef[];
  /** Footer row(s). None by default — provide one entry (normally with the
   *  same `displayedColumns`) to render a footer. */
  footerRows?: MatTableRowGroupDef[];
  noData?: MatNoDataRowDef;
  /** `[class.mat-table-fixed-layout]`. */
  fixedLayout?: boolean;
  sort?: MatTableSortConfig;
  id?: string;
  class?: string | ReadonlyArray<string>;
}
