import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatTable,
  type MatColumnDef,
  type MatTableRow,
} from '@angular-community/qwik-material/table';
import type {Sort} from '@angular-community/qwik-material/sort';
import './table-sorting-example.css';

// Qwik port of material.angular.dev's `table-sorting` docs example. Rendered unmodified by the
// Angular dev-app at /qwik-parity/examples/table-sorting. Referenced from both table.md's
// "Sorting" section and sort.md's "Using sort with the mat-table" section.
//
// Upstream's LiveAnnouncer announcement isn't reproduced here: its text lands outside this
// example's own parity root and the harness already normalizes that element regardless of
// content, so it's inert for DOM parity.
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
  {name: 'position', header: 'No.', sortHeader: true},
  {name: 'name', header: 'Name', sortHeader: true},
  {name: 'weight', header: 'Weight', sortHeader: true},
  {name: 'symbol', header: 'Symbol', sortHeader: true},
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
  const data = useSignal<PeriodicElement[]>(ELEMENT_DATA);

  const onSortChange$ = $((sort: Sort) => {
    const next = [...ELEMENT_DATA];
    if (!sort.active || sort.direction === '') {
      data.value = next;
      return;
    }
    const dir = sort.direction === 'asc' ? 1 : -1;
    next.sort((a, b) => {
      const av = a[sort.active as keyof PeriodicElement];
      const bv = b[sort.active as keyof PeriodicElement];
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    data.value = next;
  });

  return (
    <table-sorting-example>
      <MatTable
        columns={columns}
        rows={toRows(data.value)}
        displayedColumns={displayedColumns}
        sort={{onSortChange$}}
        class="mat-elevation-z8"
      />
    </table-sorting-example>
  );
});
