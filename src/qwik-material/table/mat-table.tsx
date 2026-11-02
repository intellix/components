import {component$, useContextProvider, useSignal, type JSXOutput} from '@qwik.dev/core';
import {
  cdkColumnClass,
  createVirtualStickyElement,
  matColumnClass,
  StickyStyler,
  virtualStickyElementToProps,
} from '@angular-community/qwik-cdk/table';
import {
  MAT_SORT_STATE,
  MatSortHeader,
  type MatSortSharedState,
  type Sort,
} from '@angular-community/qwik-material/sort';
import type {
  MatColumnDef,
  MatNoDataRowDef,
  MatTableProps,
  MatTableRowGroupDef,
} from './mat-table-types';

export type {
  MatColumnDef,
  MatNoDataRowDef,
  MatTableProps,
  MatTableRowGroupDef,
  MatTableRow,
  MatTableSortConfig,
} from './mat-table-types';

/** `mat-mdc-table mdc-data-table__table` (Material) concatenated with
 *  `cdk-table` (base CdkTable host class) — see angular-parity.spec.ts
 *  point 1. */
const TABLE_BASE_CLASSES = ['cdk-table', 'mat-mdc-table', 'mdc-data-table__table'];
const HEADER_ROW_BASE_CLASSES = [
  'cdk-header-row',
  'mat-mdc-header-row',
  'mdc-data-table__header-row',
];
const DATA_ROW_BASE_CLASSES = ['cdk-row', 'mat-mdc-row', 'mdc-data-table__row'];
const FOOTER_ROW_BASE_CLASSES = ['cdk-footer-row', 'mat-mdc-footer-row', 'mdc-data-table__row'];
const HEADER_CELL_BASE_CLASSES = [
  'cdk-header-cell',
  'mat-mdc-header-cell',
  'mdc-data-table__header-cell',
];
const DATA_CELL_BASE_CLASSES = ['cdk-cell', 'mat-mdc-cell', 'mdc-data-table__cell'];
const FOOTER_CELL_BASE_CLASSES = ['cdk-footer-cell', 'mat-mdc-footer-cell', 'mdc-data-table__cell'];

function columnClasses(name: string): string[] {
  return [cdkColumnClass(name), matColumnClass(name)];
}

function justifyStyle(justify: MatColumnDef['justify']): Record<string, string> | undefined {
  return justify ? {textAlign: justify} : undefined;
}

function mergeStyle(
  a: Record<string, string> | undefined,
  b: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!a && !b) return undefined;
  return {...a, ...b};
}

interface CellRenderArgs {
  kind: 'header' | 'data' | 'footer';
  isNative: boolean;
  key: string | number;
  classes: string[];
  style: Record<string, string> | undefined;
  content: JSXOutput | string | number | null | undefined;
  ariaLabel?: string;
}

/** Renders one `<th>`/`<td>` (native) or `<mat-header-cell>`/`<mat-cell>`/
 *  `<mat-footer-cell>` (flex). Plain helper function — not a `component$` —
 *  called synchronously inside `MatTable`'s own render, same pattern
 *  badge/list use for their polymorphic `as` branches, just factored out
 *  because `MatTable` has many more leaf shapes than a single element. */
function renderCell(args: CellRenderArgs): JSXOutput {
  const {kind, isNative, key, classes, style, content, ariaLabel} = args;
  if (kind === 'header') {
    return isNative ? (
      <th key={key} role="columnheader" class={classes} style={style} aria-label={ariaLabel}>
        {content}
      </th>
    ) : (
      <mat-header-cell
        key={key}
        role="columnheader"
        class={classes}
        style={style}
        aria-label={ariaLabel}
      >
        {content}
      </mat-header-cell>
    );
  }
  if (kind === 'footer') {
    return isNative ? (
      <td key={key} role="cell" class={classes} style={style}>
        {content}
      </td>
    ) : (
      <mat-footer-cell key={key} role="cell" class={classes} style={style}>
        {content}
      </mat-footer-cell>
    );
  }
  return isNative ? (
    <td key={key} role="cell" class={classes} style={style}>
      {content}
    </td>
  ) : (
    <mat-cell key={key} role="cell" class={classes} style={style}>
      {content}
    </mat-cell>
  );
}

