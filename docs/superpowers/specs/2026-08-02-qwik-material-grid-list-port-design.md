# qwik-material Grid List Port — Design Spec

**Date:** 2026-08-02
**Branch:** `qwik-cdk-dialog-port` (10th component after Dialog, Button, Card, Toolbar, Badge, Icon, Progress Bar, Progress Spinner, Divider).
**Scope tier:** trivial (second of the trivial pair after Divider).

## 1. Goal

Port `src/material/grid-list` from Angular Material to a `qwik-material/grid-list` entry-point, exposing `MatGridList` + `MatGridTile` custom-element wrappers with the same public API surface (cols / rowHeight / gutterSize / rowspan / colspan / aria trio) that upstream consumers rely on.

**Non-goals:** MatGridTileHeader / MatGridTileFooter / MatGridAvatarCssMatStyler / MatLine reuse (dropped by scope decision — see §5 deviation #5); the upstream Angular test harness (`testing/`); the JS tile-positioning math (replaced by CSS grid — see §2).

## 2. Architecture

**Native CSS grid, zero JS geometry.** Upstream's ~500 LOC of `TileCoordinator` (bin-packing) + `TileStyler` (3 subclasses computing `top`/`left`/`width`/`height` inline styles) is replaced by:

- `display: grid` container with `grid-template-columns: repeat(cols, 1fr)` and `gap: <gutterSize>`.
- Each tile is a grid item with `grid-column: span <colspan>` + `grid-row: span <rowspan>`.
- Three rowHeight modes selected via a `data-mode` attribute on the container:

| upstream mode | `data-mode` | container CSS | tile CSS |
|---|---|---|---|
| Fixed (`"100px"`) | `fixed` | `grid-auto-rows: var(--mat-grid-list-row-height)` | — |
| Ratio (`"4:3"`) | `ratio` | `grid-auto-rows: min-content` | inline `aspect-ratio: (colspan × W) / (rowspan × H)` |
| Fit (`"fit"`) | `fit` | `grid-auto-rows: 1fr` (container needs explicit height) | — |

**No JS layout pass, no inline style mutation from parent to child, no `ngAfterContentChecked` re-run.** RTL falls out of native CSS grid + `dir` on any ancestor.

**Per-instance context (`MAT_GRID_LIST_INSTANCE`)** — first port on the branch to publish a parent → child context. `MatGridList` normalises its own `rowHeight` + `cols` into a `MatGridListInstance` object and `useContextProvider`s it; each `MatGridTile` reads it via `useContext(_, DEFAULTS)` (SSR-safe fallback, matching the progress-bar/spinner lesson) to compute its own `aspect-ratio`. Global `MAT_GRID_LIST_CONFIG` remains for family-shape parity (empty today).

**File layout:**

```
src/qwik-material/grid-list/
├── intrinsic-elements.d.ts     # <mat-grid-list>, <mat-grid-tile>
├── grid-list-config.ts          # MatGridListConfig (empty) + MAT_GRID_LIST_CONFIG
├── grid-list-context.ts         # MatGridListInstance + MAT_GRID_LIST_INSTANCE + DEFAULTS
├── mat-grid-list.tsx            # container
├── mat-grid-tile.tsx            # child
├── public-api.ts                # 10 exports
├── index.ts                     # export * from './public-api'
├── mat-grid-list-scenarios.spec.tsx
└── SYNC.md

src/qwik-material/scss/grid-list/
├── grid-list.scss               # heavily rewritten (~25 LOC)
├── _grid-list-theme.scss        # synced byte-identical
├── _m2-grid-list.scss           # synced byte-identical
├── _m3-grid-list.scss           # synced byte-identical
└── grid-list-prebuilt.scss      # new — 3 :root var defaults
```

## 3. Component API

### 3.1 `MatGridList`

```ts
export interface MatGridListProps {
  /** Number of columns. Required. */
  cols: number;
  /** Row height mode. Default "1:1". Accepts:
   *  - fixed:  "100px", "5em", "250" (px assumed)
   *  - ratio:  "4:3" (width:height)
   *  - fit:    "fit" (distributes container height across rows) */
  rowHeight?: string | number;
  /** Space between tiles. Default "1px". */
  gutterSize?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Optional role — upstream defaults to none (decorative); users may
   *  pass "list" per grid-list.md guidance. */
  role?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
```

**Rendered DOM (fixed rowHeight, cols=3, gutterSize=8px):**

```html
<mat-grid-list class="mat-grid-list" cols="3" data-mode="fixed"
               style="--mat-grid-list-cols:3;--mat-grid-list-gutter:8px;--mat-grid-list-row-height:100px;">
  <!-- projected tiles -->
</mat-grid-list>
```

**Rendered DOM (ratio rowHeight="4:3"):**

```html
<mat-grid-list class="mat-grid-list" cols="3" data-mode="ratio"
               style="--mat-grid-list-cols:3;--mat-grid-list-gutter:1px;">
  <!-- tiles carry their own aspect-ratio inline -->
</mat-grid-list>
```

**Rendered DOM (fit):**

```html
<mat-grid-list class="mat-grid-list" cols="3" data-mode="fit"
               style="--mat-grid-list-cols:3;--mat-grid-list-gutter:1px;">
</mat-grid-list>
```

`cols` is reflected as an attribute for diagnostics/parity with upstream harness expectations.

### 3.2 `MatGridTile`

```ts
export interface MatGridTileProps {
  /** Rows this tile spans. Default 1. */
  rowspan?: number;
  /** Columns this tile spans. Default 1. */
  colspan?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
```

**Rendered DOM (rowspan=2, colspan=1, inside a ratio "4:3" grid):**

```html
<mat-grid-tile class="mat-grid-tile" rowspan="2" colspan="1"
               style="grid-column:span 1;grid-row:span 2;aspect-ratio:4 / 6;">
  <div class="mat-grid-tile-content"><!-- projected content --></div>
</mat-grid-tile>
```

**Rendered DOM (rowspan=1, colspan=2, inside a fixed grid):**

```html
<mat-grid-tile class="mat-grid-tile" rowspan="1" colspan="2"
               style="grid-column:span 2;grid-row:span 1;">
  <div class="mat-grid-tile-content"><!-- projected content --></div>
</mat-grid-tile>
```

- `rowspan`/`colspan` reflected as attributes (upstream parity).
- `.mat-grid-tile-content` wrapper preserved for CSS-selector parity.
- Aspect-ratio computed only in ratio mode. Formula: parent ratio `W:H`, tile aspect = `(colspan × W) / (rowspan × H)`. Gutter's contribution to the aspect is ignored (sub-pixel at typical 1px gutter — visually indistinguishable).

### 3.3 Context topology

```ts
// grid-list-config.ts — family-shape parity with prior 9 ports
export interface MatGridListConfig {}
export const MAT_GRID_LIST_CONFIG = createContextId<MatGridListConfig>(
  'qwik-material/grid-list-config',
);

// grid-list-context.ts — per-instance parent → child comms
export type MatGridListMode = 'fixed' | 'ratio' | 'fit';

export interface MatGridListInstance {
  rowHeight: string;
  cols: number;
  mode: MatGridListMode;
  ratioW: number;  // 1 in non-ratio modes
  ratioH: number;  // 1 in non-ratio modes
}

export const MAT_GRID_LIST_INSTANCE = createContextId<MatGridListInstance>(
  'qwik-material/grid-list-instance',
);

export const MAT_GRID_LIST_INSTANCE_DEFAULTS: MatGridListInstance = {
  rowHeight: '1:1',
  cols: 1,
  mode: 'ratio',
  ratioW: 1,
  ratioH: 1,
};
```

Both context reads use the SSR-safe default-fallback pattern: `useContext(MAT_GRID_LIST_CONFIG, {})` and `useContext(MAT_GRID_LIST_INSTANCE, MAT_GRID_LIST_INSTANCE_DEFAULTS)`. Standalone `MatGridTile` (used outside a `MatGridList`) renders sensibly against the defaults — mirrors upstream's `_gridList? = inject(MAT_GRID_LIST, {optional: true})`.

## 4. SCSS strategy

**Upstream inventory (4 files):**

| File | Action | Notes |
|---|---|---|
| `grid-list.scss` (96 LOC) | rewritten (~25 LOC) | strip header/footer/avatar/text/2-line rules + related `@use` imports; replace absolute-positioning rules with CSS-grid rules |
| `_grid-list-theme.scss` (76 LOC) | synced byte-identical | inert (theme mixin not wired) but kept for `diff -q` parity with upstream |
| `_m2-grid-list.scss` (21 LOC) | synced byte-identical | all 4 tokens are for dropped header/footer — inert |
| `_m3-grid-list.scss` (20 LOC) | synced byte-identical | same |

**Rewritten `grid-list.scss` — target shape:**

```scss
@use './m3-grid-list';

.mat-grid-list {
  display: grid;
  grid-template-columns: repeat(var(--mat-grid-list-cols, 1), 1fr);
  gap: var(--mat-grid-list-gutter, 1px);

  &[data-mode='fixed'] {
    grid-auto-rows: var(--mat-grid-list-row-height, auto);
  }

  &[data-mode='ratio'] {
    grid-auto-rows: min-content;
  }

  &[data-mode='fit'] {
    grid-auto-rows: 1fr;
  }
}

.mat-grid-tile {
  display: block;
  overflow: hidden;
  min-width: 0;
  min-height: 0;

  .mat-grid-tile-content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0;
    margin: 0;
  }
}
```

`@use '../cdk-stub' as cdk` is added **only if** one of the copied partials transitively `@use`s a `@angular/cdk` path — deferred to Task 2 (grep first; icon and divider precedent skipped it entirely).

**New `grid-list-prebuilt.scss`:**

```scss
@use './grid-list';

:root {
  --mat-grid-list-cols: 1;
  --mat-grid-list-gutter: 1px;
  --mat-grid-list-row-height: auto;
}
```

Iterative reconciliation loop (compiled CSS vs candidate `:root`) at Task 2 — precedent from every prior port.

## 5. Deviations catalog

10 numbered deviations documented in SYNC.md at Task 10.

1. **TileCoordinator (185 LOC) removed entirely.** Replaced by CSS grid's native `grid-auto-flow: row`. Upstream's greedy gap-fill behavior is not replicated; `grid-auto-flow: dense` is available as an opt-in CSS override.

2. **TileStyler + FixedTileStyler + RatioTileStyler + FitTileStyler (307 LOC) removed entirely.** All 3 rowHeight modes reimplemented in pure CSS + a tile-side `aspect-ratio` inline for ratio mode.

3. **Runtime re-layout on window resize removed.** Upstream's `kara` TODO about debounced resize handling becomes moot — CSS grid recomputes automatically.

4. **`@angular/cdk/bidi` `Directionality` dependency removed.** CSS grid respects `dir="rtl"` on any ancestor natively.

5. **`MatGridTileHeader`, `MatGridTileFooter`, `MatGridAvatarCssMatStyler` removed.** Scope decision. Users needing text overlays compose their own inside a tile's projected content. `MatLine` reuse also dropped (only referenced by the removed header/footer).

6. **Related SCSS blocks removed:** `.mat-grid-tile-header`, `.mat-grid-tile-footer`, `.mat-grid-avatar`, `.mat-grid-list-text`, `.mat-2-line`, header/footer positioning on `.mat-grid-tile-content`, plus `@use` imports of `list-common`, `layout-common`, `token-utils` (only needed by the removed blocks). The 4 M2/M3 typography tokens for header/footer text sizes remain in the synced partials but are inert at runtime.

7. **`throw Error()` guards removed.** Four upstream dev-mode throws are dropped:
   - Missing `cols` — TypeScript makes `cols` a required prop; runtime falls back to `1` on the CSS var.
   - Invalid ratio (`"4:3:2"`) — parse yields `NaN`, browser silently ignores invalid `aspect-ratio`.
   - `colspan > cols` — CSS grid clamps and wraps; no crash.
   - Invalid CSS in `rowHeight` — browser silently ignores invalid `grid-auto-rows`.

8. **Angular-specific removals:**
   - `@Input()` decorators + `NumberInput` coercion (`coerceNumberProperty`, `Math.round`) — replaced by TypeScript `number` types + inline `Math.max(1, Math.round(...))` where relevant.
   - `@ContentChildren(MatGridTile)` QueryList — no parent-side child enumeration.
   - `ngOnInit`, `ngAfterContentChecked` lifecycle — no lifecycle work; layout is declarative CSS.
   - `MAT_GRID_LIST` DI token with `useExisting: MatGridList` — replaced by per-instance `MAT_GRID_LIST_INSTANCE`.
   - `ɵTileCoordinator` private harness-only export — no harness ecosystem.
   - `MatGridListBase` + `TileStyleTarget` interfaces — internal to Angular's mutation contract; N/A.
   - `exportAs: 'matGridList'` / `'matGridTile'` — Angular template-ref concept, N/A.
   - `[attr.cols]` / `[attr.rowspan]` / `[attr.colspan]` host bindings — replaced by plain attribute passthrough on the custom element.

9. **`grid-list-module.ts`, `testing/`, upstream `public-api.ts`, `grid-list.spec.ts`, `grid-list.html`, `grid-tile.html`, `grid-tile-text.html`, `grid-list-base.ts` removed.** Trivial templates inlined into JSX. Testing harness N/A.

10. **`intrinsic-elements.d.ts` `data-mode` widening — deferred verification.** `data-*` attrs on custom elements typically don't need widening (Qwik's `HTMLAttributes` covers them). Task 1 verifies this; if typecheck balks, add `& {'data-mode'?: string}` extension.

