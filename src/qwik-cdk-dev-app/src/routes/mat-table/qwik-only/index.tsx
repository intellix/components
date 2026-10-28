import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatTable,
  matTextColumn,
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
];

/**
 * Qwik-only scenarios — behaviour `angular-parity.spec.ts` doesn't exercise
 * (no mat-table parity scenario drives any of these three things):
 *
 * - A STICKY footer row (`footerRows[].sticky: true`) — every
 *   Angular-mirrored scenario either has no footer row at all (exercising
 *   the "vacuous all-sticky" tfoot quirk) or one NON-sticky footer row
 *   (exercising the quirk's removal). Neither exercises
 *   `StickyStyler.stickRows`'s actual bottom-offset/border-class logic on a
 *   real sticky footer, nor `updateStickyFooterContainer`'s "all sticky,
 *   non-vacuously" branch together with per-cell bottom positioning.
 * - `matTextColumn()`'s header/justify/footer OVERRIDES — the Angular
 *   `text-column` scenario only exercises the auto-generated DEFAULTS.
 * - Removing rows down to zero reactively (CLIENT-side, post-SSR) with a
 *   `noData` row configured — the `no-data-row` parity scenario starts
 *   (and stays) empty; `data-change` never configures `noData`. This is
 *   the one path that specifically exercises `<MatTable>`'s no-data
 *   branch re-evaluating after resume, not just at first render.
 */
const Scenario = component$(() => {
  const data = useSignal<PeriodicElement[]>(ELEMENTS);
  const toRows = (items: readonly PeriodicElement[]): MatTableRow[] =>
    items.map(el => ({
      key: el.position,
      cells: {position: el.position, name: el.name, weight: el.weight, symbol: el.symbol},
    }));

  const removeAll$ = $(() => {
    data.value = [];
  });
  const restore$ = $(() => {
    data.value = ELEMENTS;
  });

  const stickyFooterColumns: MatColumnDef[] = [
    {name: 'position', header: 'No.', footer: ''},
    {name: 'name', header: 'Name', footer: 'Total'},
  ];
  const stickyFooterRows = toRows(ELEMENTS);

  const textColumnOverrides = [
    matTextColumn('name', {header: 'Element Name', justify: 'end'}),
    matTextColumn('weight', {justify: 'center', footer: 'Σ'}),
  ];

  return (
    <div data-parity-root>
      <div class="sticky-footer-section" style="height: 120px; width: 300px; overflow: auto">
        <MatTable
          class="sticky-footer-table"
          columns={stickyFooterColumns}
          rows={stickyFooterRows}
          displayedColumns={['position', 'name']}
          footerRows={[{columns: ['position', 'name'], sticky: true}]}
        />
      </div>

      <MatTable
        class="text-column-override-table"
        columns={textColumnOverrides}
        rows={toRows(ELEMENTS)}
        displayedColumns={['name', 'weight']}
        footerRows={[{columns: ['name', 'weight']}]}
      />

      <button type="button" class="remove-all" onClick$={removeAll$}>
        Remove all
      </button>
      <button type="button" class="restore" onClick$={restore$}>
        Restore
      </button>
      <MatTable
        class="reactive-no-data-table"
        columns={[
          {name: 'position', header: 'No.'},
          {name: 'name', header: 'Name'},
        ]}
        rows={toRows(data.value)}
        displayedColumns={['position', 'name']}
        noData={{content: 'No data', colSpan: 2, rowClass: 'mat-row', cellClass: 'mat-cell'}}
      />
    </div>
  );
});

export default component$(() => (
  <>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </>
));
