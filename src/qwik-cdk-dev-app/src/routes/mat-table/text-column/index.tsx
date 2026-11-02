import {component$} from '@qwik.dev/core';
import {MatTable, matTextColumn, type MatTableRow} from '@angular-community/qwik-material/table';

interface PeriodicElement {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

const ELEMENTS: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
];

const displayedColumns = ['position', 'name', 'weight', 'symbol'];
// Every column is a bare <mat-text-column> upstream (no matColumnDef/cell
// templates authored at all) — matTextColumn() generates the
// auto-capitalized header + text-align:start styling; cell values are the
// row's own field values, same as `CdkTextColumn`'s default
// `dataAccessor: (data, name) => data[name]`.
const columns = [
  matTextColumn('position'),
  matTextColumn('name'),
  matTextColumn('weight'),
  matTextColumn('symbol'),
];
const rows: MatTableRow[] = ELEMENTS.map(el => ({
  key: el.position,
  cells: {position: el.position, name: el.name, weight: el.weight, symbol: el.symbol},
}));

export default component$(() => (
  <>
    <div data-parity-root>
      <MatTable columns={columns} rows={rows} displayedColumns={displayedColumns} />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
