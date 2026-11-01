import {component$} from '@qwik.dev/core';
import {
  MatTable,
  type MatColumnDef,
  type MatTableRow,
} from '@angular-community/qwik-material/table';

const displayedColumns = ['position', 'name', 'symbol'];
const columns: MatColumnDef[] = [
  {name: 'position', header: 'No.'},
  {name: 'name', header: 'Name'},
  {name: 'symbol', header: 'Symbol'},
];
// Empty data source — matches TableNoDataRow's `dataSource: PeriodicElement[] = []`.
const rows: MatTableRow[] = [];

export default component$(() => (
  <>
    <div data-parity-root>
      <MatTable
        columns={columns}
        rows={rows}
        displayedColumns={displayedColumns}
        noData={{
          // Consumer's OWN literal CSS classes (matching upstream's
          // table-overview-example convention) — MatTable merges its own
          // generated cdk-no-data-row/mat-mdc-no-data-row/etc. on top.
          rowClass: 'mat-row',
          cellClass: 'mat-cell',
          colSpan: 3,
          content: 'No data',
        }}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
