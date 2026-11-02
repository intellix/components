import {component$} from '@qwik.dev/core';
import {MatTable, type MatColumnDef, type MatTableRow} from '@angular-community/qwik-material/table';
import {MatIcon} from '@angular-community/qwik-material/icon';
import './table-sticky-columns-example.css';

// Qwik port of material.angular.dev's `table-sticky-columns` docs example. Rendered unmodified
// by the Angular dev-app at /qwik-parity/examples/table-sticky-columns. `displayedColumns`
// repeats `position`/`weight`/`symbol` to make the table wide enough to need horizontal
// scrolling (upstream's own technique for demonstrating sticky columns meaningfully) — each
// repeated name just looks up the SAME column definition again per occurrence.
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

const displayedColumns = [
  'name',
  'position',
  'weight',
  'symbol',
  'position',
  'weight',
  'symbol',
  'star',
];
const columns: MatColumnDef[] = [
  {name: 'name', header: ' Name ', sticky: true},
  {name: 'position', header: ' No. '},
  {name: 'weight', header: ' Weight '},
  {name: 'symbol', header: ' Symbol '},
  {name: 'star', header: ' \u00a0 ', headerAriaLabel: 'row actions', stickyEnd: true},
];
const rows: MatTableRow[] = ELEMENT_DATA.map(el => ({
  key: el.position,
  cells: {
    name: ` ${el.name} `,
    position: ` ${el.position} `,
    weight: ` ${el.weight} `,
    symbol: ` ${el.symbol} `,
    star: (
      <>
        {' '}
        <MatIcon>more_vert</MatIcon>{' '}
      </>
    ),
  },
}));

export default component$(() => (
  <table-sticky-columns-example>
    <section class="example-container mat-elevation-z8" tabIndex={0}>
      <MatTable columns={columns} rows={rows} displayedColumns={displayedColumns} />
    </section>
  </table-sticky-columns-example>
));