## 6. Test strategy

### 6.1 Vitest — `mat-grid-list-scenarios.spec.tsx`

Smoke-only (no `createDOM(<MatGridList/>)` — hangs Qwik optimizer). ~15 `it()` blocks:

**5 live sanity tests:**
1. `MatGridList` symbol exported and is a Qwik component
2. `MatGridTile` symbol exported and is a Qwik component
3. `MAT_GRID_LIST_CONFIG.id === 'qwik-material/grid-list-config'`
4. `MAT_GRID_LIST_INSTANCE.id === 'qwik-material/grid-list-instance'` and `MAT_GRID_LIST_INSTANCE_DEFAULTS` has all 5 fields with correct values
5. Empty `MatGridListConfig` accepts `{}`; `MatGridListInstance` accepts a well-formed object literal

**7 describe.skip DOM-render stubs** (deferred to Playwright, each with a `see routes/mat-grid-list/<name>` pointer):
1. renders `<mat-grid-list>` with `class="mat-grid-list"`, `cols` attribute, `data-mode` attribute
2. renders projected `<mat-grid-tile>` children as grid items
3. `rowHeight="100px"` fixed mode — grid-auto-rows applied
4. `rowHeight="4:3"` ratio mode — tiles carry `aspect-ratio`
5. `rowHeight="fit"` fit mode — grid-auto-rows: 1fr
6. `rowspan`/`colspan` — tile spans multiple cells
7. `gutterSize="8px"` — gap applied to container

