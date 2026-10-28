import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-table (native `<table mat-table>` and flex `<mat-table>`, plus `mat-header/footer/row`,
 * `mat-header/footer/cell`, `matColumnDef`, `mat-text-column`, `matNoDataRow`, and `matSort`
 * integration) — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/table.ts (exports
 * `TABLE_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-table/<scenario>). The Qwik
 * side must render the same markup at http://localhost:4173/mat-table/<scenario>/ inside its own
 * `[data-parity-root]`. Table is NOT ported yet — this file (and table.ts) only establish the
 * Angular-side DOM contract a future qwik-cdk/table port must match.
 *
 * All 4-row/4-column scenarios share one dataset (table.ts's `ELEMENTS`):
 *   {position:1,name:'Hydrogen',weight:1.0079,symbol:'H'}, {2,'Helium',4.0026,'He'},
 *   {3,'Lithium',6.941,'Li'}, {4,'Beryllium',9.0122,'Be'}.
 *
 * ============================ VERIFIED LIVE (http://localhost:4200/qwik-parity/mat-table/<scenario>,
 * Chromium) — read this before writing the Qwik route. Every claim below was confirmed by
 * dumping `[data-parity-root]`'s `outerHTML` (and, for interactive scenarios, re-running the full
 * click sequence twice) — not inferred from source alone. ============================
 *
 * ---- 1. Base class merging (CDK + Material; applies to EVERY scenario) ----
 * `MatTable`/`MatHeaderRow`/`MatRow`/`MatFooterRow`/`MatHeaderCell`/`MatCell`/`MatFooterCell` each
 * extend a `Cdk*` base class with its OWN `host: {'class': '...'}` binding. Angular does not
 * replace the base class's static host class when a subclass declares its own — it CONCATENATES
 * them. So every element below carries BOTH the `mat-mdc-*`/`mdc-data-table__*` class(es) AND the
 * matching bare `cdk-*` class, e.g. the table itself is
 * `class="mat-mdc-table mdc-data-table__table cdk-table"` (never just the `mat-mdc-*` ones). This
 * is listed once here and only the delta is called out per-element below. Full base set per
 * element (order doesn't matter — the harness sorts classes alphabetically before comparing):
 *   - `<table mat-table>` / `<mat-table>`: `mat-mdc-table mdc-data-table__table cdk-table`
 *   - header row: `mat-mdc-header-row mdc-data-table__header-row cdk-header-row`
 *   - data row: `mat-mdc-row mdc-data-table__row cdk-row`
 *   - footer row: `mat-mdc-footer-row mdc-data-table__row cdk-footer-row`
 *   - header cell: `mat-mdc-header-cell mdc-data-table__header-cell cdk-header-cell` + the two
 *     column classes below
 *   - data cell: `mat-mdc-cell mdc-data-table__cell cdk-cell` + the two column classes below
 *   - footer cell: `mat-mdc-footer-cell mdc-data-table__cell cdk-footer-cell` + the two column
 *     classes below
 * Every header/data/footer cell additionally carries TWO column classes:
 * `cdk-column-<name> mat-column-<name>` (`MatColumnDef` pushes the `mat-column-` one onto the
 * base `CdkColumnDef`'s `cdk-column-` one — same concat pattern). `<name>` is the column's
 * `matColumnDef` value verbatim (hyphens survive; confirmed with `basic-info`/`measurement-info`).
 *
 * ---- 2. `role` attributes (every scenario, native AND flex form alike) ----
 * - The table itself always gets `role="table"` as a literal ATTRIBUTE (not just an ARIA default)
 *   — `CdkTable`'s constructor sets it via `setAttribute` whenever no `role` was already present,
 *   unconditionally, on BOTH the native `<table>` and the flex `<mat-table>` element.
 * - Header/data/footer rows always get `role="row"` (static host binding on
 *   `Cdk/MatHeaderRow`/`Row`/`FooterRow`).
 * - Header cells always get `role="columnheader"` (static host binding).
 * - Data cells and footer cells always get `role="cell"` — NOT a static binding, set imperatively
 *   in the `CdkCell`/`CdkFooterCell` constructor via `_getCellRole()`, which returns `'cell'`
 *   unless the table's OWN `role` is `"grid"`/`"treegrid"` (never the case here, since the table
 *   always ends up with `role="table"` per the point above). This applies even though a native
 *   `<td>` already has an implicit cell role — Material sets it explicitly regardless.
 * - Native-only: `<thead>`, `<tbody>`, `<tfoot>` each get `role="rowgroup"`.
 *
 * ---- 3. Native-table wrapper structure (`<table mat-table>` only; NOT present on the flex
 *      `<mat-table>` form) ----
 * `MatTable`'s own template unconditionally renders, for a native `<table>`:
 *   <thead role="rowgroup">...header rows...</thead>
 *   <tbody role="rowgroup" class="mdc-data-table__content">...data rows + no-data row...</tbody>
 *   <tfoot role="rowgroup" [style...]>...footer rows...</tfoot>
 * ALL THREE always exist, even when a given scenario has zero header or footer row defs — they
 * are never omitted, only hidden (see point 4). The flex `<mat-table>` form has NONE of
 * `<thead>`/`<tbody>`/`<tfoot>` — header/data/footer rows are direct children of `<mat-table>` in
 * declaration order, with no wrapper element at all.
 *
 * ---- 4. `<thead>`/`<tfoot>` visibility + the "always-sticky tfoot" quirk (native table only) ----
 * - `<thead>` gets inline `style="display: none"` if-and-only-if there are zero rendered header
 *   rows. None of the scenarios below hit this (every one has at least one header row), but a
 *   future Qwik route with NO header row def must reproduce it.
 * - `<tfoot>` gets inline `display: none` if-and-only-if there are zero rendered footer rows. EVERY
 *   scenario below except `footer-row` has zero footer rows, so EVERY other scenario's `<tfoot>`
 *   carries `style="display: none; ...`.
 * - NON-OBVIOUS: regardless of the above, `<tfoot>` ALSO unconditionally gets the class
 *   `mat-mdc-table-sticky` plus inline `bottom: 0px; z-index: 10` whenever "all footer rows are
 *   sticky" — and `[].every(...)`-style vacuous truth means an EMPTY footer-row list counts as
 *   "all sticky" (`CdkTable.updateStickyFooterRowStyles` → `StickyStyler.updateStickyFooterContainer`,
 *   a Safari-only workaround that runs unconditionally, sticky footer or not). Confirmed live: a
 *   scenario with NO footer row def at all gets `<tfoot role="rowgroup" class="mat-mdc-table-sticky"
 *   style="display: none; bottom: 0px; z-index: 10;">` — BOTH the hidden style AND the sticky
 *   class/style stack on the same element. The ONE scenario that DOES have a (non-sticky) footer
 *   row (`footer-row`) is the ONLY one where this is absent: one real, non-sticky footer row makes
 *   `stickyStates.some(state => !state)` true, which explicitly clears any sticky styling from
 *   `<tfoot>`, leaving a bare `<tfoot role="rowgroup">` with no class/style at all.
 *
 * ---- 5. Content children never render in place; only manufactured rows/cells appear ----
 * Everything a consumer writes INSIDE `<table mat-table>`/`<mat-table>` — every
 * `<ng-container matColumnDef>`, every `<tr *matHeaderRowDef>`/`*matRowDef`/`*matFooterRowDef`,
 * every `<ng-template matNoDataRow>` (written as `<tr *matNoDataRow>`), and every
 * `<mat-text-column>` — is Angular CONTENT (a content child of the table), and `MatTable`'s own
 * template has NO catch-all `<ng-content/>` on the client (that fallback is `@if (_isServer)`-gated
 * purely to dodge an SSR hydration mismatch; this harness's dev-app is pure CSR, so `_isServer` is
 * always false). Unprojected content that matches no `<ng-content>` selector is simply never
 * inserted into the live DOM — not hidden, not present-but-empty, ABSENT. Confirmed live for
 * `<mat-text-column>` specifically (see point 8): the tag never appears anywhere in the rendered
 * tree, not even as an empty element. The ONLY DOM nodes that end up inside `<table mat-table>`/
 * `<mat-table>` are the `<thead>`/`<tbody>`/`<tfoot>` wrapper (native) or bare rows (flex) that
 * `CdkTable` MANUFACTURES via `ViewContainerRef.createEmbeddedView` from the (invisible) content
 * children's captured `TemplateRef`s. A Qwik port must do the same: compute header/body/footer
 * rows and cells programmatically from column/row definitions, never literally render the
 * authored template markup in place.
 *
 * ---- 6. Selector attributes — NEW entries needed in `CONSUMER_SELECTOR_ATTRS` ----
 * (lib/material-parity.ts; not edited by this change — see report.) The native-table-only element
 * selectors below are NOT currently in that list and WILL fail every native-table scenario's
 * comparison on these attributes alone until added: `mat-table` (on `<table mat-table>`),
 * `mat-header-row`/`mat-row`/`mat-footer-row` (on `<tr mat-header-row>`/`<tr mat-row>`/
 * `<tr mat-footer-row>`), `mat-header-cell`/`mat-cell`/`mat-footer-cell` (on `<th mat-header-cell>`/
 * `<td mat-cell>`/`<td mat-footer-cell>`). These only exist as ATTRIBUTES in the native form —
 * in the flex form the exact same selector matches the TAG NAME instead (`<mat-table>`,
 * `<mat-header-row>`, `<mat-header-cell>`, ...), which is compared as-is (tag names are never
 * filtered) and needs no addition. `matSort`/`mat-sort-header` are already present in the list
 * (added when sort.ts was written) — no further action needed for the `sortable` scenario.
 * `matColumnDef`/`matHeaderCellDef`/`matCellDef`/`matFooterCellDef`/`matHeaderRowDef`/
 * `matRowDef`/`matFooterRowDef`/`matNoDataRow` never need an entry: per point 5 they never survive
 * into the rendered DOM as attributes at all (they're consumed into building the `<ng-template>`
 * that becomes a manufactured row/cell, same as `*ngFor` never leaving an `ngFor` attribute
 * behind).
 *
 * ---- Per-scenario notes ----
 *
 * - **basic**: native `<table mat-table>`, 4 columns (position/name/weight/symbol), 4 data rows,
 *   one header row, no footer row def. `<thead>` visible (has the one header row), `<tbody
 *   class="mdc-data-table__content">` with 4 `<tr mat-row>` rows, `<tfoot>` hidden + "always
 *   sticky" per point 4.
 * - **flex**: identical columns/data, but the flex `<mat-table>` element form — `<mat-header-row>`/
 *   `<mat-row>`/`<mat-header-cell>`/`<mat-cell>` custom-element tags with NO `<thead>`/`<tbody>`/
 *   `<tfoot>` wrapper at all (point 3) and none of the native-only selector-attribute classes;
 *   `role="table"`/`"row"`/`"columnheader"`/`"cell"` still all present (point 2 applies to both
 *   forms identically).
 * - **footer-row**: adds a `<td mat-footer-cell>` to every column and one
 *   `<tr mat-footer-row *matFooterRowDef="displayedColumns">`. Footer cells for `position`/`symbol`
 *   are empty (no interpolation, matching upstream's `table-footer-row-example`); `name`'s reads
 *   "Total"; `weight`'s reads the summed weight ("20.9637", i.e. `1.0079+4.0026+6.941+9.0122`
 *   computed in JS, not hardcoded). `<tfoot>` here is the ONE scenario where the "always sticky"
 *   quirk does NOT apply (point 4) — bare `<tfoot role="rowgroup">`, no class, no style, because a
 *   real non-sticky footer row exists.
 * - **sticky-header-column-end**: native table wrapped in `<div style="height: 140px; width: 420px;
 *   overflow: auto;">` (a fixed-size scroll container — chosen so sticky offsets are deterministic
 *   without depending on font-metric cell widths; see below). Columns in order: `name` (`[sticky]=
 *   "true"`), `position`, `weight`, `actions` (`[stickyEnd]="true"`, a static "View" cell, no data
 *   binding — stands in for upstream's `<mat-icon>` action column without pulling in the icon font).
 *   Header row def has `sticky: true`. Confirmed live, exact classes/styles (no `position` ever
 *   appears inline — `MatTable.needsPositionStickyOnElement = false`, so CSS alone
 *   (`.mat-mdc-table-sticky { position: sticky !important }`) provides it):
 *     - EVERY header `<th>` (not just the sticky-column ones) gets `top: 0px` + class
 *       `mat-mdc-table-sticky mat-mdc-table-sticky-border-elem-top` — sticking a header ROW in the
 *       native form sticks ALL of that row's cells (`StickyStyler.stickRows`'s
 *       `elementsToStick = row.children` for native tables), and this is also the only/bordered
 *       sticky header row so every cell in it gets the top border class.
 *     - `name`'s header `<th>` is ALSO the sticky-START column → zIndex becomes `101` (`100` for
 *       top + `1` for left) and gains `mat-mdc-table-sticky-border-elem-left` too, plus
 *       `left: 0px`. `actions`'s header `<th>` is ALSO the sticky-END column → same `101`, gains
 *       `mat-mdc-table-sticky-border-elem-right` + `right: 0px`.
 *     - `position`/`weight` header `<th>`s: only the top treatment, `z-index: 100`, no left/right.
 *     - Data-row `name` `<td>`: `left: 0px; z-index: 1` + `mat-mdc-table-sticky
 *       mat-mdc-table-sticky-border-elem-left` (no top — data rows aren't part of the sticky
 *       header). Data-row `actions` `<td>`: `right: 0px; z-index: 1` + `...-border-elem-right`.
 *       Data-row `position`/`weight` `<td>`s: completely untouched, no sticky class/style at all.
 *     - Because there is exactly ONE sticky-start and ONE sticky-end column, both offsets are
 *       `0px` regardless of actual cell width (`_getStickyStartColumnPositions`/`...EndColumnPositions`
 *       accumulate PRECEDING sticky columns' widths — with only one on each side there's nothing
 *       to accumulate) — this is what makes the scenario deterministic without needing to pin
 *       column widths; a scenario with two-or-more sticky columns on the same side would need
 *       fixed `width` styles on the cells to get deterministic non-zero offsets.
 *     - `<tfoot>` here still gets the "always sticky" treatment from point 4 (no footer row def).
 * - **text-column**: native table, all 4 columns are bare `<mat-text-column [name]="'...'">` (no
 *   `matColumnDef`/cell templates authored at all). Confirmed live: the `<mat-text-column>` tag
 *   itself is COMPLETELY ABSENT from the rendered DOM (point 5) — `[data-parity-root]` contains
 *   only `<table mat-table>` → `<thead>`/`<tbody>`/`<tfoot>` with manufactured
 *   `<th mat-header-cell>`/`<td mat-cell>` content exactly as if they'd been hand-written.
 *   `headerText` defaults to the column name with its first letter capitalized ("Position", "Name",
 *   "Weight", "Symbol" — `CdkTextColumn._createDefaultHeaderText`); `dataAccessor` defaults to
 *   `data[name]`. Both header and data cells get inline `style="text-align: start;"` (the
 *   `justify` input's default value, bound via `[style.text-align]` in `CdkTextColumn`'s own
 *   template). The literal text nodes have a leading/trailing space (e.g. `" Position "`, `" 1 "`,
 *   from the multi-line template interpolation) but this is irrelevant: the harness's text
 *   extraction already does `.replace(/\s+/g,' ').trim()`, so only "Position"/"1" etc. are ever
 *   actually compared.
 * - **no-data-row**: native table, 3 columns (position/name/symbol, so `colspan="3"`), EMPTY
 *   `dataSource = []`. Written exactly as upstream's own convention: a plain
 *   `<tr class="mat-row" *matNoDataRow><td class="mat-cell" colspan="3">No data</td></tr>` — note
 *   `mat-row`/`mat-cell` here are the consumer's OWN literal CSS classes (matching upstream's
 *   `table-overview-example`), NOT the `mat-row`/`mat-cell` DIRECTIVE SELECTOR (no `tr[mat-row]`
 *   attribute match, since these are class tokens, not attributes) — the no-data `<tr>`/`<td>` are
 *   plain, undecorated elements that `CdkTable._updateNoDataRow` then mutates IMPERATIVELY:
 *     - `<tr>` gets `role="row"` (`setAttribute`, same value as every other row but set a
 *       different way) plus classes appended on top of the consumer's `mat-row`:
 *       `cdk-no-data-row cdk-row` (from base `CdkNoDataRow._contentClassNames`) then
 *       `mat-mdc-no-data-row mat-mdc-row mdc-data-table__row` (from `MatNoDataRow`, pushed onto the
 *       SAME array — same base+subclass concat pattern as point 1). Final class set:
 *       `mat-row cdk-no-data-row cdk-row mat-mdc-no-data-row mat-mdc-row mdc-data-table__row`.
 *     - Every element matching `MatNoDataRow._cellSelector` (`td, mat-cell, [mat-cell], .mat-cell`)
 *       inside that root — here just the one `<td>` — gets classes appended on top of the
 *       consumer's `mat-cell`: `cdk-cell cdk-no-data-cell` then
 *       `mat-mdc-cell mdc-data-table__cell mat-no-data-cell`. Final: `mat-cell cdk-cell
 *       cdk-no-data-cell mat-mdc-cell mdc-data-table__cell mat-no-data-cell`. The `<td>` gets NO
 *       role attribute (only the row root is touched).
 *     - The no-data row lives inside the SAME `<tbody>` as data rows would (the `noDataRowOutlet`
 *       sits right after `rowOutlet`, both inside `<tbody role="rowgroup"
 *       class="mdc-data-table__content">`) — `<thead>`/`<tfoot>` are unaffected (thead still shows
 *       the normal header row; tfoot still hidden+sticky per point 4, since there's no footer row
 *       def here either).
 * - **sortable**: reuses `matSort`/`mat-sort-header` on all 4 columns exactly as documented
 *   exhaustively in `specs/material-sort/angular-parity.spec.ts` (shared skeleton, the default
 *   `aria-describedby`, the direction/sorted/recently-cleared classes, the arrow SVG, etc. — not
 *   re-derived here). Table-specific additions confirmed live: the table itself gains class
 *   `mat-sort` (from `MatSort`'s own host class, concatenated the same way as point 1) alongside
 *   `mat-mdc-table mdc-data-table__table cdk-table`, and the `matsort` attribute (lowercased, same
 *   as sort.ts documents — already in `CONSUMER_SELECTOR_ATTRS`). Data is a plain array
 *   (`PeriodicElement[]`, not `MatTableDataSource`); `(matSortChange)` re-sorts a COPY of the
 *   original 4-row array and reassigns `this.dataSource` to the new array reference, which is
 *   enough to retrigger `CdkTable`'s `dataSource` input setter (`_switchDataSource`) because the
 *   reference changed — no manual `renderRows()` call needed for this pattern (contrast
 *   `data-change` below, which mutates in place and DOES need it). Confirmed live, deterministic,
 *   repeated twice: clicking the "Name" header 3 times cycles
 *   asc (rows → Beryllium,Helium,Hydrogen,Lithium; "Sort: name asc") →
 *   desc (rows → Lithium,Hydrogen,Helium,Beryllium; "Sort: name desc") →
 *   cleared (rows revert to the ORIGINAL order Hydrogen,Helium,Lithium,Beryllium; "Sort: name ",
 *   container class gains `mat-sort-header-recently-cleared-descending`) — standard matSort
 *   3-state cycle, nothing table-specific about the cycle itself.
 * - **multiple-header-rows**: 2 header row defs. Render order follows DECLARATION order in the
 *   template (content-children are queried in DOM order), confirmed live: the GROUP row
 *   (`*matHeaderRowDef="['basic-info','measurement-info']"`, 2 header-only columns with no
 *   cell/footer template — `<th>No. is in "Basic Info"</th>`-style grouping headers, text
 *   "Basic Info"/"Measurement") renders FIRST, the normal 4-column row SECOND — because that's the
 *   order their `<tr mat-header-row *matHeaderRowDef>` elements appear in table.ts's template, not
 *   because of any semantic ordering. Swapping the two `<tr>` elements in the template would swap
 *   the rendered order. Both rows are plain (non-sticky) `<tr mat-header-row>` inside the one
 *   shared `<thead>`. No footer row in this scenario (covered separately by `footer-row`).
 * - **data-change**: native table, same 4 columns, plus two `<button type="button">` ("Add row"/
 *   "Remove row", the second `[disabled]="!dataSource.length"`) and a
 *   `<p>Rows: {{ dataSource.length }}</p>` status line. `dataSource` is mutated IN PLACE
 *   (`.push()`/`.pop()`, SAME array reference — mirrors upstream's own
 *   `table-dynamic-array-data-example` exactly) so `CdkTable`'s reference-equality check in its
 *   `dataSource` setter never fires; a `@ViewChild(MatTable) table` reference + explicit
 *   `table.renderRows()` call after every mutation is what actually re-renders (contrast
 *   `sortable` above, which reassigns the reference instead and needs no `renderRows()` call —
 *   both are legitimate, upstream-documented patterns, and a Qwik port needs to support both: a
 *   data-source PROP CHANGE and an explicit re-render trigger). Deterministic rotation (NOT
 *   upstream's `Math.random()`) through a fixed 2-element pool (`Boron`/`Carbon`) so the resulting
 *   DOM is reproducible. Confirmed live, repeated twice: click "Add row" twice then "Remove row"
 *   once → row count goes 4 → 5 (+Boron) → 6 (+Carbon) → 5 (−Carbon), "Rows: " text tracks exactly,
 *   "Remove row" never actually becomes `disabled` in this sequence (`dataSource.length` never
 *   reaches 0).
 */

const route = 'mat-table';

/** Scopes to this scenario's sort headers so dev-app chrome elsewhere is never hit. */
const sortHeader = (page: Page, index: number) =>
  page.locator('[data-parity-root] th[mat-sort-header]').nth(index);

const clickSortHeader = (index: number): ParityStep => ({
  name: `click sort header ${index}`,
  run: async (page: Page) => {
    await sortHeader(page, index).click({force: true});
  },
});

/** Scopes to this scenario's own buttons so dev-app chrome elsewhere is never hit. */
const clickButton = (index: number): ParityStep => ({
  name: `click button ${index}`,
  run: async (page: Page) => {
    await page.locator('[data-parity-root] button').nth(index).click();
  },
});

test.describe('mat-table — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('flex', ({browser}) => expectMaterialParity(browser, {route, scenario: 'flex'}));

  test('footer-row', ({browser}) => expectMaterialParity(browser, {route, scenario: 'footer-row'}));

  test('sticky-header-column-end', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'sticky-header-column-end'}));

  test('text-column', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'text-column'}));

  test('no-data-row', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'no-data-row'}));

  test('sortable', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'sortable',
      // Click the "Name" header (index 1) three times: asc -> desc -> cleared.
      steps: [clickSortHeader(1), clickSortHeader(1), clickSortHeader(1)],
    }));

  test('multiple-header-rows', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'multiple-header-rows'}));

  test('data-change', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'data-change',
      // Add row, add row, remove row -> 4 -> 5 -> 6 -> 5.
      steps: [clickButton(0), clickButton(0), clickButton(1)],
    }));
});
