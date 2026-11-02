import {component$} from '@qwik.dev/core';
import {MatTable, type MatColumnDef, type MatTableRow} from '@angular-community/qwik-material/table';

// Qwik port of material.angular.dev's `table-footer-row` docs example — see
// src/components-examples/material/table/table-footer-row/table-footer-row-example.{ts,html}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/table-footer-row. The
// `currency` pipe becomes `Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'})`.
interface Transaction {
  item: string;
  cost: number;
}

const TRANSACTIONS: Transaction[] = [
  {item: 'Beach ball', cost: 4},
  {item: 'Towel', cost: 5},
  {item: 'Frisbee', cost: 2},
  {item: 'Sunscreen', cost: 4},
  {item: 'Cooler', cost: 25},
  {item: 'Swim suit', cost: 15},
];

const currency = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'});
const totalCost = TRANSACTIONS.reduce((acc, t) => acc + t.cost, 0);

const displayedColumns = ['item', 'cost'];
const columns: MatColumnDef[] = [
  {name: 'item', header: ' Item ', footer: ' Total '},
  {name: 'cost', header: ' Cost ', footer: ` ${currency.format(totalCost)} `},
];
const rows: MatTableRow[] = TRANSACTIONS.map((t, i) => ({
  key: i,
  cells: {item: ` ${t.item} `, cost: ` ${currency.format(t.cost)} `},
}));

export default component$(() => (
  <table-footer-row-example>
    <MatTable
      columns={columns}
      rows={rows}
      displayedColumns={displayedColumns}
      footerRows={[{columns: displayedColumns}]}
      class="mat-elevation-z8"
    />
  </table-footer-row-example>
));
