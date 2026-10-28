import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatTable,
  type MatColumnDef,
  type MatTableRow,
} from '@angular-community/qwik-material/table';
import type {Sort} from '@angular-community/qwik-material/sort';

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
  {name: 'position', header: 'No.', sortHeader: true},
  {name: 'name', header: 'Name', sortHeader: true},
  {name: 'weight', header: 'Weight', sortHeader: true},
  {name: 'symbol', header: 'Symbol', sortHeader: true},
];

function toRows(data: readonly PeriodicElement[]): MatTableRow[] {
  return data.map(el => ({
    key: el.position,
    cells: {position: el.position, name: el.name, weight: el.weight, symbol: el.symbol},
  }));
}

export default component$(() => {
  const data = useSignal<PeriodicElement[]>(ELEMENTS);
  const sortState = useSignal<Sort>({active: '', direction: ''});

  const onSortChange$ = $((sort: Sort) => {
    sortState.value = sort;
    const next = [...ELEMENTS];
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
    <>
      <div data-parity-root>
        <MatTable
          columns={columns}
          rows={toRows(data.value)}
          displayedColumns={displayedColumns}
          sort={{onSortChange$}}
        />
        <p>
          Sort: {sortState.value.active} {sortState.value.direction}
        </p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
