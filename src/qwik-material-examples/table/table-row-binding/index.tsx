import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatTable, type MatColumnDef, type MatTableRow} from '@angular-community/qwik-material/table';
import styles from './table-row-binding-example.css?inline';

// Qwik port of material.angular.dev's `table-row-binding` docs example — see
// src/components-examples/material/table/table-row-binding/table-row-binding-example.{ts,html}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/table-row-binding.
//
// Demonstrates `MatTableRow.onClick$`/`.class` — the migration mapping of upstream's
// `(click)="clickedRows.add(row)"` / `[class.demo-row-is-clicked]="clickedRows.has(row)"` on
// `<tr mat-row>`. `clickedRows` is a plain array of clicked indices here (not a `Set` — avoids
// any question of `Set` SSR-serialization; order of first click is all `track clickedRow` needs
// upstream anyway, which a plain array preserves identically).

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

const displayedColumns = ['position', 'name', 'weight', 'symbol'];
const columns: MatColumnDef[] = [
  {name: 'position', header: 'No.'},
  {name: 'name', header: 'Name'},
  {name: 'weight', header: 'Weight'},
  {name: 'symbol', header: 'Symbol'},
];

export default component$(() => {
  useStyles$(styles);
  const clickedRows = useSignal<number[]>([]);

  const rows: MatTableRow[] = ELEMENT_DATA.map((element, i) => ({
    key: i,
    cells: {
      position: element.position,
      name: element.name,
      weight: element.weight,
      symbol: element.symbol,
    },
    class: clickedRows.value.includes(i) ? 'demo-row-is-clicked' : undefined,
    onClick$: $(() => {
      if (!clickedRows.value.includes(i)) {
        clickedRows.value = [...clickedRows.value, i];
      }
    }),
  }));

  return (
    <table-row-binding-example>
      <MatTable
        columns={columns}
        rows={rows}
        displayedColumns={displayedColumns}
        class="mat-elevation-z8 demo-table"
      />

      <div>
        <h3>Click Log</h3>
      </div>

      {clickedRows.value.length === 0 && <div>Clicked rows will be logged here</div>}

      <ul>
        {clickedRows.value.map(i => (
          <li key={i}>Clicked on {ELEMENT_DATA[i].name}</li>
        ))}
      </ul>
    </table-row-binding-example>
  );
});