interface RowRenderArgs {
  kind: 'header' | 'data' | 'footer';
  isNative: boolean;
  key: string | number;
  classes: string[];
  style: Record<string, string> | undefined;
  cells: JSXOutput[];
}

function renderRow(args: RowRenderArgs): JSXOutput {
  const {kind, isNative, key, classes, style, cells} = args;
  if (kind === 'header') {
    return isNative ? (
      <tr key={key} role="row" class={classes} style={style}>
        {cells}
      </tr>
    ) : (
      <mat-header-row key={key} role="row" class={classes} style={style}>
        {cells}
      </mat-header-row>
    );
  }
  if (kind === 'footer') {
    return isNative ? (
      <tr key={key} role="row" class={classes} style={style}>
        {cells}
      </tr>
    ) : (
      <mat-footer-row key={key} role="row" class={classes} style={style}>
        {cells}
      </mat-footer-row>
    );
  }
  return isNative ? (
    <tr key={key} role="row" class={classes} style={style}>
      {cells}
    </tr>
  ) : (
    <mat-row key={key} role="row" class={classes} style={style}>
      {cells}
    </mat-row>
  );
}

function renderNoDataRow(noData: MatNoDataRowDef, displayedColumns: readonly string[]): JSXOutput {
  const rowClasses = [
    ...(Array.isArray(noData.rowClass)
      ? noData.rowClass
      : noData.rowClass
        ? [noData.rowClass]
        : []),
    'cdk-no-data-row',
    'cdk-row',
    'mat-mdc-no-data-row',
    'mat-mdc-row',
    'mdc-data-table__row',
  ] as string[];
  const cellClasses = [
    ...(Array.isArray(noData.cellClass)
      ? noData.cellClass
      : noData.cellClass
        ? [noData.cellClass]
        : []),
    'cdk-cell',
    'cdk-no-data-cell',
    'mat-mdc-cell',
    'mdc-data-table__cell',
    'mat-no-data-cell',
  ] as string[];
  return (
    <tr role="row" class={rowClasses}>
      <td class={cellClasses} colSpan={noData.colSpan ?? displayedColumns.length}>
        {noData.content}
      </td>
    </tr>
  );
}

/**
 * Faithful port of mat-table (native `<table mat-table>` and the flex
 * `<mat-table>` form), `mat-text-column` (via `matTextColumn()`),
 * `matNoDataRow`, sticky rows/columns (`qwik-cdk/table`'s `StickyStyler`),
 * and `matSort` integration. See mat-table-types.ts for the column/row
 * definition shape and SYNC.md for the full upstream-sync notes and
 * deviations.
 */
