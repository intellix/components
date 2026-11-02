import {component$} from '@qwik.dev/core';
import {MatTable, type MatColumnDef, type MatTableRow} from '@angular-community/qwik-material/table';
import './table-column-styling-example.css';

// Qwik port of material.angular.dev's `table-column-styling` docs example. Rendered unmodified
// by the Angular dev-app at /qwik-parity/examples/table-column-styling.
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
];

const displayedColumns = ['demo-position', 'demo-name', 'demo-weight', 'demo-symbol'];
const columns: MatColumnDef[] = [
  {name: 'demo-position', header: ' No. '},
  {name: 'demo-name', header: ' Name '},
  {name: 'demo-weight', header: ' Weight '},
  {name: 'demo-symbol', header: ' Symbol '},
];
const rows: MatTableRow[] = ELEMENT_DATA.map(el => ({
  key: el.position,
  cells: {
    'demo-position': ` ${el.position} `,
    'demo-name': ` ${el.name} `,
    'demo-weight': ` ${el.weight} `,
    'demo-symbol': ` ${el.symbol} `,
  },
}));

export default component$(() => (
  <table-column-styling-example>
    <MatTable
      columns={columns}
      rows={rows}
      displayedColumns={displayedColumns}
      class="mat-elevation-z8 demo-table"
    />
  </table-column-styling-example>
));
