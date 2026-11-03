# qwik-material/table sync log

Tracks the sync state between this port and `src/material/table/`
upstream. Companion to `src/qwik-cdk/table/SYNC.md` (the headless
`StickyStyler`/column-css/row-def/text-column-default logic this port
consumes), `src/qwik-material/sort/SYNC.md` (the `matSort` integration),
`src/qwik-material/tabs/SYNC.md` and `src/qwik-material/stepper/SYNC.md`
(the "data array, not slotted children" precedent this port follows).

## 2026-10-28 initial port

New entry point, gated by `specs/material-table/angular-parity.spec.ts`
(wave 5, `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`).
All 9 Angular-mirrored scenarios (`basic`, `flex`, `footer-row`,
`sticky-header-column-end`, `text-column`, `no-data-row`, `sortable`,
`multiple-header-rows`, `data-change`) + 3 Qwik-only scenarios
(sticky footer row, `matTextColumn()` overrides, reactive no-data-row
toggling) pass, run 3 times.

## Why columns/rows are data, not slotted children

Upstream's `mat-table` takes CONTENT CHILDREN: `<ng-container
matColumnDef="x">` holding `*matHeaderCellDef`/`*matCellDef`/
`*matFooterCellDef` templates, plus `<tr *matHeaderRowDef="...">`/
`*matRowDef`/`*matFooterRowDef`, all queried via `@ContentChildren` and
manufactured into actual rows via `ViewContainerRef.createEmbeddedView` —
see `angular-parity.spec.ts`'s header comment point 5 ("content children
never render in place; only manufactured rows/cells appear").

Qwik has no `@ContentChildren` equivalent and cannot read a `<Slot>`'s
projected children's shape during SSR — the same documented finding
`qwik-material/list`/`qwik-material/tabs`/`qwik-material/stepper` already
made (quoting `qwik-material/list/SYNC.md`'s empirical confirmation:
reading `props.children` into an array and re-rendering it "does not work
on `@builder.io/qwik` 1.20.0 — the array rendered as nothing, and the
original nodes reappeared as a hidden `<q:template q:slot>` sibling
instead"). `qwik-material/tabs`' `MatTabGroup`/`qwik-material/stepper`'s
`MatStepper` solved the analogous problem — content that Angular's
`@ContentChildren` result gets rendered into MORE THAN ONE physical
subtree (here: a column's cell template is applied once per DATA ROW, and
independently once as a header/footer) — with a plain data array carrying
already-realized `JSXOutput` rather than a template. `MatTable` follows
the identical shape, generalized to two dimensions (rows × columns):

- `columns: MatColumnDef[]` — one entry per `matColumnDef`. `header`/
  `footer` are plain `JSXOutput | string` (exactly `MatTabDef.labelTemplate`'s
  shape) — correct for content that's the SAME for every row.
- `rows: MatTableRow[]` — one entry per data row, with `cells` ALREADY
  evaluated per-row by the consumer's own `.map()` over its data array.
  The migration mapping of `*matCellDef="let element">{{ element.position
  }}` is simply `cells: {position: element.position}`.

**Why NOT a per-row `cell: QRL<(row) => JSXOutput>` render callback**
(the OTHER shape this port's own design brief suggested as an option):
confirmed via `qwik-material/tabs/SYNC.md`'s own documented finding, a
`component$`'s render function cannot be `async`
(`OnRenderFn<PROPS> = (props: PROPS) => JSXOutput`, no `Promise` allowed) —
and calling a `QRL<Function>` is ALWAYS async (`await fn()`, confirmed by
`qwik-material/slider`'s `displayWith`, itself a `QRL` resolved inside a
`useTask$`, never inside render directly). `MatTable` would need to invoke
a cell QRL once per (row, column) pair, synchronously, inside its own
render — not viable. The safe, precedented alternative (pre-realized
`JSXOutput`/primitive values, computed by the consumer BEFORE crossing
into `<MatTable>`'s props) is what this port uses throughout.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `table/mat-table-types.ts` | `src/material/table/{table,row,cell,text-column}.ts` (combined input shape) | ported (restructured) | `MatColumnDef`/`MatTableRow`/`MatTableRowGroupDef`/`MatNoDataRowDef`/`MatTableSortConfig`/`MatTableProps` — see "Why columns/rows are data" above. `MatColumnDef.sticky`/`stickyEnd` mirror `CdkColumnDef`'s inputs; `justify` mirrors `CdkTextColumn.justify`; `sortHeader` is new (see matSort integration below). `MatTableRow.onClick$`/`.class`/`.cellProps`/`.columns` + `MatTableCellProps` (2026-11-03, tier2/datanav) mirror `(click)`/`[class.x]` on `<tr mat-row>`, a cell-level `[attr.colspan]`, and `multiTemplateDataRows` — see this file's own dedicated section below. |
| `table/mat-table.tsx` | `src/material/table/table.ts` (`MatTable`, `host: {'class': 'mat-mdc-table mdc-data-table__table'}`, `stickyCssClass` override = `'mat-mdc-table-sticky'`, `needsPositionStickyOnElement` override = `false`) + `src/material/table/row.ts` (`MatHeaderRow`/`MatRow`/`MatFooterRow`/`MatNoDataRow` host classes) + `src/material/table/cell.ts` (`MatHeaderCell`/`MatCell`/`MatFooterCell` host classes, `MatColumnDef._updateColumnCssClassName`'s `mat-column-<name>` push) + the matching `src/cdk/table/*` base classes (CDK+Material host-class concatenation — see `angular-parity.spec.ts` point 1 for the full verified class-string table) | ported | The native-table `<thead role="rowgroup">`/`<tbody role="rowgroup" class="mdc-data-table__content">`/`<tfoot role="rowgroup">` wrapper (upstream's own inline `@Component({template: ...})`, confirmed byte-identical to CDK's except the one `mdc-data-table__content` class on `<tbody>`) is reproduced directly, branching on `props.as`. The flex form renders header/data/footer rows as direct children with NO wrapper, in declaration order (header row defs, then data rows, then footer row defs — matching the AUTHORED `<tr>` order in both forms' templates upstream). `role="table"` is always set (no "already has a role" override support — see deviation #4); `role="columnheader"` is always static on header cells; `role="cell"` on data/footer cells goes through `qwik-cdk/table`'s `getCellRole('table')`, which always resolves to `'cell'` (no grid/treegrid support). |
| `table/mat-text-column.ts` | `src/material/table/text-column.ts` (`MatTextColumn`) + `src/cdk/table/text-column.ts` (`CdkTextColumn`) | ported (as a plain function, not a component) | See deviation #2 — `<mat-text-column>` never renders upstream either (point 8 of `angular-parity.spec.ts`'s header comment: "the `<mat-text-column>` tag itself is COMPLETELY ABSENT from the rendered DOM"), so a Qwik `<mat-text-column>` custom element would be equally pointless. `matTextColumn(name, {header, justify, footer})` returns a plain `MatColumnDef` using `qwik-cdk/table`'s `createDefaultHeaderText`/the `justify` default `'start'`. |
| `scss/table/table.scss` | `src/material/table/table.scss` (184 LOC) | synced | Byte-identical copy. No `@angular/cdk` import exists in this file, so no cdk-stub swap needed (same as `sort/sort-header.scss`). |
| `scss/table/_table-flex-styles.scss` | `src/material/table/_table-flex-styles.scss` | synced | byte-identical copy; `@use`d by `table.scss` for the flex `<mat-table>` tag-name selectors |
| `scss/table/_m3-table.scss` | `src/material/table/_m3-table.scss` | synced | byte-identical copy; `table.scss`'s `$fallbacks` resolves through this (`m3-table.get-tokens()`, default args) |
| `scss/table/table-prebuilt.scss` | (qwik-material-specific) | new | `@use` table.scss only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): all 23 `--mat-table-*` tokens already resolve through a `token-utils.slot(..., var(--mat-sys-*))` fallback chain baked in at Sass-compile time, same as upstream. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css` |

## Removed upstream files

- `table-module.ts` — Qwik has no module concept.
- `table-data-source.ts` (`MatTableDataSource`) — NOT ported. Confirmed genuinely unused by every parity scenario (all use plain arrays, re-sorted/mutated by the consumer's own code — see the `sortable`/`data-change` scenarios); `CdkTable.dataSource` upstream accepts a plain array, `Observable`, or `DataSource`, and this port only ever needed the plain-array path. A future consumer wanting upstream's built-in filter/sort/paginate pipeline would need this ported separately — out of scope here (no scenario exercises it, and it depends on `MatSort`/`MatPaginator` in ways that would need its own design pass).
- `table.ts`'s `MatRecycleRows` directive — deprecated upstream itself (`@breaking-change 23.0.0`, already a no-op there). Not ported.
- `table.spec.ts` (1155 LOC) — same finding as `qwik-cdk/table/SYNC.md` reports for the CDK-level spec: every test needs a real Angular `TestBed` fixture; nothing is portable as-is. Covered instead by `angular-parity.spec.ts` (DOM parity) + `mat-table-scenarios.spec.tsx`'s `describe.skip` catalog (documents what's covered where) + the live sanity tests in the same file.

## Deviations from upstream

1. **matSort integration is a per-column flag on `MatTable`, not two
   independent directives sharing a host element.** Upstream's
   `mat-sort-header`/`mat-header-cell` are two SEPARATE directives Angular
   composes onto the SAME `<th>` element (any number of directives can
   share a host). Qwik has no equivalent — each JSX element has exactly
   one component producing it. Nesting `<MatSortHeader>` inside a
   separately-generated `<th mat-header-cell>` (the first approach tried)
   produces TWO `<th>` elements where Angular produces one, confirmed live
   against the `sortable` parity scenario (failed with `child count 4 !=
   8` — every header `<tr>` had double the expected children). The fix:
   `MatColumnDef.sortHeader: boolean | {id?: string}` tells `MatTable` to
   render `<MatSortHeader id={...} class={mergedClasses} role=
   "columnheader" style={mergedStickyStyle}>{header}</MatSortHeader>`
   DIRECTLY AS the header cell (not nested inside one) — i.e. `MatSortHeader`
   itself becomes the one merged element, the same relationship upstream's
   two directives have. This required two small additive changes to
   `qwik-material/sort` (see its own SYNC.md addendum below): `MatSortHeader`
   gained optional `role`/`style` props (both `undefined` by default, so
   existing standalone `<MatSortHeader>` usage — e.g. `specs/material-sort/`'s
   own scenarios — is completely unaffected), and `MAT_SORT_STATE` (+
   `MatSortSharedState`/`MatSortTableConfig`/`readSortState`) is re-exported
   from `sort/public-api.ts` so `MatTable` can provide the SAME context a
   `<MatSort>` wrapper would, without requiring one (which would introduce
   an extra wrapper element around the table — upstream's `matSort`
   attaches to the table element itself, never a wrapper).
2. **`matTextColumn()` is a plain function returning data, not a
   component.** See the upstream-sync-state table above; follows directly
   from "why columns/rows are data."
3. **No `MatTableDataSource`, sorting/filtering/pagination pipeline.** See
   removed-files above.
4. **No "already has a role" override support.** Upstream's `CdkTable`
   constructor checks a static `HostAttributeToken('role')` and only sets
   `role="table"` if ABSENT — supporting a consumer-authored
   `role="treegrid"` grid-table variant. This port always sets
   `role="table"` unconditionally (no scenario needs an override), and
   correspondingly `qwik-cdk/table`'s `getCellRole` is only ever called
   with `'table'` in practice.
5. **No live column-width/row-height remeasurement.** Inherited directly
   from `qwik-cdk/table/SYNC.md`'s deviation #3 — `MatTable` currently
   passes `0` for every column width / row height into `StickyStyler`,
   which is the mathematically exact value for every scenario in this
   port's scope (at most one sticky column per side, at most one sticky
   header/footer row) but would need real measurement for 2+ same-side
   sticky columns or 2+ stacked sticky rows.
6. **Directive-selector bookkeeping attributes
   (`mat-table`/`mat-header-row`/`mat-row`/`mat-footer-row`/
   `mat-header-cell`/`mat-cell`/`mat-footer-cell` on the NATIVE table
   form) are not rendered.** Upstream's native-table selectors are
   attribute selectors (`table[mat-table]`, `tr[mat-header-row]`, etc.),
   so the consumer's own template literally carries these as bare,
   valueless attributes. `angular-parity.spec.ts`'s own harness
   (`CONSUMER_SELECTOR_ATTRS` in `lib/material-parity.ts`) already
   excludes exactly these attribute names from comparison — they're
   categorized as consumer-written directive-selector spelling, not part
   of the component's actual DOM contract (the SAME category as, say,
   `matbutton`/`mat-icon-button` on a button). This port omits them
   accordingly: they carry no functional meaning (no CSS in this port's
   synced stylesheets selects on them either — only the flex form's TAG
   NAMES, which this port DOES render, since those aren't filtered).

## Cell/header/footer content needed `cloneJsxForReuse` too (2026-11-02, Phase 2 docs examples)

Found porting material.angular.dev's `table-sticky-columns` docs example (a real `<mat-icon>`
JSXOutput cell value, not plain text/numbers like every prior scenario). Confirmed live: EVERY
row's icon text went empty (`'more_vert'` -> `undefined`) on first render — the same
"re-rendered twice within the same mount corrupts a reused JSXOutput" Qwik v2 issue already
documented and fixed in `qwik-material/menu` and `qwik-material/tabs`. `MatTable` re-renders at
least once after mount (sticky-position measurement via `StickyStyler`), and embedding the SAME
`row.cells[name]`/`col.header`/`col.footer`/`noData.content` object again on that re-render
corrupts it.

Fix: `mat-table.tsx` wraps every one of those four embedding sites in `cloneJsxForReuse(...)` —
same one-line-per-site pattern as every other site using this helper. Purely additive; every
prior scenario only ever passes plain strings/numbers (which `cloneJsxForReuse` passes through
unchanged), so this is a no-op for all of them.

Verified: `specs/examples-data-nav/angular-parity.spec.ts`'s table scenarios (10 cases) pass, run
3x as part of the full 48-case suite. `specs/material-table` 12/12 unaffected.

## Row-level interaction, per-cell class/colSpan, and multiTemplateDataRows (2026-11-03, tier2/datanav)

Previously `MatTableRow` was `{key, cells}` only — no way to port upstream's `(click)`/
`[class.x]` on `<tr mat-row>`, a cell-level `[attr.colspan]`, or `multiTemplateDataRows` (more
than one `*matRowDef` per data item — an expandable "detail row" pattern). All three are now
supported, additively (every pre-existing scenario's plain `{key, cells}` shape still works
unchanged):

- **`MatTableRow.onClick$`/`.class`** — mirrors `(click)`/`[class.x]` on `<tr mat-row>` directly
  (e.g. upstream's `table-row-binding` docs example: `(click)="clickedRows.add(row)"` +
  `[class.demo-row-is-clicked]="clickedRows.has(row)"`). `renderRow()` now takes an `onClick$`
  and merges `toClassArray(row.class)` onto the generated `cdk-row mat-mdc-row …` list, for both
  the native `<tr>` and flex `<mat-row>` forms.
- **`MatTableRow.cellProps: Partial<Record<string, MatTableCellProps>>`** (`{class?, colSpan?}`)
  — per-cell overrides, keyed by column name, kept as a SIBLING field to `cells` (which stays
  content-only, unchanged) rather than widening `cells`' value type — avoids any ambiguity
  between a bare content value and a described-cell object. `colSpan` is native-`<table>`-only
  (the flex `<mat-table>` form has no table semantics to span — same category as every other
  native-only feature in this port, e.g. `sortHeader`).
- **`MatTableRow.columns?: string[]`** — overrides which columns THIS row renders (falls back to
  `MatTableProps.displayedColumns`). This is the whole mechanism for upstream's
  `multiTemplateDataRows`: the consumer simply places MORE THAN ONE `MatTableRow` entry per data
  item in the flat `rows` array (e.g. a main row using the regular columns, immediately followed
  by a "detail" row using a single different column spanning the full width via
  `cellProps.<name>.colSpan`) — see `qwik-material-examples/table/table-expandable-rows`. No
  separate `multiTemplateDataRows` boolean exists to set or echo (`EXAMPLE_IGNORE_ATTRS` in
  `specs/examples-data-nav/angular-parity.spec.ts` lists it as an upstream static attribute this
  port has no equivalent for, same treatment as `table-pagination`'s `showFirstLastButtons`).
  **Sticky-column computation had to change to support this**: `resolvedRowColumns` (falls back
  per-row to `dataColumns`) replaces the single global `dataColumns`-based pass over
  `StickyStyler.updateStickyColumns()` — rows are now GROUPED by their resolved column list (a
  `cols.join('\0')` key) and each group's sticky start/end states are computed against THAT
  group's own columns, not the table's `displayedColumns`. Mathematically identical to the old
  code for the (still overwhelmingly common) uniform-columns case — a single group covering every
  row — and correctly scoped for a detail row's shorter, different column list, which previously
  would have been sized/looked-up against the WRONG column list entirely had this port naively
  kept a single global pass.
- **`trackBy` is already covered by `MatTableRow.key`** — no separate API needed. Upstream's
  `trackBy: (index, item) => any` and this port's existing `key` (falls back to the row's array
  index) serve the IDENTICAL row-reuse purpose; a migrating consumer sets `key: item.id` in place
  of a `trackBy` function returning `item.id`.
- **`matNoDataRow` was already supported** (`MatTableProps.noData` + `renderNoDataRow()`, since
  the initial port) — not a gap, despite the task brief flagging it as one to double check.

Ported upstream examples demonstrating the new API, via the established
`qwik-material-examples/table/<id>` + dev-app `examples/<id>` route + `examples-map.ts` +
`specs/examples-data-nav/angular-parity.spec.ts` pipeline:

- **`table-row-binding`** — `onClick$`/`.class` on a plain, non-multi-row table; an interaction
  step (clicking a row) is included.
- **`table-expandable-rows`** — the full `multiTemplateDataRows` pattern: one main row +
  one detail row per data item (10 periodic-table elements, verbatim from upstream's own data —
  an earlier draft of this port's example only included 5, which is EXACTLY the kind of
  structural mismatch this harness catches: `child count 20 != 10` against the real Angular
  reference, fixed by copying the full 10-element array). An interaction step (clicking a row's
  own expand-toggle icon button, which `stopPropagation()`s so it doesn't ALSO trigger the row's
  own click-to-expand, matching upstream exactly) is included.

Both pass `specs/examples-data-nav/angular-parity.spec.ts` (initial + interaction snapshots),
`specs/examples-css` (CSS scoped under each example's own host tag), and
`specs/examples-rerender` (hover/focus re-renders don't corrupt the new per-row
`onClick$`-bearing cells or the icon-button/detail-row content), run 3x.
