import {$, component$, useSignal} from '@qwik.dev/core';
import {MatTable, type MatColumnDef, type MatTableRow} from '@angular-community/qwik-material/table';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

// Qwik port of material.angular.dev's `table-selection` docs example — see
// src/components-examples/material/table/table-selection/table-selection-example.{ts,html,css}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/table-selection.
// `SelectionModel` becomes a plain `Set<number>` signal; each checkbox's `(change)`/`(click)`
// handlers are reproduced on `<MatCheckbox>` directly (it's a JSXOutput cell value, same as
// every other per-row content in this port's table API).
//
// Upstream's row ALSO carries `(click)="selection.toggle(row)"` on the `<tr mat-row>` itself
// (click anywhere on the row, not just the checkbox, toggles selection) — `MatTableRow` has no
// per-row click handler (table/SYNC.md: rows are plain data, not components), so that convenience
// isn't reproduced; the checkbox's own click/change handlers (the primary, documented
// interaction) are.
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

const displayedColumns = ['select', 'position', 'name', 'weight', 'symbol'];

export default component$(() => {
  const selected = useSignal<ReadonlySet<number>>(new Set());

  const isAllSelected = selected.value.size === ELEMENT_DATA.length;

  const toggleAll$ = $(() => {
    selected.value = isAllSelected ? new Set() : new Set(ELEMENT_DATA.map(el => el.position));
  });
  const toggleRow = (position: number) =>
    $(() => {
      const next = new Set(selected.value);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      selected.value = next;
    });

  const columns: MatColumnDef[] = [
    {
      name: 'select',
      header: (
        <MatCheckbox
          checked={selected.value.size > 0 && isAllSelected}
          indeterminate={selected.value.size > 0 && !isAllSelected}
          aria-label={`${isAllSelected ? 'deselect' : 'select'} all`}
          onChange$={toggleAll$}
        />
      ),
    },
    {name: 'position', header: ' No. '},
    {name: 'name', header: ' Name '},
    {name: 'weight', header: ' Weight '},
    {name: 'symbol', header: ' Symbol '},
  ];

  const rows: MatTableRow[] = ELEMENT_DATA.map(el => ({
    key: el.position,
    cells: {
      select: (
        <MatCheckbox
          checked={selected.value.has(el.position)}
          aria-label={`${selected.value.has(el.position) ? 'deselect' : 'select'} row ${el.position + 1}`}
          onChange$={toggleRow(el.position)}
        />
      ),
      position: ` ${el.position} `,
      name: ` ${el.name} `,
      weight: ` ${el.weight} `,
      symbol: ` ${el.symbol} `,
    },
  }));

  return (
    <table-selection-example>
      <MatTable
        columns={columns}
        rows={rows}
        displayedColumns={displayedColumns}
        class="mat-elevation-z8"
      />
    </table-selection-example>
  );
});
