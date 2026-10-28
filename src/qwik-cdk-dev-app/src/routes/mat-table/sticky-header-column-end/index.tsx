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

// name, position, weight, actions — matches the Angular mirror scenario's
// column order exactly (src/dev-app/qwik-parity/table.ts's
// TableStickyHeaderColumnEnd).
const displayedColumns = ['name', 'position', 'weight', 'actions'];
const columns: MatColumnDef[] = [
  {name: 'name', header: 'Name', sticky: true},
  {name: 'position', header: 'No.'},
  {name: 'weight', header: 'Weight'},
  {name: 'actions', header: 'Actions', headerAriaLabel: 'row actions', stickyEnd: true},
];
const rows: MatTableRow[] = ELEMENTS.map(el => ({
  key: el.position,
  cells: {
    name: el.name,
    position: el.position,
    weight: el.weight,
    // Static "View" action text for every row — not data-bound, mirroring
    // upstream's stand-in for a <mat-icon> action column.
    actions: 'View',
  },
}));

export default component$(() => (
  <>
    <div data-parity-root>
      <div style="height: 140px; width: 420px; overflow: auto">
        <MatTable
          columns={columns}
          rows={rows}
          displayedColumns={displayedColumns}
          headerRows={[{columns: displayedColumns, sticky: true}]}
        />
      </div>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
