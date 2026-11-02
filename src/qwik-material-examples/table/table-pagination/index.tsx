import {$, component$, useSignal} from '@qwik.dev/core';
import {MatTable, type MatColumnDef, type MatTableRow} from '@angular-community/qwik-material/table';
import {MatPaginator, type PageEvent} from '@angular-community/qwik-material/paginator';

// Qwik port of material.angular.dev's `table-pagination` docs example — see
// src/components-examples/material/table/table-pagination/table-pagination-example.{ts,html,css}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/table-pagination.
// `MatTableDataSource.paginator` wiring becomes plain consumer-side slicing of the data array by
// `pageIndex`/`pageSize` (this port has no `MatTableDataSource` — see table/SYNC.md's "Removed
// upstream files").
interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
  {position: 11, name: 'Sodium', weight: 22.9897, symbol: 'Na'},
  {position: 12, name: 'Magnesium', weight: 24.305, symbol: 'Mg'},
  {position: 13, name: 'Aluminum', weight: 26.9815, symbol: 'Al'},
  {position: 14, name: 'Silicon', weight: 28.0855, symbol: 'Si'},
  {position: 15, name: 'Phosphorus', weight: 30.9738, symbol: 'P'},
  {position: 16, name: 'Sulfur', weight: 32.065, symbol: 'S'},
  {position: 17, name: 'Chlorine', weight: 35.453, symbol: 'Cl'},
  {position: 18, name: 'Argon', weight: 39.948, symbol: 'Ar'},
  {position: 19, name: 'Potassium', weight: 39.0983, symbol: 'K'},
  {position: 20, name: 'Calcium', weight: 40.078, symbol: 'Ca'},
];

const displayedColumns = ['position', 'name', 'weight', 'symbol'];
const columns: MatColumnDef[] = [
  {name: 'position', header: ' No. '},
  {name: 'name', header: ' Name '},
  {name: 'weight', header: ' Weight '},
  {name: 'symbol', header: ' Symbol '},
];

function toRows(data: readonly PeriodicElement[]): MatTableRow[] {
  return data.map(el => ({
    key: el.position,
    cells: {
      position: ` ${el.position} `,
      name: ` ${el.name} `,
      weight: ` ${el.weight} `,
      symbol: ` ${el.symbol} `,
    },
  }));
}

export default component$(() => {
  const pageIndex = useSignal(0);
  const pageSize = useSignal(5);

  const start = pageIndex.value * pageSize.value;
  const pageData = ELEMENT_DATA.slice(start, start + pageSize.value);

  return (
    <table-pagination-example>
      <div class="mat-elevation-z8">
        <MatTable columns={columns} rows={toRows(pageData)} displayedColumns={displayedColumns} />
        <MatPaginator
          length={ELEMENT_DATA.length}
          pageSize={pageSize.value}
          pageSizeOptions={[5, 10, 20]}
          showFirstLastButtons
          aria-label="Select page of periodic elements"
          onPage$={$((e: PageEvent) => {
            pageIndex.value = e.pageIndex;
            pageSize.value = e.pageSize;
          })}
        />
      </div>
    </table-pagination-example>
  );
});