export const MatTable = component$<MatTableProps>(props => {
  const isNative = (props.as ?? 'table') !== 'mat-table';
  const columnsByName = new Map(props.columns.map(c => [c.name, c] as const));

  // --- matSort integration — see mat-table-types.ts's MatTableSortConfig
  // doc comment. Always create + provide the shared signals (Qwik hooks
  // must run unconditionally every render); only the VISIBLE `mat-sort`
  // class depends on whether `props.sort` was actually given. `tableConfig`
  // is OVERWRITTEN fresh every render and NEVER read back by this
  // component — see qwik-material/sort's sort-state.ts doc comment for why
  // reading it back here would cause an infinite reactive loop.
  const sortValue = useSignal<Sort>(() => ({
    active: props.sort?.active ?? '',
    direction: props.sort?.direction ?? '',
  }));
  const tableConfig = useSignal({
    start: props.sort?.start ?? 'asc',
    disableClear: props.sort?.disableClear ?? false,
    disabled: props.sort?.disabled ?? false,
    onSortChange: props.sort?.onSortChange$,
  });
  tableConfig.value = {
    start: props.sort?.start ?? 'asc',
    disableClear: props.sort?.disableClear ?? false,
    disabled: props.sort?.disabled ?? false,
    onSortChange: props.sort?.onSortChange$,
  };
  const sharedSortState: MatSortSharedState = {sortValue, tableConfig};
  useContextProvider(MAT_SORT_STATE, sharedSortState);

  const headerRowDefs: MatTableRowGroupDef[] = props.headerRows ?? [
    {columns: props.displayedColumns},
  ];
  const footerRowDefs: MatTableRowGroupDef[] = props.footerRows ?? [];
  const dataColumns = props.displayedColumns;

  // --- Sticky positioning — qwik-cdk/table's StickyStyler, operating on
  // VirtualStickyElements built fresh for this render (no persistent DOM to
  // clear stale state from; see sticky-styler.ts's header comment).
  const styler = new StickyStyler('mat-mdc-table-sticky', false, 'ltr');

  const headerRowVE = headerRowDefs.map(() => createVirtualStickyElement());
  const headerCellVE = headerRowDefs.map(def =>
    def.columns.map(() => createVirtualStickyElement()),
  );
  const dataCellVE = props.rows.map(() => dataColumns.map(() => createVirtualStickyElement()));
  const footerRowVE = footerRowDefs.map(() => createVirtualStickyElement());
  const footerCellVE = footerRowDefs.map(def =>
    def.columns.map(() => createVirtualStickyElement()),
  );
  const tfootVE = createVirtualStickyElement();

  // 1. Row-level sticky (top/bottom) — matches CdkTable._render()'s order:
  // header rows first, then footer rows + the tfoot container quirk, THEN
  // column (left/right) styling (step 2 below) — order matters because
  // z-index accumulates across passes (see sticky-styler.ts).
  if (headerRowDefs.length) {
    styler.stickRows(
      headerRowDefs.map((def, i) => ({
        sticky: !!def.sticky,
        height: 0,
        cells: headerCellVE[i],
        row: headerRowVE[i],
      })),
      'top',
      isNative,
    );
  }
  if (isNative) {
    // Native-table-only: footer row stacking + the always-present tfoot
    // Safari workaround (applies even with zero footer rows — vacuous
    // truth; see angular-parity.spec.ts point 4).
    if (footerRowDefs.length) {
      styler.stickRows(
        footerRowDefs.map((def, i) => ({
          sticky: !!def.sticky,
          height: 0,
          cells: footerCellVE[i],
          row: footerRowVE[i],
        })),
        'bottom',
        isNative,
      );
    }
    styler.updateStickyFooterContainer(
      tfootVE,
      footerRowDefs.map(def => !!def.sticky),
    );
  }

  // 2. Column-level sticky (left/right), per row GROUP (each header row in
  // its own column order; all data rows together, sharing dataColumns;
  // each footer row in its own column order) — matches
  // CdkTable.updateStickyColumnStyles().
  headerRowDefs.forEach((def, i) => {
    const defs = def.columns.map(name => columnsByName.get(name));
    const startStates = defs.map(d => !!d?.sticky);
    const endStates = defs.map(d => !!d?.stickyEnd);
    styler.updateStickyColumns(
      [{cells: headerCellVE[i]}],
      startStates,
      endStates,
      defs.map(() => 0),
    );
  });
  if (props.rows.length) {
    const defs = dataColumns.map(name => columnsByName.get(name));
    const startStates = defs.map(d => !!d?.sticky);
    const endStates = defs.map(d => !!d?.stickyEnd);
    styler.updateStickyColumns(
      dataCellVE.map(cells => ({cells})),
      startStates,
      endStates,
      defs.map(() => 0),
    );
  }
  footerRowDefs.forEach((def, i) => {
    const defs = def.columns.map(name => columnsByName.get(name));
    const startStates = defs.map(d => !!d?.sticky);
    const endStates = defs.map(d => !!d?.stickyEnd);
    styler.updateStickyColumns(
      [{cells: footerCellVE[i]}],
      startStates,
      endStates,
      defs.map(() => 0),
    );
  });

  // --- Render ---
  const headerRowsJSX = headerRowDefs.map((def, i) =>
    renderRow({
      kind: 'header',
      isNative,
      key: `h${i}`,
      classes: [...HEADER_ROW_BASE_CLASSES, ...virtualStickyElementToProps(headerRowVE[i]).classes],
      style: virtualStickyElementToProps(headerRowVE[i]).style,
      cells: def.columns.map((name, j) => {
        const col = columnsByName.get(name);
        const ve = virtualStickyElementToProps(headerCellVE[i][j]);
        const classes = [...HEADER_CELL_BASE_CLASSES, ...columnClasses(name), ...ve.classes];
        const style = mergeStyle(ve.style, justifyStyle(col?.justify));
        // Upstream's `mat-sort-header` and `mat-header-cell` are two
        // directives on the SAME <th> — <MatSortHeader> must BE this
        // header cell (merged classes/role/style), not nested inside a
        // separately-generated one. See mat-table-types.ts's
        // `sortHeader` doc comment.
        if (col?.sortHeader) {
          const sortId =
            (typeof col.sortHeader === 'object' ? col.sortHeader.id : undefined) ?? name;
          return (
            <MatSortHeader key={name} id={sortId} class={classes} role="columnheader" style={style}>
              {col.header ?? null}
            </MatSortHeader>
          );
        }
        return renderCell({
          kind: 'header',
          isNative,
          key: name,
          classes,
          style,
          content: col?.header ?? null,
          ariaLabel: col?.headerAriaLabel,
        });
      }),
    }),
  );

  const dataRowsJSX = props.rows.map((row, r) =>
    renderRow({
      kind: 'data',
      isNative,
      key: row.key ?? r,
      classes: [...DATA_ROW_BASE_CLASSES],
      style: undefined,
      cells: dataColumns.map((name, j) => {
        const col = columnsByName.get(name);
        const ve = virtualStickyElementToProps(dataCellVE[r][j]);
        return renderCell({
          kind: 'data',
          isNative,
          key: name,
          classes: [...DATA_CELL_BASE_CLASSES, ...columnClasses(name), ...ve.classes],
          style: mergeStyle(ve.style, justifyStyle(col?.justify)),
          content: row.cells[name] ?? null,
        });
      }),
    }),
  );

  const footerRowsJSX = footerRowDefs.map((def, i) =>
    renderRow({
      kind: 'footer',
      isNative,
      key: `f${i}`,
      classes: [...FOOTER_ROW_BASE_CLASSES, ...virtualStickyElementToProps(footerRowVE[i]).classes],
      style: virtualStickyElementToProps(footerRowVE[i]).style,
      cells: def.columns.map((name, j) => {
        const col = columnsByName.get(name);
        const ve = virtualStickyElementToProps(footerCellVE[i][j]);
        return renderCell({
          kind: 'footer',
          isNative,
          key: name,
          classes: [...FOOTER_CELL_BASE_CLASSES, ...columnClasses(name), ...ve.classes],
          style: mergeStyle(ve.style, justifyStyle(col?.justify)),
          content: col?.footer ?? null,
        });
      }),
    }),
  );

  const noDataRowJSX =
    props.rows.length === 0 && props.noData ? renderNoDataRow(props.noData, dataColumns) : null;

  const tfootProps = virtualStickyElementToProps(tfootVE);

  const tableClasses: string[] = [
    ...TABLE_BASE_CLASSES,
    ...(props.fixedLayout ? ['mat-table-fixed-layout'] : []),
    ...(props.sort ? ['mat-sort'] : []),
    ...(props.class ? (Array.isArray(props.class) ? props.class : [props.class]) : []),
  ];

  if (isNative) {
    return (
      <table id={props.id} role="table" class={tableClasses}>
        <thead role="rowgroup" style={headerRowDefs.length ? undefined : {display: 'none'}}>
          {headerRowsJSX}
        </thead>
        <tbody role="rowgroup" class="mdc-data-table__content">
          {dataRowsJSX}
          {noDataRowJSX}
        </tbody>
        <tfoot
          role="rowgroup"
          class={tfootProps.classes}
          style={mergeStyle(footerRowDefs.length ? undefined : {display: 'none'}, tfootProps.style)}
        >
          {footerRowsJSX}
        </tfoot>
      </table>
    );
  }

  return (
    <mat-table id={props.id} role="table" class={tableClasses}>
      {headerRowsJSX}
      {dataRowsJSX}
      {noDataRowJSX}
      {footerRowsJSX}
    </mat-table>
  );
});