**3 describe.skip Angular-only stubs** (won't ever port):
1. `NumberInput` coercion for `cols`/`rowspan`/`colspan`
2. `@ContentChildren` QueryList / `MAT_GRID_LIST` DI token
3. Dev-mode throws for missing cols / invalid ratio / oversized colspan

Expected: 5 pass + 10 skip = 15 total. Full suite: **209 pass** + skips (up from 197 after divider).

### 6.2 Dev-app routes (7 under `src/qwik-cdk-dev-app/src/routes/mat-grid-list/`)

1. `basic/` — `cols="4" rowHeight="100px"` with 8 uniform tiles (2 rows).
2. `ratio/` — `cols="3" rowHeight="4:3"` with 6 tiles.
3. `fit/` — `cols="4" rowHeight="fit"` inside a container with `height: 400px`.
4. `spanning/` — `cols="4" rowHeight="100px"` with a `rowspan=2 colspan=2` hero + 6 fillers.
5. `ratio-spanning/` — `cols="4" rowHeight="4:3"` with a `colspan=2 rowspan=2` tile (compound aspect = 8/6).
6. `gutter/` — `cols="3" rowHeight="100px" gutterSize="16px"` with 6 tiles.
7. `aria-labeled/` — `cols="3" rowHeight="100px" role="list" aria-label="Photo grid"` with tiles `role="listitem"`.

### 6.3 Playwright specs (7 under `src/qwik-cdk-parity-tests/specs/material-grid-list/`)

Each spec targets one dev-app route. Locators: `page.locator('mat-grid-list')`, `page.locator('mat-grid-tile')` (custom-element tags, matching divider precedent).

- **basic.spec.ts** — `<mat-grid-list>` count = 1, `<mat-grid-tile>` count = 8, container `getComputedStyle().display === 'grid'`, first tile bounding-box width ≈ container width / 4 (±2px).
- **ratio.spec.ts** — first tile bounding-box height/width ≈ 3/4 (±2px tolerance).
- **fit.spec.ts** — 2-row layout fills 400px container; each row ≈ 200px minus gutter.
- **spanning.spec.ts** — hero tile bounding-box width ≈ 2 × single-tile width, height ≈ 2 × row height + gutter.
- **ratio-spanning.spec.ts** — compound aspect on the 2×2 tile ≈ 8/6.
- **gutter.spec.ts** — computed gap on container ≈ 16px.
- **aria-labeled.spec.ts** — `[role="list"]` on container, `[role="listitem"]` on tiles, `aria-label="Photo grid"`.

## 7. Task decomposition

10 tasks. Every commit uses scope `multiple` per branch convention.

| # | Task | Deliverable |
|---|---|---|
| 1 | Wire entry-point | `package.json` `./grid-list` + `./grid-list-prebuilt.css`; `vite.config.ts` entries + sassEntries; `intrinsic-elements.d.ts`; empty `index.ts`. Build succeeds with tolerated ENOENT until Task 2. |
| 2 | Copy + rewrite SCSS | 3 partials byte-identical; new `grid-list.scss` (~25 LOC); new `grid-list-prebuilt.scss` (3 `:root` vars). Iterative reconciliation. Verify cdk-stub rewrite need. |
| 3 | Config + per-instance context | `grid-list-config.ts` + `grid-list-context.ts` + 2 smoke specs (context ids + DEFAULTS shape). |
| 4 | `MatGridList` component | `mat-grid-list.tsx` + smoke spec. Publishes `MAT_GRID_LIST_INSTANCE`. |
| 5 | `MatGridTile` component | `mat-grid-tile.tsx` + smoke spec. Reads instance with DEFAULTS fallback. |
| 6 | Extend `QwikMaterialProvider` | 11th `useContextProvider` after `MAT_DIVIDER_CONFIG`. Purely additive. 3 provider specs. |
| 7 | `public-api.ts` + build validation | 10 exports; replace Task 1 stub. `dist/grid-list/public-api.d.ts` clean. |
| 8 | Vitest scenario port | `mat-grid-list-scenarios.spec.tsx` per §6.1. Full suite 209 pass. |
| 9 | Dev-app routes + Playwright specs | 7 routes + 7 specs per §6.2/§6.3. Dev-app build+preview exit 0. |
| 10 | SYNC.md + pipeline verification | 10 deviations, 9-row sync-state table, header referencing 9 prior port SYNC.md files. `pnpm test:qwik-material` exit 0. |

## 8. Global constraints

- **Commit hook scope:** `multiple` on every commit.
- **Zero exported classes** in `src/qwik-material/grid-list/`.
- **Zero SSR globals** (`document`, `window`, `navigator`, `getComputedStyle`, `requestAnimationFrame`) outside `.spec.tsx`.
- **Zero `@builder.io/qwik/build` `isBrowser` imports.**
- **Every `useContext` call carries a defaults fallback** (Progress Bar/Spinner lesson).
- **Custom-element tag names must match upstream selectors** — `<mat-grid-list>`, `<mat-grid-tile>`.
- **No `--no-verify`, no hook bypass.**
- **Pipeline gate at Task 10:** `pnpm test:qwik-material` exit 0 across build + vitest + lint-no-ssr-leaks + typecheck.
