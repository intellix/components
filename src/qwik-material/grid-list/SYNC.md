# qwik-material/grid-list sync log

Tracks the sync state between this port and `src/material/grid-list/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`, and
`src/qwik-material/divider/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `grid-list/mat-grid-list.tsx` | `src/material/grid-list/grid-list.ts` (MatGridList component) | ported | Directive→component$; JSX with <Slot />; NumberInput coercion omitted; publishes MAT_GRID_LIST_INSTANCE (per-instance context) so tiles self-position; drops @ContentChildren + ngAfterContentChecked entirely — CSS grid handles layout |
| `grid-list/mat-grid-tile.tsx` | `src/material/grid-list/grid-tile.ts` (MatGridTile component only — MatGridTileText/HeaderCssMatStyler/FooterCssMatStyler/MatGridAvatarCssMatStyler dropped per scope decision) | ported | Reads MAT_GRID_LIST_INSTANCE with SSR-safe defaults; computes inline grid-column/grid-row span + aspect-ratio (ratio mode) — replaces upstream's parent-side _setStyle mutation surface |
| `grid-list/grid-list-config.ts` | (no upstream equivalent) | new | MatGridListConfig = {} interface + MAT_GRID_LIST_CONFIG context id; folded into QwikMaterialProvider.matGridListConfig for family shape parity |
| `grid-list/grid-list-context.ts` | `src/material/grid-list/grid-list-base.ts` (partial — MatGridListBase interface + MAT_GRID_LIST DI token intent) | new | MatGridListInstance + MAT_GRID_LIST_INSTANCE + MAT_GRID_LIST_INSTANCE_DEFAULTS replace upstream's DI token + optional inject pattern; per-instance parent → child context |
| `scss/grid-list/grid-list.scss` | `src/material/grid-list/grid-list.scss` (96 LOC) | rewritten | ~25 LOC of CSS-grid rules replacing upstream's absolute-positioning approach. Drops .mat-grid-tile-header, .mat-grid-tile-footer, .mat-grid-avatar, .mat-grid-list-text, .mat-2-line blocks + list-common/layout-common/token-utils imports (all unneeded after scope decision). No @use '@angular/cdk' rewrite needed (third port after Icon + Divider) |
| `scss/grid-list/_grid-list-theme.scss` | `src/material/grid-list/_grid-list-theme.scss` | synced | byte-identical copy; theme mixin inert on our end (typography tokens are for dropped header/footer) but kept for `diff -q` parity |
| `scss/grid-list/_m2-grid-list.scss` | `src/material/grid-list/_m2-grid-list.scss` | synced | byte-identical copy; 4 typography tokens are for dropped header/footer — inert |
| `scss/grid-list/_m3-grid-list.scss` | `src/material/grid-list/_m3-grid-list.scss` | synced | byte-identical copy; same |
| `scss/grid-list/grid-list-prebuilt.scss` | (qwik-material-specific) | new | @use grid-list.scss + 3 :root defaults matching emitted --mat-grid-list-* references |

## Removed upstream files

- `tile-coordinator.ts` (185 LOC) — bin-packing algorithm replaced by CSS grid's native grid-auto-flow
- `tile-styler.ts` (307 LOC) — TileStyler + Fixed/Ratio/Fit subclasses replaced by pure CSS + tile-side aspect-ratio computation
- `grid-list-base.ts` — MatGridListBase interface + MAT_GRID_LIST DI token superseded by MAT_GRID_LIST_INSTANCE
- `grid-list-module.ts` → Qwik has no module concept
- `testing/` (MatGridListHarness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (§3.3)
- `grid-list.spec.ts` (884 LOC) → ported to `mat-grid-list-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint
- `grid-list.html`, `grid-tile.html`, `grid-tile-text.html` → trivial templates inlined into JSX
- `MatGridTileHeader`, `MatGridTileFooter`, `MatGridAvatarCssMatStyler`, `MatGridTileText` → OUT OF SCOPE per design decision (deviation #5)

## Deviations from upstream

1. **TileCoordinator (185 LOC) removed entirely.** Replaced by CSS grid's native `grid-auto-flow: row` (default). Upstream's greedy gap-fill behavior is not replicated; `grid-auto-flow: dense` is available as an opt-in CSS override via user-supplied class.

2. **TileStyler + FixedTileStyler + RatioTileStyler + FitTileStyler (307 LOC) removed entirely.** All 3 rowHeight modes reimplemented in pure CSS via `data-mode="fixed|ratio|fit"` attribute selectors on the container, plus a tile-side inline `aspect-ratio` in ratio mode.

3. **Runtime re-layout on window resize removed.** Upstream's `kara` TODO about debounced resize handling becomes moot — CSS grid recomputes automatically on layout.

4. **`@angular/cdk/bidi` `Directionality` dependency removed.** CSS grid respects `dir="rtl"` on any ancestor natively — the RTL swap of `left`↔`right` upstream had to compute manually is a no-op for us.

5. **`MatGridTileHeader`, `MatGridTileFooter`, `MatGridAvatarCssMatStyler` removed.** Scope decision. Users needing text overlays compose their own inside a tile's projected content. `MatGridTileText` + `MatLine` reuse dropped (only referenced by the removed header/footer).

6. **Related SCSS blocks removed:** `.mat-grid-tile-header`, `.mat-grid-tile-footer`, `.mat-grid-avatar`, `.mat-grid-list-text`, `.mat-2-line`, header/footer positioning on `.mat-grid-tile-content`, plus `@use` imports of `list-common`, `layout-common`, `token-utils` (only needed by the removed blocks). The 4 M2/M3 typography tokens for header/footer text sizes remain in the synced partials but are inert at runtime.

7. **`throw Error()` guards removed.** Four upstream dev-mode throws are dropped:
   - Missing `cols` — TypeScript makes `cols` a required prop; runtime falls back to `1` via `Math.max(1, ...)`.
   - Invalid ratio (`"4:"`, `":3"`, `"foo"`, `""`) — parse yields `NaN` for one or both components; browser silently ignores the resulting invalid `aspect-ratio` value. A well-formed prefix like `"4:3:2"` degrades to `"4:3"` (extra segments truncated by destructuring) — arguably reasonable behavior.
   - `colspan > cols` — CSS grid clamps and wraps; no crash.
   - Invalid CSS in `rowHeight` — browser silently ignores invalid `grid-auto-rows`.

8. **Angular-specific removals:**
   - `@Input()` decorators + `NumberInput` coercion (`coerceNumberProperty`, `Math.round`) — replaced by TypeScript `number` types + inline `Math.max(1, Math.round(...))`.
   - `@ContentChildren(MatGridTile)` QueryList — no parent-side child enumeration; each tile self-renders using per-instance context.
   - `ngOnInit`, `ngAfterContentChecked` lifecycle — no lifecycle work; layout is declarative CSS.
   - `MAT_GRID_LIST` DI token with `useExisting: MatGridList` — replaced by per-instance `MAT_GRID_LIST_INSTANCE`.
   - `ɵTileCoordinator` private harness-only export — no harness ecosystem.
   - `MatGridListBase` + `TileStyleTarget` interfaces — internal to Angular's mutation contract; N/A.
   - `exportAs: 'matGridList'` / `'matGridTile'` — Angular template-ref concept, N/A.
   - `[attr.cols]` / `[attr.rowspan]` / `[attr.colspan]` host bindings — replaced by plain attribute passthrough on the custom element (same DOM shape).

9. **`intrinsic-elements.d.ts` widening for custom numeric attrs.** Both `<mat-grid-list>` and `<mat-grid-tile>` type as `QwikIntrinsicElements['div']` at the base, extended for the numeric attributes Qwik's `HTMLAttributes` doesn't cover: `<mat-grid-list>` gets `& {cols?: number}`, `<mat-grid-tile>` gets `& {rowspan?: number; colspan?: number}`. Mirrors the `progress-bar` / `progress-spinner` `& {mode?: string}` precedent. `data-mode` on `<mat-grid-list>` needs no widening — Qwik's base `HTMLAttributes` covers `data-*` attributes via its index signature.

10. **First port with per-instance context.** `MAT_GRID_LIST_INSTANCE` is the first branch context in `qwik-material/` that flows from a parent component to its descendants (in addition to the global `MAT_GRID_LIST_CONFIG` provided by `QwikMaterialProvider`). Precedent for future container-with-children ports (tabs, stepper, etc.).

## Stub inventory delta

No new stubs — the grid-list SCSS chain does NOT reference `@angular/cdk` (grep-confirmed, matching Icon + Divider precedent). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/grid-list/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list.
