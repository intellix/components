import {$, component$, useSignal} from '@qwik.dev/core';
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
// Deterministic (NOT upstream's Math.random()) fixed 2-element pool, so the
// resulting DOM is reproducible — matches angular-parity.spec.ts's
// documented contract for this scenario exactly.
const EXTRA: PeriodicElement[] = [
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
];

const displayedColumns = ['position', 'name', 'weight', 'symbol'];
const columns: MatColumnDef[] = [
  {name: 'position', header: 'No.'},
  {name: 'name', header: 'Name'},
  {name: 'weight', header: 'Weight'},
  {name: 'symbol', header: 'Symbol'},
];

function toRows(data: readonly PeriodicElement[]): MatTableRow[] {
  return data.map(el => ({
    key: el.position,
    cells: {position: el.position, name: el.name, weight: el.weight, symbol: el.symbol},
  }));
}

export default component$(() => {
  const data = useSignal<PeriodicElement[]>([...ELEMENTS]);
  const addedCount = useSignal(0);

  const addRow$ = $(() => {
    const next = EXTRA[addedCount.value % EXTRA.length];
    addedCount.value++;
    // Immutable append — Qwik's own idiomatic way to trigger a reactive
    // re-render of <MatTable>'s `rows` prop (no ViewChild-equivalent
    // `table.renderRows()` escape hatch in this port; see SYNC.md).
    data.value = [...data.value, next];
  });
  const removeRow$ = $(() => {
    data.value = data.value.slice(0, -1);
  });

  return (
    <>
      <div data-parity-root>
        <button type="button" onClick$={addRow$}>
          Add row
        </button>
        <button type="button" disabled={!data.value.length} onClick$={removeRow$}>
          Remove row
        </button>
        <MatTable columns={columns} rows={toRows(data.value)} displayedColumns={displayedColumns} />
        <p>Rows: {data.value.length}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
