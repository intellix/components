/**
 * MatTable scenario port from src/material/table/table.spec.ts +
 * src/cdk/table/table.spec.ts.
 *
 * `createDOM()` hangs this package's vitest worker (see mat-button's own
 * scenario-port comment for the same finding across every qwik-material
 * entry point), so no DOM-render tests are attempted here. The pure
 * algorithms this port extracted while building `MatTable` (sticky
 * position/z-index math, column-CSS-class naming, text-column defaults,
 * row-def matching) are instead fully covered, DOM-free, in
 * qwik-cdk/table's own spec files (sticky-styler.spec.ts,
 * column-css.spec.ts, text-column-defaults.spec.ts, row-defs.spec.ts).
 *
 *   - Live sanity tests below: typeof + prop/column/row shape.
 *   - describe.skip DOM-rendered: every behavior that needs a real DOM
 *     (thead/tbody/tfoot visibility, sticky classes/styles landing on the
 *     right elements, no-data-row class mutation, matSort integration).
 *     Covered by specs/material-table/angular-parity.spec.ts (the
 *     authoritative Angular-vs-Qwik DOM parity gate) and the Qwik-only
 *     specs in src/qwik-cdk-parity-tests/specs/material-table/*.spec.ts.
 */
import {describe, expect, it} from 'vitest';
import {MatTable, matTextColumn} from './public-api';
import type {
  MatColumnDef,
  MatNoDataRowDef,
  MatTableProps,
  MatTableRow,
  MatTableRowGroupDef,
  MatTableSortConfig,
} from './public-api';

describe('MatTable surface — sanity', () => {
  it('MatTable is exported and is a function-shaped component', () => {
    expect(typeof MatTable).toBe('function');
  });

  it('matTextColumn is exported and is a plain function (not a component)', () => {
    expect(typeof matTextColumn).toBe('function');
  });

  it('MatColumnDef accepts name/header/footer/sticky/stickyEnd/justify', () => {
    const col: MatColumnDef = {
      name: 'position',
      header: 'No.',
      footer: 'Total',
      sticky: true,
      stickyEnd: false,
      justify: 'start',
    };
    expect(col.name).toBe('position');
  });

  it('MatTableRow accepts a key + cells record', () => {
    const row: MatTableRow = {key: 1, cells: {position: 1, name: 'Hydrogen'}};
    expect(row.cells['name']).toBe('Hydrogen');
  });

  it('MatTableRowGroupDef accepts columns + sticky', () => {
    const def: MatTableRowGroupDef = {columns: ['position', 'name'], sticky: true};
    expect(def.columns).toEqual(['position', 'name']);
  });

  it('MatNoDataRowDef accepts content/rowClass/cellClass/colSpan', () => {
    const noData: MatNoDataRowDef = {
      content: 'No data',
      rowClass: 'mat-row',
      cellClass: 'mat-cell',
      colSpan: 3,
    };
    expect(noData.colSpan).toBe(3);
  });

  it('MatTableSortConfig accepts the full matSort surface', () => {
    const sort: MatTableSortConfig = {
      active: 'name',
      start: 'asc',
      direction: 'desc',
      disableClear: true,
      disabled: false,
      onSortChange$: undefined,
    };
    expect(sort.active).toBe('name');
  });

  it('MatTableProps accepts the full mirrored surface', () => {
    const props: MatTableProps = {
      as: 'table',
      columns: [{name: 'position', header: 'No.'}],
      rows: [{cells: {position: 1}}],
      displayedColumns: ['position'],
      headerRows: [{columns: ['position']}],
      footerRows: [],
      fixedLayout: false,
      id: 'my-table',
      class: 'my-class',
    };
    expect(props.displayedColumns).toEqual(['position']);
  });

  it('matTextColumn defaults header to the capitalized column name + justify "start"', () => {
    const col = matTextColumn('position');
    expect(col.name).toBe('position');
    expect(col.header).toBe('Position');
    expect(col.justify).toBe('start');
  });

  it('matTextColumn accepts an explicit header/justify/footer override', () => {
    const col = matTextColumn('weight', {header: 'Mass', justify: 'end', footer: 'Total'});
    expect(col.header).toBe('Mass');
    expect(col.justify).toBe('end');
    expect(col.footer).toBe('Total');
  });
});

describe.skip('MatTable DOM-rendered scenarios — verified via Playwright', () => {
  it('native <table mat-table> renders <thead>/<tbody class="mdc-data-table__content">/<tfoot>, all with role="rowgroup"', () => {});
  it('the flex <mat-table> form has no thead/tbody/tfoot wrapper — rows are direct children in declaration order', () => {});
  it('every header/data/footer cell carries cdk-column-<name> + mat-column-<name>', () => {});
  it('<thead> gets display:none with zero header rows; <tfoot> gets display:none with zero footer rows AND the always-sticky Safari quirk (vacuous truth)', () => {});
  it('a real (non-sticky) footer row clears the tfoot always-sticky quirk entirely', () => {});
  it('sticky header row sticks every cell in that row at top:0 with the border-top class; sticky-start/end columns combine zIndex 100+1=101', () => {});
  it("matNoDataRow renders inside <tbody>, merging cdk-no-data-row/mat-mdc-no-data-row/etc. onto the consumer's own row/cell classes", () => {});
  it("props.sort provides MAT_SORT_STATE + adds the mat-sort class, so a <MatSortHeader> placed in a column's header integrates with sort", () => {});
  it('multiple header row defs render in the given array order inside one shared <thead>', () => {});
});
