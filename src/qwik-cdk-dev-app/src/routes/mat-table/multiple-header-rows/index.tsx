import {component$} from '@builder.io/qwik';
import {
  MatTable,
  type MatColumnDef,
  type MatTableRow,
} from '@angular-community/qwik-material/table';

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
const columns: MatColumnDef[] = [
  {name: 'position', header: 'No.'},
  {name: 'name', header: 'Name'},
  {name: 'weight', header: 'Weight'},
  {name: 'symbol', header: 'Symbol'},
  {name: 'basic-info', header: 'Basic Info'},
  {name: 'measurement-info', header: 'Measurement'},
];
const rows: MatTableRow[] = ELEMENTS.map(el => ({
  key: el.position,
  cells: {position: el.position, name: el.name, weight: el.weight, symbol: el.symbol},
}));

export default component$(() => (
  <>
    <div data-parity-root>
      {/* Declaration order matters: the group row renders FIRST, the normal
          4-column row SECOND, matching the Angular mirror's <tr> order. */}
      <MatTable
        columns={columns}
        rows={rows}
        displayedColumns={displayedColumns}
        headerRows={[{columns: ['basic-info', 'measurement-info']}, {columns: displayedColumns}]}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
