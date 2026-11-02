import {$, component$, useSignal} from '@qwik.dev/core';
import {MatTable, type MatColumnDef, type MatTableRow} from '@angular-community/qwik-material/table';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

// Qwik port of material.angular.dev's `table-filtering` docs example — see
// src/components-examples/material/table/table-filtering/table-filtering-example.{ts,html,css}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/table-filtering.
// `MatTableDataSource.filter`'s default reduce-and-substring-match becomes plain consumer-side
// filtering (this port has no `MatTableDataSource` — see table/SYNC.md's "Removed upstream files").
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
  {name: 'position', header: ' No. '},
  {name: 'name', header: ' Name '},
  {name: 'weight', header: ' Weight '},
  {name: 'symbol', header: ' Symbol '},
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

function reduceRow(el: PeriodicElement): string {
  return `${el.position}${el.name}${el.weight}${el.symbol}`.toLowerCase();
}

export default component$(() => {
  const filterValue = useSignal('');

  const filtered = ELEMENT_DATA.filter(el =>
    reduceRow(el).includes(filterValue.value.trim().toLowerCase()),
  );

  return (
    <table-filtering-example>
      <MatFormField
        label={<MatLabel>Filter</MatLabel>}
        control={
          <MatInput
            placeholder="Ex. ium"
            value={filterValue.value}
            onInput$={(_, el) => {
              filterValue.value = el.value;
            }}
          />
        }
      />

      <MatTable
        columns={columns}
        rows={toRows(filtered)}
        displayedColumns={displayedColumns}
        class="mat-elevation-z8"
        noData={{
          content: `No data matching the filter "${filterValue.value}"`,
          colSpan: displayedColumns.length,
        }}
      />
    </table-filtering-example>
  );
});
