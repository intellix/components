# qwik-cdk/table sync log

Tracks the sync state between this port and `src/cdk/table/` upstream.
Companion to `src/qwik-cdk/a11y/SYNC.md`, `src/qwik-cdk/accordion/SYNC.md`,
`src/qwik-cdk/stepper/SYNC.md`.

## 2026-10-28 initial port

New entry point, gated by `specs/material-table/angular-parity.spec.ts`
(wave 5, `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`).
Headless logic only — no rendering components here, same CDK/Material
split as `qwik-cdk/accordion` + `qwik-material/expansion`: this package
holds pure algorithms; `qwik-material/table`'s `MatTable` is the only
consumer and does all the actual rendering.

**Version note**: this checkout's `src/cdk/table/` is Angular
`22.1.0-next.1`, a notably refactored version — `coalesced-style-scheduler.ts`
no longer exists in this directory (removed upstream, commit `0f48b04dd`,
"move out unused style scheduler"); sticky-styler.ts now batches DOM writes
via `afterNextRender({earlyRead, write}, {injector})` instead. See the
`sticky-styler.ts` deviation below for how this port replaces that
scheduling entirely rather than porting it.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `table/column-css.ts` | `src/cdk/table/cell.ts` (`CdkColumnDef._setNameInput`/`_updateColumnCssClassName`) | ported | `cssClassFriendlyName(name)` = `name.replace(/[^a-z0-9_-]/gi, '-')` verbatim (case-insensitive, one literal `-` per disallowed char, never collapsed — confirmed against upstream's own `table.spec.ts` assertion). `cdkColumnClass`/`matColumnClass` produce the `cdk-column-<name>`/`mat-column-<name>` strings (the latter is Material's push, included here since both need the same friendly-name regex). |
| `table/cell-role.ts` | `src/cdk/table/table.ts`/`cell.ts` (`CdkTable._getCellRole()`) | ported (simplified) | Pure `getCellRole(tableRole)`: `'gridcell'` if the table's own role is `grid`/`treegrid`, else `'cell'`. Upstream's `_cellRoleInternal` "cache" field is dead code in the base class (grepped: never assigned anywhere except its own `undefined` initializer) — not ported, since porting dead code would just be misleading. `qwik-material/table` always passes `'table'` (no grid/treegrid support), so this always resolves to `'cell'` in practice — kept as a real function (not inlined) for anyone layering a grid-role table on top later. |
| `table/text-column-defaults.ts` | `src/cdk/table/text-column.ts` (`CdkTextColumn._createDefaultHeaderText`, default `dataAccessor`) | ported | `createDefaultHeaderText`: uppercases ONLY the first character (`propertyA` -> `PropertyA`, confirmed against upstream's own text-column.spec.ts). `defaultTextColumnDataAccessor`: plain `data[name]` lookup. See `qwik-material/table`'s `matTextColumn()` for how these combine with this port's data-driven row shape (deviation #2 there). |
| `table/row-defs.ts` | `src/cdk/table/table.ts` (`CdkTable._getRowDefs`) | ported | `getRowDefsForData(data, index, rowDefs, multiTemplateDataRows)`: the single-row-def shortcut (used unconditionally even with a non-matching `when`), the `multiTemplateDataRows` filter-all-matching branch, and the find-first-or-default-fallback branch for single-template mode — all ported verbatim. The `RenderRow` WeakMap identity-caching machinery around this (`_getAllRenderRows`/`_getRenderRowsForData`'s cache reuse) is NOT ported — see deviations #1. |
| `table/sticky-styler.ts` | `src/cdk/table/sticky-styler.ts` (`StickyStyler`, 589 LOC) | ported (algorithm) / re-architected (scheduling) | See the dedicated section below — this is the centerpiece of the port and the one upstream file compared byte-for-byte via rendered inline styles. |

## Removed upstream files

- `table.ts`/`row.ts`/`cell.ts` (the `CdkTable`/`CdkRowDef`/`CdkColumnDef`/etc. directive classes themselves) — NOT ported as classes. Their rendering responsibilities (content-children collection via `@ContentChildren`, `ViewContainerRef`-based row/cell template instantiation via the `CdkCellOutlet.mostRecentCellOutlet` static-pointer trick, the `IterableDiffer`/`ViewRepeater` diffing machinery) are Angular-specific mechanisms with no Qwik equivalent — and don't need one: Qwik's own keyed `.map()` rendering already handles add/move/remove reconciliation, and column/row definitions are plain data in this port (see `qwik-material/table`'s "Why columns/rows are data, not slotted children" doc comment), not content-projected directives needing a query mechanism at all. What upstream computes PROCEDURALLY from those classes (role attributes, class lists, the native-table thead/tbody/tfoot template, the `CdkCellOutlet` row/cell instantiation) is reproduced directly in `qwik-material/table/mat-table.tsx`'s render body instead.
- `coalesced-style-scheduler.ts` — doesn't exist in this upstream version either (see version note above); its old purpose (batch DOM writes, avoid read/write interleaving) has no SSR equivalent here regardless — see sticky-styler deviation below.
- `table-errors.ts` — dev-mode `Error()` factories (missing dataSource, duplicate column, missing row defs, unknown column id). Not ported: this port has no runtime registration/query step that could fail these ways (a consumer just passes a `columns`/`rows` array), so the failure modes themselves mostly don't exist; the ones that still could (e.g. a `displayedColumns` entry with no matching `MatColumnDef`) degrade silently (empty cell) rather than throwing, matching this project's general pattern of "render the best approximation" over dev-mode assertions elsewhere in the port.
- `table-module.ts` — Qwik has no module concept.
- `sticky-position-listener.ts` (`StickyPositioningListener`, `STICKY_POSITIONING_LISTENER` token) — the "notify a consumer of computed sticky sizes/offsets" extensibility hook (used upstream by the sticky-header-row-container virtual-scroll integration). Not ported — no consumer in this port's scope needs it.
- `can-stick.ts` (`CanStick` interface) — a dirty-check-flag mixin contract (`hasStickyChanged`/`resetStickyChanged`) for Angular's incremental re-render model. Not needed: this port recomputes sticky styling fresh on every render (see deviation #3), so there is no "did sticky state change since last check" question to answer.
- `tokens.ts` (`CDK_TABLE`, `TEXT_COLUMN_OPTIONS`) — DI tokens for Angular's injector-based wiring; no Qwik equivalent needed (no DI).
- `table.spec.ts` (3514 LOC) / `text-column.spec.ts` (188 LOC) — confirmed via careful review (and a dedicated research pass): **zero** tests in either file are directly portable to Vitest. Every single test, including every "with sticky positioning" test, instantiates a full Angular `TestBed` fixture and asserts on real rendered DOM; none instantiates `StickyStyler` standalone. The pure algorithms extracted while porting (sticky position/z-index math, column-CSS-class naming, text-column defaults, row-def matching) are instead covered by fresh, from-scratch Vitest specs in this directory (`sticky-styler.spec.ts`, `column-css.spec.ts`, `text-column-defaults.spec.ts`, `row-defs.spec.ts`) — not "ported" tests, since none existed in portable form, but the same behavioral assertions upstream's tests make about these specific algorithms.

## Deviations from upstream

1. **No `RenderRow` identity cache.** Upstream's `_getAllRenderRows`/`_getRenderRowsForData` reuse cached `RenderRow` wrapper objects (keyed by `data` then `rowDef` in a `Map`/`WeakMap`) so its default trackBy (reference equality on the wrapper, not the raw data) and `IterableDiffer`-driven view reuse work correctly across renders. This port has no `IterableDiffer`/`ViewContainerRef` to feed — Qwik's `.map()` with an explicit `key` (the consumer's own `MatTableRow.key`, falling back to array index) achieves the same "preserve DOM node identity across a data change" goal through Qwik's own reconciler. `getRowDefsForData` is ported as a plain, stateless function (no caching) since nothing downstream needs the identity-preservation property it existed to support.
2. **Sticky styling operates on `VirtualStickyElement`s, not real `HTMLElement`s, and drops `afterNextRender`/`earlyRead`/`write` scheduling entirely.** Upstream's `StickyStyler` imperatively mutates persistent, already-rendered DOM nodes, deferred via `afterNextRender({earlyRead, write}, {injector})` so geometry reads (`earlyRead`) never interleave with style writes (`write`) across the whole page (layout-thrash avoidance), and so sticky styling gets recomputed incrementally after each Angular change-detection cycle touches the DOM. This port instead computes the table's ENTIRE sticky styling fresh, synchronously, as plain data, during `MatTable`'s own render pass (no DOM exists yet during SSR to read from or write to) — `VirtualStickyElement` is a `{classes: Set<string>, style: {...}}` bag standing in for `element.classList`/`element.style`, and the SAME `StickyStyler` class methods (`addStickyStyle`/`removeStickyStyle`/`stickRows`/`updateStickyColumns`/`updateStickyFooterContainer`) mutate it with the EXACT SAME algorithm (see below), just with no scheduling wrapper — there is no persistent DOM to batch writes against, and no "previous render's stale sticky state" to avoid reading mid-write, since every render starts from a blank `VirtualStickyElement`. One direct consequence: `clearStickyPositioning` (upstream's "wipe whatever sticky styling a PREVIOUS render left on this now-reused element" step) has no equivalent here at all — a freshly-created `VirtualStickyElement` never has stale state to clear.
3. **No real column-width/row-height measurement; widths/heights default to `0`.** Upstream measures actual `getBoundingClientRect()` sizes (cached, `ResizeObserver`-invalidated, replayed after a debounce) because sticky offsets for the SECOND+ sticky column/row on a given side must accumulate the PRECEDING ones' real pixel widths/heights. This port has no DOM to measure at SSR time. Critically, this is NOT an approximation for the single most common case — and the only case any `angular-parity.spec.ts` scenario exercises: with at most ONE sticky-start and ONE sticky-end column (or ONE sticky header/footer row), every computed offset is mathematically `0` regardless of the real width/height (there is nothing preceding to accumulate), so passing `0` produces the EXACT correct value, not a rounded one. A consumer with 2+ same-side sticky columns, or 2+ stacked sticky header/footer rows, needs to supply real measured widths/heights (via `qwik-material/table`'s internal plumbing, currently hardcoded to `0` — no scenario needs anything else) for a correct result; this port does not (yet) wire up a client-side remeasure/`ResizeObserver` pass the way upstream's replay-queue does. Flagged here rather than silently degraded — a future consumer hitting this limitation should extend `MatTable`'s width/height computation, not this file's pure `StickyStyler` class (which already accepts arbitrary widths/heights as plain function arguments and would handle real measurements correctly if given them).
4. **The upstream off-by-one loop bound in `_getStickyEndColumnPositions` is kept exactly, not "fixed."** The loop starts at `i = widths.length` (one index past the last valid position) and decrements while `i > 0`, so index `0` is never assigned and the first iteration (`i === widths.length`) is a guaranteed no-op array-index read. This is almost certainly an accidental-but-harmless quirk upstream (index `0` being unassigned for "sticky-end" positions is semantically fine — the leftmost column can never simultaneously be sticky-END), but since this exact function's OUTPUT feeds directly into inline `style.right`/`style.left` pixel values that `angular-parity.spec.ts` compares byte-for-byte, this port reproduces the exact loop bounds rather than the "obviously correct" `i = widths.length - 1; i >= 0; i--` form, in case some future scenario's column count/sticky-state combination would make the two forms diverge.
5. **RTL is not wired up end-to-end.** `StickyStyler.direction` exists and correctly swaps which physical CSS property (`left`/`right`) "start"/"end" map to (unit-tested in `sticky-styler.spec.ts`), but `qwik-material/table`'s `MatTable` currently always constructs its `StickyStyler` with `'ltr'` — no parity scenario exercises RTL, and this port has no `dir`-context integration yet (unlike upstream's `_dir.change` subscription that reruns `updateStickyColumnStyles()` on direction changes). A future RTL-aware table should thread a direction signal through to the `StickyStyler` constructor; the algorithm itself is already correct for either direction.

## `StickyStyler` — algorithm fidelity notes

Every public method below is a line-for-line port of its upstream
namesake's WRITE-phase logic (the `earlyRead` geometry-measurement phase is
replaced by plain function arguments — see deviation #2/#3):

- `getCalculatedZIndex`: sums `{top: 100, bottom: 10, left: 1, right: 1}`
  for every direction CURRENTLY set as an inline style on the element
  (read live, not from separate tracked state) — so calling it AFTER
  setting a new direction's style (same order `_addStickyStyle` uses)
  correctly accumulates z-index across independent sticky passes (e.g. a
  cell that's both top-sticky from a header-row pass and left-sticky from
  a column pass ends up `100 + 1 = 101`, confirmed in both
  `sticky-styler.spec.ts` and the `sticky-header-column-end` parity
  scenario).
- `addStickyStyle`/`removeStickyStyle`: exact class/style bookkeeping,
  including `removeStickyStyle`'s "keep the sticky class + recompute
  z-index if some OTHER direction is still set; otherwise strip
  class/zIndex/position entirely" branch.
- `getStickyStartColumnPositions`/`getStickyEndColumnPositions`: exact
  position-accumulation math (see deviation #4 for the end-positions
  off-by-one).
- `stickRows`: the footer-reversal (`position === 'bottom'` reverses both
  the row and sticky-state arrays before processing, so the BOTTOMMOST
  sticky row gets offset `0` and earlier rows stack above it), the
  native-vs-flex branch (`isNativeHtmlTable ? row's cells : [the row
  itself]`), and the "only the row at `states.lastIndexOf(true)` (in the
  possibly-reversed array) gets the border-elem class" rule.
- `updateStickyColumns`: per-cell start-then-end application order (not
  two separate passes), the `lastIndexOf(true)`/`indexOf(true)` border-cell
  selection, and the RTL `start`/`end` -> `left`/`right` swap.
- `updateStickyFooterContainer`: the exact Safari-workaround condition
  (`stickyStates.some(state => !state)` removes; otherwise — INCLUDING the
  vacuous zero-footer-rows case — adds `bottom: 0`).
