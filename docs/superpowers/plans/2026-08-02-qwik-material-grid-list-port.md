# qwik-material Grid List Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/grid-list/` (~1000 LOC across 8 upstream .ts + 4 .scss + 3 .html files) into a `qwik-material/grid-list` entry-point as two custom-element wrappers — `<MatGridList>` (container) + `<MatGridTile>` (child) — supporting the 3 rowHeight modes (fixed / ratio / fit) and `rowspan`/`colspan` via **pure CSS grid** (no JS geometry). Kills ~500 LOC of upstream TileCoordinator + TileStyler math entirely.

**Architecture:** `MatGridList` is a stateless `component$` that publishes a per-instance `MAT_GRID_LIST_INSTANCE` context (parsed rowHeight + cols + mode + ratio parts). `MatGridTile` reads that context via `useContext(_, DEFAULTS)` — SSR-safe fallback so a standalone tile still renders — and computes its own inline `grid-column: span colspan; grid-row: span rowspan;` plus, in ratio mode, `aspect-ratio: (colspan × W) / (rowspan × H)`. Both components also read a global `MAT_GRID_LIST_CONFIG` (empty, family-shape parity with the prior 9 ports). `data-mode="fixed|ratio|fit"` attribute on the container drives CSS branching for `grid-auto-rows`.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./grid-list`. New prebuilt CSS entry: `./grid-list-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-08-02-qwik-material-grid-list-port-design.md](../specs/2026-08-02-qwik-material-grid-list-port-design.md). Read §2 (Architecture — CSS grid strategy), §3 (Component API — 2 components + context topology), §4 (SCSS — rewritten grid-list.scss), §5 (10 deviations) before starting any port task.
- **Material source reference:** `src/material/grid-list/`. Every port task names the exact source file(s) it mirrors (or explicitly removes).
- **DOM parity — custom-element tags:** upstream renders `<mat-grid-list>` and `<mat-grid-tile>` as real custom elements. Port preserves both via JSX augmentation in `intrinsic-elements.d.ts` typed as `QwikIntrinsicElements['div']`. Whether `data-mode` needs `& {...}` widening is verified in Task 1 (expected outcome: no widening — `data-*` attrs are covered by base HTMLAttributes).
- **DOM parity — class ladder:** `mat-grid-list` (static on container), `mat-grid-tile` (static on child), `mat-grid-tile-content` (static on inner wrapper `<div>`).
- **DOM parity — container attributes:** `class="mat-grid-list"`, `cols="N"` (reflected), `data-mode="fixed|ratio|fit"` (drives CSS), inline `style` with `--mat-grid-list-cols`, `--mat-grid-list-gutter`, and `--mat-grid-list-row-height` (fixed mode only).
- **DOM parity — tile attributes:** `class="mat-grid-tile"`, `rowspan="N"` + `colspan="N"` (both reflected), inline `style` with `grid-column: span N; grid-row: span N;` and (ratio mode only) `aspect-ratio: (colspan × W) / (rowspan × H)`.
- **DOM parity — inner template:** `MatGridTile` renders `<mat-grid-tile><div class="mat-grid-tile-content"><Slot /></div></mat-grid-tile>` — the wrapper div matches upstream's `grid-tile.html` for CSS-selector parity.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. `grid-list.ts` → `mat-grid-list.tsx`, `grid-tile.ts` → `mat-grid-tile.tsx`.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/grid-list/SYNC.md`.
- **No RxJS.** **No `HttpClient` / XHR.**
- **No exported classes** in `grid-list/public-api.ts`.
- **SSR safety:** grid-list is a pure computation from props — no `useVisibleTask$`, no browser globals. No `document.` / `window.` / `navigator.` / `getComputedStyle(` / `requestAnimationFrame(`. No `isBrowser` import from `@builder.io/qwik/build`.
- **Every `useContext` call carries a defaults fallback** (Progress Bar / Progress Spinner lesson). Both `useContext(MAT_GRID_LIST_CONFIG, {})` and `useContext(MAT_GRID_LIST_INSTANCE, MAT_GRID_LIST_INSTANCE_DEFAULTS)` MUST include the second argument. A bare `useContext(MAT_GRID_LIST_INSTANCE)` would throw `QError_notFoundContext` (Code 13) when a tile is used outside a container.
- **Commit message scope:** `multiple` for every commit.
- **Pnpm version:** `pnpm@11.7.0`. Don't change.
- **No Bazel changes.** **No upstream CI integration.**
- **Class-list cast pattern (established):** `.filter(Boolean) as string[]`. Qwik's `ClassList` type rejects the mixed `(string | ReadonlyArray<string>)[]` shape.
- **`NumberInput` + `coerceNumberProperty` omitted.** Qwik JSX passes numbers directly. Consumer writes `<MatGridList cols={3}>` — no attribute-string coercion.
- **No @angular/cdk SCSS rewrite** — grid-list.scss's upstream `@use` block references `list-common`, `layout-common`, `token-utils` — NONE of which come from `@angular/cdk`. Task 2 verifies via grep. Expected outcome: skip the cdk-stub rewrite (matches Icon + Divider precedent).
- **Spec files use smoke variant:** `createDOM(<component$/>)` hangs the Qwik optimizer worker under vitest. Grid-list `.spec.tsx` files use module-import assertions. Real DOM assertions live in Task 9's Playwright parity specs.
- **Scope decision (spec §5 deviation #5):** `MatGridTileHeader`, `MatGridTileFooter`, `MatGridAvatarCssMatStyler` are OUT OF SCOPE. `MatLine` reuse dropped. Related SCSS blocks stripped from `grid-list.scss` per spec §4.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `grid-list` entry-point into the existing qwik-material package

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from earlier ports).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/grid-list/intrinsic-elements.d.ts`
- Create: `src/qwik-material/grid-list/index.ts` (empty stub — Task 7 replaces)

**Interfaces:**
- Consumes: existing package scaffolding (10 entry-points as of divider port).
- Produces: `pnpm -C src/qwik-material build` still succeeds (existing 9 prebuilt CSS files still emit; no grid-list CSS yet). Type resolution for `@angular-community/qwik-material/grid-list` returns an empty module. `<mat-grid-list>` and `<mat-grid-tile>` are legal JSX elements.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./grid-list` after `./divider`, and `./grid-list-prebuilt.css` after `./divider-prebuilt.css`. Final relevant block:

```json
"./divider": {
  "qwik": "./divider/index.ts",
  "types": "./dist/divider/index.d.ts",
  "import": "./dist/divider/index.js"
},
"./grid-list": {
  "qwik": "./grid-list/index.ts",
  "types": "./dist/grid-list/index.d.ts",
  "import": "./dist/grid-list/index.js"
},
"./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
"./button-prebuilt.css": "./dist/button-prebuilt.css",
"./card-prebuilt.css": "./dist/card-prebuilt.css",
"./toolbar-prebuilt.css": "./dist/toolbar-prebuilt.css",
"./badge-prebuilt.css": "./dist/badge-prebuilt.css",
"./icon-prebuilt.css": "./dist/icon-prebuilt.css",
"./progress-bar-prebuilt.css": "./dist/progress-bar-prebuilt.css",
"./progress-spinner-prebuilt.css": "./dist/progress-spinner-prebuilt.css",
"./divider-prebuilt.css": "./dist/divider-prebuilt.css",
"./grid-list-prebuilt.css": "./dist/grid-list-prebuilt.css",
"./scss/*": "./scss/*"
```

- [ ] **Step 2: Extend `src/qwik-material/vite.config.ts` `entries` array + `sassEntries` list**

Read the file. `entries` currently reads `['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar', 'progress-spinner', 'divider']`. Append `'grid-list'`:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar', 'progress-spinner', 'divider', 'grid-list'];
```

`sassEntries` currently ends with `['scss/divider/divider-prebuilt.scss', 'dist/divider-prebuilt.css']`. Append the grid-list pair:

```ts
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
  ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
  ['scss/toolbar/toolbar-prebuilt.scss', 'dist/toolbar-prebuilt.css'],
  ['scss/badge/badge-prebuilt.scss', 'dist/badge-prebuilt.css'],
  ['scss/icon/icon-prebuilt.scss', 'dist/icon-prebuilt.css'],
  ['scss/progress-bar/progress-bar-prebuilt.scss', 'dist/progress-bar-prebuilt.css'],
  ['scss/progress-spinner/progress-spinner-prebuilt.scss', 'dist/progress-spinner-prebuilt.css'],
  ['scss/divider/divider-prebuilt.scss', 'dist/divider-prebuilt.css'],
  ['scss/grid-list/grid-list-prebuilt.scss', 'dist/grid-list-prebuilt.css'],
];
```

- [ ] **Step 3: Create `src/qwik-material/grid-list/intrinsic-elements.d.ts`**

Both custom elements type as `QwikIntrinsicElements['div']` (grid-list is a block container; grid-tile is a block child). No custom camelCase attributes — `data-mode` is a data-attribute (not custom-cased) and is covered by base HTMLAttributes. No `& {...}` widening needed. Contents:

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Grid List's custom-element
 * tag names. Upstream renders <mat-grid-list> and <mat-grid-tile> as actual
 * custom elements; external CMS styles may target the tags directly (not
 * just the .mat-grid-list / .mat-grid-tile classes). Typed as
 * QwikIntrinsicElements['div'] — both are block-level container elements.
 * data-mode + inline style are covered by base HTMLAttributes, no widening
 * needed. See design spec §5 deviation #10.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-grid-list': QwikIntrinsicElements['div'];
      'mat-grid-tile': QwikIntrinsicElements['div'];
    }
  }
}
```

- [ ] **Step 4: Create `src/qwik-material/grid-list/index.ts`** (empty stub)

Contents:

```ts
export {};
```

Task 7 replaces this with `export * from './public-api';`.

- [ ] **Step 5: Run the build to confirm the stub compiles**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. The dts plugin generates `dist/grid-list/index.d.ts` with `export {};`. The Sass pipeline logs a `skipping scss/grid-list/grid-list-prebuilt.scss — not yet present.` warning (ENOENT-tolerant guard); this is EXPECTED — Task 2 creates the SCSS file. Confirm the existing 9 prebuilt CSS files still emit:

```bash
ls src/qwik-material/dist/*.css
```

Expected: `dialog-prebuilt.css`, `button-prebuilt.css`, `card-prebuilt.css`, `toolbar-prebuilt.css`, `badge-prebuilt.css`, `icon-prebuilt.css`, `progress-bar-prebuilt.css`, `progress-spinner-prebuilt.css`, `divider-prebuilt.css`. NOT `grid-list-prebuilt.css` yet.

`ls src/qwik-material/dist/grid-list/`:

```bash
ls src/qwik-material/dist/grid-list/
```

Expected: `index.d.ts`, `index.js`, `index.js.map`. `dist/grid-list/index.d.ts` contents: `export {};`.

- [ ] **Step 6: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. The `intrinsic-elements.d.ts` from Step 3 makes `<mat-grid-list>` and `<mat-grid-tile>` legal JSX elements.

- [ ] **Step 7: Verify `data-mode` typecheck (no widening needed)**

Confirm that `<mat-grid-list data-mode="fixed">` typechecks without needing an `& {'data-mode'?: string}` extension in `intrinsic-elements.d.ts`. Write a throwaway one-liner test:

```bash
cat > /tmp/gridlist-datamode-check.tsx << 'EOF'
import '@builder.io/qwik';
const x = <mat-grid-list data-mode="fixed" style={{'--mat-grid-list-cols': 3}}></mat-grid-list>;
EOF
```

Then run typecheck via a quick throwaway (or just trust that Step 6's full typecheck already covers this — if Step 6 exit 0 then `data-mode` is already accepted). Delete the throwaway:

```bash
rm -f /tmp/gridlist-datamode-check.tsx
```

If Step 6 typecheck fails specifically on `data-mode` (unlikely — Qwik's HTMLAttributes includes an index signature for `data-*`), extend the intrinsic-elements typing:

```ts
'mat-grid-list': QwikIntrinsicElements['div'] & {'data-mode'?: 'fixed' | 'ratio' | 'fit'};
```

Otherwise, leave the typing as declared in Step 3.

- [ ] **Step 8: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/grid-list/intrinsic-elements.d.ts \
  src/qwik-material/grid-list/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): wire qwik-material/grid-list entry-point + <mat-grid-list>/<mat-grid-tile> JSX augmentation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SCSS + prebuilt CSS

### Task 2: Copy 3 SCSS partials byte-identical + rewrite `grid-list.scss` (~25 LOC) + new `grid-list-prebuilt.scss`

**Reference source:** `src/material/grid-list/*.scss` (4 files, ~213 total LOC). Confirmed via `grep '@angular/cdk' src/material/grid-list/*.scss`: zero references. NO `@use '../cdk-stub' as cdk` rewrite needed — third port after Icon + Divider to skip.

**Files:**
- Create: `src/qwik-material/scss/grid-list/_grid-list-theme.scss` (byte-identical copy)
- Create: `src/qwik-material/scss/grid-list/_m2-grid-list.scss` (byte-identical)
- Create: `src/qwik-material/scss/grid-list/_m3-grid-list.scss` (byte-identical)
- Create: `src/qwik-material/scss/grid-list/grid-list.scss` (heavily REWRITTEN — ~25 LOC of CSS grid rules; drops header/footer/avatar/text/2-line blocks + related @use imports)
- Create: `src/qwik-material/scss/grid-list/grid-list-prebuilt.scss` (new — 3 `:root` var defaults)

**Interfaces:**
- Consumes: existing SCSS ecosystem — sass compiler picks up `scss/grid-list/grid-list-prebuilt.scss` from Task 1's vite.config.ts change.
- Produces: `dist/grid-list-prebuilt.css` after `pnpm -C src/qwik-material build`. Compiled CSS contains `.mat-grid-list` with `display: grid` + `[data-mode='fixed'|'ratio'|'fit']` branches, and `.mat-grid-tile` + `.mat-grid-tile-content` rules. Every `--mat-*` reference has a matching `:root` declaration.

- [ ] **Step 1: Byte-identical copy of the 3 SCSS partials that don't need rewriting**

```bash
cp src/material/grid-list/_grid-list-theme.scss  src/qwik-material/scss/grid-list/_grid-list-theme.scss
cp src/material/grid-list/_m2-grid-list.scss     src/qwik-material/scss/grid-list/_m2-grid-list.scss
cp src/material/grid-list/_m3-grid-list.scss     src/qwik-material/scss/grid-list/_m3-grid-list.scss
```

Verify byte-identical:

```bash
diff -q src/material/grid-list/_grid-list-theme.scss  src/qwik-material/scss/grid-list/_grid-list-theme.scss
diff -q src/material/grid-list/_m2-grid-list.scss     src/qwik-material/scss/grid-list/_m2-grid-list.scss
diff -q src/material/grid-list/_m3-grid-list.scss     src/qwik-material/scss/grid-list/_m3-grid-list.scss
```

Expected: no output on any (empty stdout for each).

- [ ] **Step 2: Sanity-check ALL 4 upstream SCSS files (including the one about to be rewritten) have zero `@angular/cdk` references**

```bash
grep -RnE "^@use '@angular/cdk'" src/material/grid-list/*.scss
```

Expected: no output. This confirms no `cdk-stub` rewrite is needed. Different from badge/toolbar/dialog/progress-bar/progress-spinner SCSS which DID reference `@angular/cdk`. Note this outcome verbatim in the SYNC.md sync-state row in Task 10.

- [ ] **Step 3: Create the rewritten `src/qwik-material/scss/grid-list/grid-list.scss`**

Upstream is 96 LOC with `list-common`, `layout-common`, `token-utils` imports and blocks for `.mat-grid-tile-header`, `.mat-grid-tile-footer`, `.mat-grid-avatar`, `.mat-grid-list-text`, `.mat-2-line`, `.mat-grid-tile-content` header/footer positioning. All dropped per spec §4 + §5 deviation #5. Replacement content:

```scss
// qwik-material grid-list styling — CSS-grid strategy.
// Upstream uses absolute positioning + JS-computed inline top/left/width/height
// via TileCoordinator + TileStyler. Both are dropped entirely (spec §5
// deviations #1 & #2) — CSS grid handles layout declaratively.

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

Notes for the implementer:
- `@use './m3-grid-list';` remains for future M3 typography token access; it's inert today (the referenced tokens `grid-list-tile-header-*-text-size` are for the dropped header/footer components) but kept for parity with upstream partial structure.
- `min-width: 0; min-height: 0;` on `.mat-grid-tile` prevents grid items from overflowing their tracks when their content is naturally wider (standard CSS grid best practice).
- Do NOT `@use '../cdk-stub' as cdk` — grid-list's upstream `.scss` uses only `list-common`, `layout-common`, `token-utils` (all from `../core/`), none of which come from `@angular/cdk`.

- [ ] **Step 4: Create the initial `src/qwik-material/scss/grid-list/grid-list-prebuilt.scss`**

Start with a candidate `:root` block for the 3 CSS custom properties the rewritten `grid-list.scss` reads. Contents (candidate — Step 6 verifies + expands as needed):

```scss
// Grid-list prebuilt CSS. Wraps the port's grid-list.scss with :root defaults
// for every --mat-grid-list-* variable it emits. See design spec §4.

@use './grid-list';

:root {
  --mat-grid-list-cols: 1;
  --mat-grid-list-gutter: 1px;
  --mat-grid-list-row-height: auto;
}
```

Note: `@use './grid-list';` MUST come before the `:root` block (Sass requires `@use` first). The candidate above places it correctly — do NOT reorder.

- [ ] **Step 5: Run the build to emit `dist/grid-list-prebuilt.css`**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. `dist/grid-list-prebuilt.css` present:

```bash
ls src/qwik-material/dist/grid-list-prebuilt.css
```

Expected: file listed.

- [ ] **Step 6: Grep the emitted CSS for every `--mat-*` reference and reconcile against the `:root` block**

The KEY step. The candidate is a plan-author's guess; the compiled CSS is the source of truth (Icon Task 2 precedent — plan said `--mat-icon-icon-color` but real emitted was `--mat-icon-color`; Progress Bar Task 2 discovered 2 vars beyond candidate; Progress Spinner Task 2 removed 1 phantom).

```bash
# What the compiled CSS actually references
grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/grid-list-prebuilt.css | sort -u
```

Compare to what the `:root` block declares:

```bash
grep -oE '^\s*--mat-[a-z-]+' src/qwik-material/scss/grid-list/grid-list-prebuilt.scss | sort -u
```

For every `var(--mat-*)` reference NOT covered by a `:root` line:
- The rewritten `grid-list.scss` uses only 3 vars (`--mat-grid-list-cols`, `--mat-grid-list-gutter`, `--mat-grid-list-row-height`). If any additional `--mat-*` reference sneaks in via a transitively-included partial, add a `:root` declaration with the M3 default from `_m3-grid-list.scss`.

For every `:root` declaration NOT actually referenced in the compiled CSS: remove it (phantom variable).

Rebuild after every edit until the diff is empty:

```bash
diff \
  <(grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/grid-list-prebuilt.css | sed 's/var(//' | sort -u) \
  <(grep -oE '^[[:space:]]*--mat-[a-z-]+' src/qwik-material/scss/grid-list/grid-list-prebuilt.scss | sed 's/^[[:space:]]*//' | sort -u)
```

Expected: no output.

- [ ] **Step 7: Confirm the structural CSS rules survived**

```bash
grep -cE '^\.mat-grid-list' src/qwik-material/dist/grid-list-prebuilt.css
```

Expected: at least `1` (the top-level `.mat-grid-list` rule). Higher is fine — nested `[data-mode]` selectors may or may not be emitted at top level depending on how Sass flattens them.

```bash
grep -cE '\.mat-grid-tile' src/qwik-material/dist/grid-list-prebuilt.css
```

Expected: at least `2` (`.mat-grid-tile` + `.mat-grid-tile-content`).

```bash
grep -E 'display:\s*grid' src/qwik-material/dist/grid-list-prebuilt.css
```

Expected: at least one hit — the container declares `display: grid`.

- [ ] **Step 8: Confirm existing 9 prebuilt CSS files still emit**

```bash
ls src/qwik-material/dist/*.css
```

Expected: 10 files (dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list).

- [ ] **Step 9: Commit**

```bash
git add \
  src/qwik-material/scss/grid-list/_grid-list-theme.scss \
  src/qwik-material/scss/grid-list/_m2-grid-list.scss \
  src/qwik-material/scss/grid-list/_m3-grid-list.scss \
  src/qwik-material/scss/grid-list/grid-list.scss \
  src/qwik-material/scss/grid-list/grid-list-prebuilt.scss
git commit -m "$(cat <<'EOF'
feat(multiple): grid-list SCSS chain (3 partials synced + rewritten grid-list.scss + prebuilt defaults)

3 upstream partials copied byte-identical (_grid-list-theme, _m2-grid-list,
_m3-grid-list). grid-list.scss REWRITTEN to ~25 LOC of CSS-grid rules —
drops absolute-positioning approach and all header/footer/avatar/text/2-line
selectors per spec §4 + §5 deviation #5. No @use '@angular/cdk' rewrite
needed (third port after Icon + Divider to skip).

grid-list-prebuilt.scss declares 3 :root defaults matching the CSS custom
properties emitted by the rewritten grid-list.scss. Verified by grepping
dist/grid-list-prebuilt.css and reconciling against the :root block until
the diff is empty.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Config token + per-instance context

### Task 3: `MatGridListConfig` + `MAT_GRID_LIST_CONFIG` + `MatGridListInstance` + `MAT_GRID_LIST_INSTANCE`

**Reference source:** design spec §3.3. Upstream `MatGridListBase` interface (`grid-list-base.ts`) is superseded by our `MatGridListInstance` per-instance context. The empty `MatGridListConfig = {}` is a family-shape parity token for future extensibility (same pattern as divider Task 3).

**Files:**
- Create: `src/qwik-material/grid-list/grid-list-config.ts`
- Create: `src/qwik-material/grid-list/grid-list-context.ts`
- Create: `src/qwik-material/grid-list/grid-list-context.spec.ts` (covers BOTH files with 4 it() blocks)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface MatGridListConfig {}` (empty)
  - `const MAT_GRID_LIST_CONFIG: ContextId<MatGridListConfig>` with id `'qwik-material/grid-list-config'`
  - `type MatGridListMode = 'fixed' | 'ratio' | 'fit'`
  - `interface MatGridListInstance` with 5 fields: `rowHeight: string`, `cols: number`, `mode: MatGridListMode`, `ratioW: number`, `ratioH: number`
  - `const MAT_GRID_LIST_INSTANCE: ContextId<MatGridListInstance>` with id `'qwik-material/grid-list-instance'`
  - `const MAT_GRID_LIST_INSTANCE_DEFAULTS: MatGridListInstance` — sensible defaults for standalone tiles

- [ ] **Step 1: Create `src/qwik-material/grid-list/grid-list-config.ts`**

Contents:

```ts
import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every <MatGridList> in a subtree. Consumers provide
 * this via <QwikMaterialProvider matGridListConfig={...}>. Currently empty
 * — the grid-list has no consumer-configurable defaults today. Kept for
 * family shape parity with the other qwik-material components and to
 * allow future fields without an API break.
 */
export interface MatGridListConfig {}

/**
 * Context id used by <MatGridList> to read config. The id string is
 * exposed publicly and MUST remain stable across releases — consumers may
 * inject it directly in advanced scenarios.
 */
export const MAT_GRID_LIST_CONFIG = createContextId<MatGridListConfig>(
  'qwik-material/grid-list-config',
);
```

- [ ] **Step 2: Create `src/qwik-material/grid-list/grid-list-context.ts`**

Contents:

```ts
import {createContextId} from '@builder.io/qwik';

/** Row-height mode for a MatGridList. Selected via the container's `data-mode` attribute. */
export type MatGridListMode = 'fixed' | 'ratio' | 'fit';

/**
 * Per-instance context published by <MatGridList> and consumed by every
 * descendant <MatGridTile>. Contains the parent's parsed rowHeight, cols,
 * mode, and (in ratio mode) the ratio numerator/denominator that each tile
 * needs to compute its own inline `aspect-ratio`.
 *
 * First port on the branch to use a per-instance context in addition to
 * the global config token — precedent for future container-with-children
 * ports (tabs, stepper, etc.). See design spec §3.3.
 */
export interface MatGridListInstance {
  /** Normalised rowHeight string: "100px" | "4:3" | "fit" | "5em" | etc. */
  rowHeight: string;
  /** Number of columns in the parent grid-list. Always >= 1. */
  cols: number;
  /** Which of the 3 rowHeight modes is active. Drives CSS grid-auto-rows. */
  mode: MatGridListMode;
  /** Ratio numerator (parsed from "W:H"). Set to 1 in non-ratio modes so
   *  aspect-ratio computation is safe against divide-by-zero. */
  ratioW: number;
  /** Ratio denominator (parsed from "W:H"). Set to 1 in non-ratio modes. */
  ratioH: number;
}

/**
 * Context id used by <MatGridTile> to read its parent's layout state.
 * Stable id string.
 */
export const MAT_GRID_LIST_INSTANCE = createContextId<MatGridListInstance>(
  'qwik-material/grid-list-instance',
);

/**
 * Sensible defaults so a standalone <MatGridTile> (used outside a
 * <MatGridList> ancestor) still renders. Mirrors upstream's
 * `_gridList? = inject(MAT_GRID_LIST, {optional: true})` pattern.
 *
 * Every useContext(MAT_GRID_LIST_INSTANCE, ...) call MUST pass these
 * defaults as the second argument. A bare useContext without a fallback
 * would throw QError_notFoundContext (Code 13) when a tile is rendered
 * standalone. See Progress Bar / Progress Spinner post-mortem.
 */
export const MAT_GRID_LIST_INSTANCE_DEFAULTS: MatGridListInstance = {
  rowHeight: '1:1',
  cols: 1,
  mode: 'ratio',
  ratioW: 1,
  ratioH: 1,
};
```

- [ ] **Step 3: Create `src/qwik-material/grid-list/grid-list-context.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import {MAT_GRID_LIST_CONFIG, type MatGridListConfig} from './grid-list-config';
import {
  MAT_GRID_LIST_INSTANCE,
  MAT_GRID_LIST_INSTANCE_DEFAULTS,
  type MatGridListInstance,
  type MatGridListMode,
} from './grid-list-context';

describe('MAT_GRID_LIST_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_GRID_LIST_CONFIG.id).toBe('qwik-material/grid-list-config');
  });

  it('MatGridListConfig accepts an empty object', () => {
    const cfg: MatGridListConfig = {};
    expect(cfg).toBeDefined();
  });
});

describe('MAT_GRID_LIST_INSTANCE', () => {
  it('has the expected context id string', () => {
    expect(MAT_GRID_LIST_INSTANCE.id).toBe('qwik-material/grid-list-instance');
  });

  it('MAT_GRID_LIST_INSTANCE_DEFAULTS has all 5 fields with sensible values', () => {
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.rowHeight).toBe('1:1');
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.cols).toBe(1);
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.mode).toBe('ratio');
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.ratioW).toBe(1);
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS.ratioH).toBe(1);
  });

  it('MatGridListInstance accepts a well-formed object', () => {
    const inst: MatGridListInstance = {
      rowHeight: '4:3',
      cols: 3,
      mode: 'ratio' satisfies MatGridListMode,
      ratioW: 4,
      ratioH: 3,
    };
    expect(inst.mode).toBe('ratio');
  });
});
```

- [ ] **Step 4: Run the spec**

```bash
pnpm -C src/qwik-material test grid-list/grid-list-context
```

Expected: 5/5 passing, exit 0.

- [ ] **Step 5: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add \
  src/qwik-material/grid-list/grid-list-config.ts \
  src/qwik-material/grid-list/grid-list-context.ts \
  src/qwik-material/grid-list/grid-list-context.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatGridListConfig + MAT_GRID_LIST_INSTANCE per-instance context

MatGridListConfig is intentionally empty (family-shape parity token).
MatGridListInstance is a per-instance context published by MatGridList and
consumed by MatGridTile — carries the parent's parsed rowHeight/cols/mode
and ratio parts so each tile can compute its own inline aspect-ratio in
ratio mode. First port on the branch with a per-instance context in
addition to the global config.

MAT_GRID_LIST_INSTANCE_DEFAULTS provides SSR-safe fallback for standalone
tiles (matches upstream's optional MAT_GRID_LIST inject).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Container component

### Task 4: `<MatGridList>` component

**Reference source:** `src/material/grid-list/grid-list.ts` (188 LOC — MatGridList Angular component with 3 inputs, `@ContentChildren` QueryList, `ngAfterContentChecked` layout, 3 TileStyler subclasses instantiated based on rowHeight mode). The Angular runtime layout pass is entirely replaced by publishing state to the per-instance context; tiles read it and self-position.

**Files:**
- Create: `src/qwik-material/grid-list/mat-grid-list.tsx`
- Create: `src/qwik-material/grid-list/mat-grid-list.spec.tsx`

**Interfaces:**
- Consumes:
  - `MAT_GRID_LIST_CONFIG` + `MatGridListConfig` from Task 3
  - `MAT_GRID_LIST_INSTANCE` + `MatGridListInstance` + `MatGridListMode` from Task 3
- Produces:
  - `interface MatGridListProps` — 8 fields per spec §3.1 (cols required, rowHeight/gutterSize/role/aria trio/class/id optional)
  - `const MatGridList: Component<MatGridListProps>`
  - Publishes `MAT_GRID_LIST_INSTANCE` via `useContextProvider` so descendant `<MatGridTile>` can read parent state.

- [ ] **Step 1: Create `src/qwik-material/grid-list/mat-grid-list.tsx`**

Contents:

```tsx
import {component$, Slot, useContext, useContextProvider} from '@builder.io/qwik';
import {MAT_GRID_LIST_CONFIG, type MatGridListConfig} from './grid-list-config';
import {
  MAT_GRID_LIST_INSTANCE,
  type MatGridListInstance,
  type MatGridListMode,
} from './grid-list-context';

/**
 * Props for <MatGridList>. Renders a <mat-grid-list> custom element as a
 * CSS-grid container. `cols` is required; `rowHeight` defaults to "1:1"
 * (matches upstream); `gutterSize` defaults to "1px". See design spec §3.1
 * for rendered DOM shape.
 */
export interface MatGridListProps {
  /** Number of columns. Required. Values less than 1 are clamped to 1. */
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
  /** Optional role — upstream defaults to none (decorative); pass "list"
   *  per grid-list.md guidance when the tiles hold non-interactive content. */
  role?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const CONFIG_DEFAULTS: MatGridListConfig = {};

/**
 * Parse a raw rowHeight prop into a normalised MatGridListInstance.
 * Extracted to the module level (not inline in component$) so it doesn't
 * get captured as a Qwik QRL reassignment (Badge Task 7 precedent —
 * inline mutation inside component$ triggers "Illegal reassignment of
 * import" at Rollup time).
 */
function parseInstance(rawRowHeight: string | number | undefined, rawCols: number): MatGridListInstance {
  const rowHeight = typeof rawRowHeight === 'number'
    ? String(rawRowHeight)
    : (rawRowHeight ?? '1:1');
  const cols = Math.max(1, Math.round(rawCols));

  if (rowHeight === 'fit') {
    return {rowHeight, cols, mode: 'fit', ratioW: 1, ratioH: 1};
  }
  if (rowHeight.includes(':')) {
    const [w, h] = rowHeight.split(':').map(parseFloat);
    // Invalid ratio (NaN) passes through — browser silently ignores
    // invalid aspect-ratio in the tile's inline style (spec §5 deviation #7).
    return {rowHeight, cols, mode: 'ratio', ratioW: w, ratioH: h};
  }
  return {rowHeight, cols, mode: 'fixed', ratioW: 1, ratioH: 1};
}

export const MatGridList = component$<MatGridListProps>(props => {
  // Read config for family-shape consistency, even though it currently has
  // no fields to resolve. The read pattern is established so future config
  // fields plug in without a component-file rewrite.
  useContext(MAT_GRID_LIST_CONFIG, CONFIG_DEFAULTS);

  const instance = parseInstance(props.rowHeight, props.cols);
  const gutterSize = props.gutterSize ?? '1px';

  // Publish the per-instance context so descendant MatGridTile components
  // can read the parent's layout state.
  useContextProvider(MAT_GRID_LIST_INSTANCE, instance);

  const classes = ['mat-grid-list', props.class].filter(Boolean) as string[];

  // Build inline style: cols + gutter always, row-height only in fixed mode
  // (ratio + fit derive row height from grid-auto-rows CSS directly).
  const style: Record<string, string> = {
    '--mat-grid-list-cols': String(instance.cols),
    '--mat-grid-list-gutter': gutterSize,
  };
  if (instance.mode === 'fixed') {
    // Normalise unit-less fixed value to px (mirrors upstream's normalizeUnits).
    const rh = instance.rowHeight;
    const normalised = /[a-z%]$/i.test(rh) ? rh : `${rh}px`;
    style['--mat-grid-list-row-height'] = normalised;
  }

  return (
    <mat-grid-list
      id={props.id}
      class={classes}
      cols={instance.cols}
      data-mode={instance.mode as MatGridListMode}
      style={style}
      role={props.role}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-grid-list>
  );
});
```

Notes for the implementer:
- **`parseInstance` at the top level** — mirrors the Badge Task 7 fix. Do NOT inline the parsing logic inside `component$`, or Rollup will fail with "Illegal reassignment of import".
- **`useContext(MAT_GRID_LIST_CONFIG, CONFIG_DEFAULTS)` with default** — required per Global Constraints (Progress Bar/Spinner lesson). A bare `useContext(MAT_GRID_LIST_CONFIG)` throws `QError_notFoundContext` when rendered outside `<QwikMaterialProvider>`.
- **`useContextProvider(MAT_GRID_LIST_INSTANCE, instance)`** — the parsed object is a plain literal with primitive fields, no `noSerialize` needed.
- **`cols={instance.cols}`** — upstream reflects `cols` as a host attribute via `[attr.cols]`. Reflect it for parity + cheap diagnostics.
- **`data-mode` cast** — TypeScript widens `'fixed' | 'ratio' | 'fit'` to `string` when it flows through JSX; explicit `as MatGridListMode` documents intent. If the typecheck accepts without the cast, drop it.
- **Unit normalisation for fixed mode** — mirrors upstream's `normalizeUnits` in `FixedTileStyler.init`. `rowHeight="250"` becomes `--mat-grid-list-row-height: 250px`. `rowHeight="5em"` passes through as-is.
- **Aria trio + role** — passed through to the custom element. Role defaults to nothing (matches upstream's decorative-by-default guidance in grid-list.md §Accessibility).

- [ ] **Step 2: Create `src/qwik-material/grid-list/mat-grid-list.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatGridList} from './mat-grid-list';

describe('MatGridList (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatGridList).toBeDefined();
    expect(typeof MatGridList).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test grid-list/mat-grid-list
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/grid-list/mat-grid-list.tsx
```

Expected: no matches.

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/grid-list/mat-grid-list.tsx
```

Expected: no matches (`isBrowser` import banned per Global Constraints).

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/grid-list/mat-grid-list.tsx src/qwik-material/grid-list/mat-grid-list.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatGridList container component (CSS-grid, per-instance context)

Stateless component$ with no lifecycle. Parses rowHeight into
{rowHeight, cols, mode, ratioW, ratioH} at the top-level parseInstance
helper (avoids Rollup's Illegal reassignment issue). Publishes the parsed
instance via useContextProvider(MAT_GRID_LIST_INSTANCE, ...). Renders
<mat-grid-list> with data-mode + inline CSS custom properties driving the
grid-auto-rows branch. No JS layout pass — pure CSS grid.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Tile component

### Task 5: `<MatGridTile>` component

**Reference source:** `src/material/grid-list/grid-tile.ts` (115 LOC — MatGridTile with `rowspan`/`colspan` inputs, optional `_gridList = inject(MAT_GRID_LIST, {optional: true})`, `_setStyle(property, value)` mutation surface for the parent styler. Plus 3 secondary components (MatGridTileText, MatGridAvatarCssMatStyler, MatGridTileHeaderCssMatStyler, MatGridTileFooterCssMatStyler) which are OUT OF SCOPE per spec §5 deviation #5).

**Files:**
- Create: `src/qwik-material/grid-list/mat-grid-tile.tsx`
- Create: `src/qwik-material/grid-list/mat-grid-tile.spec.tsx`

**Interfaces:**
- Consumes:
  - `MAT_GRID_LIST_INSTANCE` + `MAT_GRID_LIST_INSTANCE_DEFAULTS` from Task 3
- Produces:
  - `interface MatGridTileProps` — 8 fields per spec §3.2 (rowspan/colspan/role/aria trio/class/id — all optional)
  - `const MatGridTile: Component<MatGridTileProps>`

- [ ] **Step 1: Create `src/qwik-material/grid-list/mat-grid-tile.tsx`**

Contents:

```tsx
import {component$, Slot, useContext} from '@builder.io/qwik';
import {MAT_GRID_LIST_INSTANCE, MAT_GRID_LIST_INSTANCE_DEFAULTS} from './grid-list-context';

/**
 * Props for <MatGridTile>. Rendered as <mat-grid-tile> with an inner
 * .mat-grid-tile-content wrapper matching upstream's grid-tile.html for
 * CSS-selector parity. Computes its own grid-column/grid-row span from
 * rowspan/colspan, and (in ratio mode) an inline aspect-ratio from the
 * parent's ratio and its own span. See design spec §3.2 for rendered DOM.
 */
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

export const MatGridTile = component$<MatGridTileProps>(props => {
  // Read parent's layout state; SSR-safe fallback for standalone tiles.
  const instance = useContext(MAT_GRID_LIST_INSTANCE, MAT_GRID_LIST_INSTANCE_DEFAULTS);

  const rowspan = Math.max(1, Math.round(props.rowspan ?? 1));
  const colspan = Math.max(1, Math.round(props.colspan ?? 1));

  const classes = ['mat-grid-tile', props.class].filter(Boolean) as string[];

  const style: Record<string, string> = {
    'grid-column': `span ${colspan}`,
    'grid-row': `span ${rowspan}`,
  };

  // Aspect-ratio only in ratio mode. Formula: parent ratio W:H, tile aspect
  // = (colspan * W) / (rowspan * H). Gutter contribution to the aspect is
  // ignored (sub-pixel at typical 1px gutter — visually indistinguishable).
  if (instance.mode === 'ratio') {
    const aspectW = colspan * instance.ratioW;
    const aspectH = rowspan * instance.ratioH;
    style['aspect-ratio'] = `${aspectW} / ${aspectH}`;
  }

  return (
    <mat-grid-tile
      id={props.id}
      class={classes}
      rowspan={rowspan}
      colspan={colspan}
      style={style}
      role={props.role}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <div class="mat-grid-tile-content">
        <Slot />
      </div>
    </mat-grid-tile>
  );
});
```

Notes for the implementer:
- **`useContext(MAT_GRID_LIST_INSTANCE, MAT_GRID_LIST_INSTANCE_DEFAULTS)`** — the defaults let a standalone tile render sensibly (rowHeight `1:1`, cols `1`, ratio mode) instead of throwing. Required per Global Constraints.
- **`Math.max(1, Math.round(...))`** — mirrors upstream's `Math.round(coerceNumberProperty(value))` in the `set colspan` / `set rowspan` accessors. Clamp to 1 to guarantee `grid-column: span N` is valid.
- **`.mat-grid-tile-content` inner wrapper** — matches upstream's `grid-tile.html` template. Kept for CSS-selector parity in case external consumers target the wrapper class.
- **`rowspan={rowspan}` + `colspan={colspan}` reflected as attributes** — upstream reflects both via `[attr.rowspan]` / `[attr.colspan]`. Same shape here for parity + diagnostics.
- **Aspect-ratio format `${aspectW} / ${aspectH}`** — space-separated slash is the standard CSS syntax; both `4/3` and `4 / 3` parse identically, but the spaced version is easier to read in DOM inspector output.
- **No custom-attribute widening needed** — Task 1's `intrinsic-elements.d.ts` covers `<mat-grid-tile>` via `QwikIntrinsicElements['div']`. `rowspan` / `colspan` are numeric attributes that Qwik's HTMLAttributes accepts natively.

- [ ] **Step 2: Create `src/qwik-material/grid-list/mat-grid-tile.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatGridTile} from './mat-grid-tile';

describe('MatGridTile (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatGridTile).toBeDefined();
    expect(typeof MatGridTile).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test grid-list/mat-grid-tile
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/grid-list/mat-grid-tile.tsx
```

Expected: no matches.

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/grid-list/mat-grid-tile.tsx
```

Expected: no matches.

- [ ] **Step 6: Run the full qwik-material vitest suite to confirm no regression**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-5 total + 1 passing (this task's smoke), zero failures.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-material/grid-list/mat-grid-tile.tsx src/qwik-material/grid-list/mat-grid-tile.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatGridTile child component (span + inline aspect-ratio)

Stateless component$ reading MAT_GRID_LIST_INSTANCE with SSR-safe defaults.
Renders <mat-grid-tile> with inline grid-column/grid-row span from
rowspan/colspan. In ratio mode, also emits aspect-ratio =
(colspan * parentRatioW) / (rowspan * parentRatioH) so each tile self-sizes
without any parent-side layout pass. Inner .mat-grid-tile-content wrapper
preserved for CSS-selector parity with upstream grid-tile.html.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Provider extension

### Task 6: Extend `<QwikMaterialProvider>` with `matGridListConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (currently ships 10 `useContextProvider` calls after Divider). Adding grid-list makes it 11.

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-grid-list.spec.tsx`

**Interfaces:**
- Consumes: `MatGridListConfig` + `MAT_GRID_LIST_CONFIG` from Task 3.
- Produces: an extended `QwikMaterialProviderProps.matGridListConfig?: MatGridListConfig` field + an 11th `useContextProvider(MAT_GRID_LIST_CONFIG, ...)` call. All 10 pre-existing provider calls unchanged.

- [ ] **Step 1: Extend the imports at the top of `qwik-material-provider.tsx`**

Read the file's current import block. Add two import lines after the divider import block:

```tsx
import type {MatGridListConfig} from '../grid-list/grid-list-config';
import {MAT_GRID_LIST_CONFIG} from '../grid-list/grid-list-config';
```

- [ ] **Step 2: Extend `QwikMaterialProviderProps` with the `matGridListConfig?` field**

Append to the interface body (after `matDividerConfig`), with a doc comment:

```tsx
  /** Defaults applied to every MatGridList in this subtree. */
  matGridListConfig?: MatGridListConfig;
```

- [ ] **Step 3: Add the 11th `useContextProvider` call at the end of the component body**

Append AFTER the `useContextProvider(MAT_DIVIDER_CONFIG, props.matDividerConfig ?? {});` line and BEFORE the `return <Slot />;`:

```tsx
  // MatGridListConfig is a plain object (currently empty) — no noSerialize needed.
  // Grid lists outside a provider get the CONFIG_DEFAULTS declared in MatGridList;
  // providing an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_GRID_LIST_CONFIG, props.matGridListConfig ?? {});
```

Verify all 10 pre-existing `useContextProvider` calls are untouched (in order: MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_ANIMATIONS_DISABLED, MAT_BUTTON_CONFIG, MAT_CARD_CONFIG, MAT_BADGE_CONFIG, MAT_ICON_CONFIG, MAT_PROGRESS_BAR_CONFIG, MAT_PROGRESS_SPINNER_CONFIG, MAT_DIVIDER_CONFIG). Do NOT change their order or arguments.

- [ ] **Step 4: Create the provider-grid-list smoke spec `qwik-material-provider-grid-list.spec.tsx`**

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatGridListConfig} from '../grid-list/grid-list-config';

describe('QwikMaterialProvider — matGridListConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts an empty matGridListConfig', () => {
    const cfg: MatGridListConfig = {};
    const props: QwikMaterialProviderProps = {matGridListConfig: cfg};
    expect(props.matGridListConfig).toBeDefined();
  });

  it('QwikMaterialProviderProps.matGridListConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matGridListConfig).toBeUndefined();
  });
});
```

- [ ] **Step 5: Run the provider spec**

```bash
pnpm -C src/qwik-material test qwik-material-provider-grid-list
```

Expected: 3/3 passing, exit 0.

- [ ] **Step 6: Run the full qwik-material vitest to confirm no regression**

```bash
pnpm -C src/qwik-material test
```

Expected: all files pass; total count = pre-Task-6 total + 3 passing.

- [ ] **Step 7: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add \
  src/qwik-material/dialog/qwik-material-provider.tsx \
  src/qwik-material/dialog/qwik-material-provider-grid-list.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): extend QwikMaterialProvider with matGridListConfig

Adds the 11th useContextProvider call (after MAT_DIVIDER_CONFIG). All 10
pre-existing provider calls preserved unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Public API

### Task 7: `grid-list/public-api.ts` + `grid-list/index.ts` + build verification

**Reference source:** design spec §3.3 (context topology) + §4 (10 exports total).

**Files:**
- Create: `src/qwik-material/grid-list/public-api.ts`
- Modify: `src/qwik-material/grid-list/index.ts` (was empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Tasks 3, 4, 5, 6.
- Produces: the exact public export surface consumers see when they import from `@angular-community/qwik-material/grid-list`. **10 exports total: 5 types (MatGridListConfig, MatGridListInstance, MatGridListMode, MatGridListProps, MatGridTileProps) + 3 values (MAT_GRID_LIST_CONFIG, MAT_GRID_LIST_INSTANCE, MAT_GRID_LIST_INSTANCE_DEFAULTS) + 2 components (MatGridList, MatGridTile).**

- [ ] **Step 1: Create `src/qwik-material/grid-list/public-api.ts`**

Contents (matches design spec §3.3 verbatim):

```ts
// Public API for @angular-community/qwik-material/grid-list.
// See docs/superpowers/specs/2026-08-02-qwik-material-grid-list-port-design.md §3.

export type {MatGridListConfig} from './grid-list-config';
export {MAT_GRID_LIST_CONFIG} from './grid-list-config';

export type {MatGridListInstance, MatGridListMode} from './grid-list-context';
export {MAT_GRID_LIST_INSTANCE, MAT_GRID_LIST_INSTANCE_DEFAULTS} from './grid-list-context';

export {MatGridList, type MatGridListProps} from './mat-grid-list';
export {MatGridTile, type MatGridTileProps} from './mat-grid-tile';
```

- [ ] **Step 2: Replace the empty stub in `src/qwik-material/grid-list/index.ts`**

Replace the entire file (was `export {};` from Task 1) with:

```ts
export * from './public-api';
```

- [ ] **Step 3: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. No Rollup `Illegal reassignment of import` errors (grid-list has no module-level mutable state — `parseInstance` is a pure function).

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify the emitted d.ts export surface**

```bash
grep -nE "^export " src/qwik-material/dist/grid-list/public-api.d.ts
```

Expected: 6 export lines (some lines re-export multiple symbols via `{X, type Y}` shorthand). All 10 symbols must be present in the emitted d.ts:

```bash
for sym in MatGridListConfig MAT_GRID_LIST_CONFIG MatGridListInstance MatGridListMode MAT_GRID_LIST_INSTANCE MAT_GRID_LIST_INSTANCE_DEFAULTS MatGridList MatGridListProps MatGridTile MatGridTileProps; do
  count=$(grep -c "\\b${sym}\\b" src/qwik-material/dist/grid-list/public-api.d.ts)
  echo "$sym: $count"
done
```

Expected: each symbol reports `1` or greater.

Confirm no leaked classes:

```bash
grep -nE "^export declare class" src/qwik-material/dist/grid-list/public-api.d.ts
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/grid-list/public-api.ts src/qwik-material/grid-list/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): finalize qwik-material/grid-list public API

10 exports total: MatGridListConfig type + MAT_GRID_LIST_CONFIG value +
MatGridListInstance/Mode types + MAT_GRID_LIST_INSTANCE +
MAT_GRID_LIST_INSTANCE_DEFAULTS values + MatGridList/MatGridListProps +
MatGridTile/MatGridTileProps.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Vitest scenario port

### Task 8: Vitest scenario port from `src/material/grid-list/grid-list.spec.ts`

**Reference source:** `src/material/grid-list/grid-list.spec.ts` (884 LOC — the largest scenario file in the port series; heavy on `@ContentChildren` QueryList + `ngAfterContentChecked` re-layout assertions). Port covers the rest via Playwright (Task 9).

**Files:**
- Create: `src/qwik-material/grid-list/mat-grid-list-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 7.
- Produces: consolidated scenario coverage documenting upstream test intent.

- [ ] **Step 1: Write the scenario spec**

Contents:

```tsx
/**
 * MatGridList scenario port from src/material/grid-list/grid-list.spec.ts.
 *
 * Upstream has ~50 `it()` blocks — heavy on @ContentChildren QueryList
 * + ngAfterContentChecked re-layout assertions using getComputedStyle to
 * probe absolute-position inline styles. All of that is moot in the port
 * because layout is pure CSS grid (spec §5 deviations #1 & #2).
 * Restructured:
 *
 *   - Live sanity tests (5): typeof + context ids + config/instance
 *     shapes + props shape.
 *   - describe.skip DOM-rendered (7): container/tile rendering, rowHeight
 *     modes (fixed/ratio/fit), rowspan/colspan, gutter. Deferred to
 *     Playwright Task 9.
 *   - describe.skip Angular-only (3): NumberInput coercion,
 *     @ContentChildren QueryList / MAT_GRID_LIST DI, dev-mode throws.
 *     Deferred forever per spec §5 deviations #7 & #8.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-grid-list/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_GRID_LIST_CONFIG,
  MAT_GRID_LIST_INSTANCE,
  MAT_GRID_LIST_INSTANCE_DEFAULTS,
  MatGridList,
  MatGridTile,
  type MatGridListConfig,
  type MatGridListInstance,
  type MatGridListProps,
  type MatGridTileProps,
} from './public-api';

describe('MatGridList — sanity', () => {
  it('MatGridList and MatGridTile are exported', () => {
    expect(MatGridList).toBeDefined();
    expect(typeof MatGridList).toBe('function');
    expect(MatGridTile).toBeDefined();
    expect(typeof MatGridTile).toBe('function');
  });

  it('MAT_GRID_LIST_CONFIG carries the expected context id', () => {
    expect(MAT_GRID_LIST_CONFIG.id).toBe('qwik-material/grid-list-config');
  });

  it('MAT_GRID_LIST_INSTANCE carries the expected context id + full-shape defaults', () => {
    expect(MAT_GRID_LIST_INSTANCE.id).toBe('qwik-material/grid-list-instance');
    expect(MAT_GRID_LIST_INSTANCE_DEFAULTS).toEqual({
      rowHeight: '1:1',
      cols: 1,
      mode: 'ratio',
      ratioW: 1,
      ratioH: 1,
    });
  });

  it('MatGridListConfig accepts an empty object; MatGridListInstance accepts a full-shape object', () => {
    const cfg: MatGridListConfig = {};
    const inst: MatGridListInstance = {
      rowHeight: '4:3',
      cols: 3,
      mode: 'ratio',
      ratioW: 4,
      ratioH: 3,
    };
    expect(cfg).toBeDefined();
    expect(inst.mode).toBe('ratio');
  });

  it('MatGridListProps + MatGridTileProps accept full aria + class + id + role surface', () => {
    const listProps: MatGridListProps = {
      cols: 3,
      rowHeight: '4:3',
      gutterSize: '8px',
      role: 'list',
      'aria-label': 'Photo grid',
      'aria-labelledby': 'grid-heading',
      'aria-describedby': 'grid-desc',
      class: 'my-grid',
      id: 'photo-grid',
    };
    const tileProps: MatGridTileProps = {
      rowspan: 2,
      colspan: 1,
      role: 'listitem',
      'aria-label': 'Photo 1',
      class: 'my-tile',
      id: 'tile-1',
    };
    expect(listProps['aria-label']).toBe('Photo grid');
    expect(tileProps.rowspan).toBe(2);
  });
});

describe.skip('MatGridList DOM-rendered scenarios — deferred to Playwright Task 9', () => {
  it('renders <mat-grid-list> with class="mat-grid-list", cols attribute, data-mode attribute', () => {});
  it('renders projected <mat-grid-tile> children as grid items', () => {});
  it('rowHeight="100px" fixed mode — grid-auto-rows applied via --mat-grid-list-row-height', () => {});
  it('rowHeight="4:3" ratio mode — tiles carry inline aspect-ratio', () => {});
  it('rowHeight="fit" fit mode — grid-auto-rows: 1fr, fills container height', () => {});
  it('rowspan/colspan — tile spans multiple cells via inline grid-column/grid-row', () => {});
  it('gutterSize="8px" — gap applied to container', () => {});
});

describe.skip('MatGridList — Angular-only tests', () => {
  it('should coerce NumberInput attribute values via coerceNumberProperty', () => {
    // Omitted — Qwik JSX passes numbers directly (spec §5 deviation #8).
  });
  it('should enumerate tiles via @ContentChildren QueryList / MAT_GRID_LIST DI', () => {
    // Replaced by per-instance MAT_GRID_LIST_INSTANCE context (spec §5 deviation #8).
  });
  it('should throw in dev-mode for missing cols / invalid ratio / oversized colspan', () => {
    // Omitted — TypeScript makes cols required; browser silently ignores invalid CSS (spec §5 deviation #7).
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
pnpm -C src/qwik-material test grid-list/mat-grid-list-scenarios
```

Expected: 5 passing + 10 skipped, exit 0.

- [ ] **Step 3: Run the full qwik-material suite for regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-8 total + 5 passing + 10 skipped, zero failures. Cumulative new passes over the port (Tasks 3-8): 5 (Task 3 context) + 1 (Task 4 smoke) + 1 (Task 5 smoke) + 3 (Task 6 provider) + 5 (Task 8 scenarios) = 15. Baseline post-divider was 197 pass → target after this task is **209 pass**.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/grid-list/mat-grid-list-scenarios.spec.tsx
git commit -m "$(cat <<'EOF'
test(multiple): port MatGridList scenarios from upstream grid-list.spec.ts

15 it() blocks total: 5 live sanity + 7 describe.skip DOM stubs (deferred
to Playwright Task 9) + 3 describe.skip Angular-only stubs (deferred
forever per spec §5). No createDOM — smoke variant only.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Dev-app + Playwright parity

### Task 9: 7 mat-grid-list dev-app routes + index tile + root.tsx CSS import + 7 Playwright parity specs

**Reference source:** existing dev-app + Playwright patterns from Divider port at `src/qwik-cdk-dev-app/src/routes/mat-divider/` and `src/qwik-cdk-parity-tests/specs/material-divider/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add grid-list-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Grid lists" section with 7 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-grid-list/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-grid-list/ratio/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-grid-list/fit/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-grid-list/spanning/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-grid-list/ratio-spanning/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-grid-list/gutter/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-grid-list/aria-labeled/index.tsx`
- Create: `src/qwik-cdk-parity-tests/specs/material-grid-list/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-grid-list/ratio.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-grid-list/fit.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-grid-list/spanning.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-grid-list/ratio-spanning.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-grid-list/gutter.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-grid-list/aria-labeled.spec.ts`

**Interfaces:**
- Consumes: `@angular-community/qwik-material/grid-list` (Task 7).
- Produces: 7 dev-app routes + 7 Playwright specs asserting host tags + classes + attrs + computed geometry.

- [ ] **Step 1: Add the grid-list-prebuilt.css import to `src/qwik-cdk-dev-app/src/root.tsx`**

Read the current file. Append the grid-list CSS import after the divider one:

```tsx
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/card-prebuilt.css';
import '@angular-community/qwik-material/toolbar-prebuilt.css';
import '@angular-community/qwik-material/badge-prebuilt.css';
import '@angular-community/qwik-material/icon-prebuilt.css';
import '@angular-community/qwik-material/progress-bar-prebuilt.css';
import '@angular-community/qwik-material/progress-spinner-prebuilt.css';
import '@angular-community/qwik-material/divider-prebuilt.css';
import '@angular-community/qwik-material/grid-list-prebuilt.css';
```

- [ ] **Step 2: Add a "Grid lists" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert after the existing "Dividers" section:

```tsx
<section>
  <h2>Grid lists</h2>
  <ul>
    <li><a href="/mat-grid-list/basic/">basic</a></li>
    <li><a href="/mat-grid-list/ratio/">ratio</a></li>
    <li><a href="/mat-grid-list/fit/">fit</a></li>
    <li><a href="/mat-grid-list/spanning/">spanning</a></li>
    <li><a href="/mat-grid-list/ratio-spanning/">ratio-spanning</a></li>
    <li><a href="/mat-grid-list/gutter/">gutter</a></li>
    <li><a href="/mat-grid-list/aria-labeled/">aria-labeled</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <MatGridList cols={4} rowHeight="100px">
      <MatGridTile>Tile 1</MatGridTile>
      <MatGridTile>Tile 2</MatGridTile>
      <MatGridTile>Tile 3</MatGridTile>
      <MatGridTile>Tile 4</MatGridTile>
      <MatGridTile>Tile 5</MatGridTile>
      <MatGridTile>Tile 6</MatGridTile>
      <MatGridTile>Tile 7</MatGridTile>
      <MatGridTile>Tile 8</MatGridTile>
    </MatGridList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `ratio/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <MatGridList cols={3} rowHeight="4:3">
      <MatGridTile>Ratio 1</MatGridTile>
      <MatGridTile>Ratio 2</MatGridTile>
      <MatGridTile>Ratio 3</MatGridTile>
      <MatGridTile>Ratio 4</MatGridTile>
      <MatGridTile>Ratio 5</MatGridTile>
      <MatGridTile>Ratio 6</MatGridTile>
    </MatGridList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `fit/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <div style={{height: '400px'}} class="fit-host">
      <MatGridList cols={4} rowHeight="fit" class="fit-grid">
        <MatGridTile>Fit 1</MatGridTile>
        <MatGridTile>Fit 2</MatGridTile>
        <MatGridTile>Fit 3</MatGridTile>
        <MatGridTile>Fit 4</MatGridTile>
        <MatGridTile>Fit 5</MatGridTile>
        <MatGridTile>Fit 6</MatGridTile>
        <MatGridTile>Fit 7</MatGridTile>
        <MatGridTile>Fit 8</MatGridTile>
      </MatGridList>
    </div>
    <style>{`.fit-host > .fit-grid { height: 100%; }`}</style>
    <main data-scenario-ready>ready</main>
  </>
));
```

Note: `MatGridListProps` doesn't declare a `style` prop (component takes only the props listed in Task 4 §1). The `fit` mode requires the container to have an explicit height — accomplished by wrapping in a `<div style={{height: '400px'}}>` and applying `height: 100%` to the `<mat-grid-list>` via a scoped inline `<style>` block. This is the same setup upstream requires ("Please note the height of the grid-list or its container must be set" — grid-list.md §Setting the row height).

- [ ] **Step 6: Create `spanning/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <MatGridList cols={4} rowHeight="100px">
      <MatGridTile rowspan={2} colspan={2}>Hero</MatGridTile>
      <MatGridTile>Fill 1</MatGridTile>
      <MatGridTile>Fill 2</MatGridTile>
      <MatGridTile>Fill 3</MatGridTile>
      <MatGridTile>Fill 4</MatGridTile>
      <MatGridTile>Fill 5</MatGridTile>
      <MatGridTile>Fill 6</MatGridTile>
    </MatGridList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `ratio-spanning/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <MatGridList cols={4} rowHeight="4:3">
      <MatGridTile rowspan={2} colspan={2}>Compound aspect 8:6</MatGridTile>
      <MatGridTile>Ratio fill 1</MatGridTile>
      <MatGridTile>Ratio fill 2</MatGridTile>
    </MatGridList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create `gutter/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <MatGridList cols={3} rowHeight="100px" gutterSize="16px">
      <MatGridTile>Gutter 1</MatGridTile>
      <MatGridTile>Gutter 2</MatGridTile>
      <MatGridTile>Gutter 3</MatGridTile>
      <MatGridTile>Gutter 4</MatGridTile>
      <MatGridTile>Gutter 5</MatGridTile>
      <MatGridTile>Gutter 6</MatGridTile>
    </MatGridList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Create `aria-labeled/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatGridList, MatGridTile} from '@angular-community/qwik-material/grid-list';

export default component$(() => (
  <>
    <MatGridList cols={3} rowHeight="100px" role="list" aria-label="Photo grid">
      <MatGridTile role="listitem" aria-label="Photo 1">Photo 1</MatGridTile>
      <MatGridTile role="listitem" aria-label="Photo 2">Photo 2</MatGridTile>
      <MatGridTile role="listitem" aria-label="Photo 3">Photo 3</MatGridTile>
    </MatGridList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 10: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Confirm client + SSR builds succeed. Verify 7 mat-grid-list routes in the manifest:

```bash
grep -oE 'mat-grid-list/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `7`.

List them explicitly:

```bash
grep -oE 'mat-grid-list/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u
```

Expected:
```
mat-grid-list/aria-labeled
mat-grid-list/basic
mat-grid-list/fit
mat-grid-list/gutter
mat-grid-list/ratio
mat-grid-list/ratio-spanning
mat-grid-list/spanning
```

- [ ] **Step 11: Create `basic.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/basic — <mat-grid-list> container with 8 tiles, display: grid, data-mode="fixed"', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toBeVisible();
  await expect(list).toHaveClass(/mat-grid-list/);
  await expect(list).toHaveAttribute('cols', '4');
  await expect(list).toHaveAttribute('data-mode', 'fixed');

  const tiles = page.locator('mat-grid-tile');
  await expect(tiles).toHaveCount(8);
  await expect(tiles.first()).toHaveClass(/mat-grid-tile/);

  // Container computed style: display: grid
  const display = await list.evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('grid');

  // First tile bounding box: width ≈ container width / 4 (±3px tolerance for gutter + subpixel)
  const listBox = await list.boundingBox();
  const tileBox = await tiles.first().boundingBox();
  expect(listBox).not.toBeNull();
  expect(tileBox).not.toBeNull();
  const expectedTileWidth = listBox!.width / 4;
  expect(Math.abs(tileBox!.width - expectedTileWidth)).toBeLessThan(4);
});
```

- [ ] **Step 12: Create `ratio.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/ratio — data-mode="ratio" + tile bounding-box aspect ≈ 4/3', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/ratio/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toHaveAttribute('data-mode', 'ratio');

  const tile = page.locator('mat-grid-tile').first();
  await expect(tile).toBeVisible();

  const box = await tile.boundingBox();
  expect(box).not.toBeNull();
  // rowHeight="4:3" means W:H = 4:3, so aspect (width/height) = 4/3 ≈ 1.333.
  const aspect = box!.width / box!.height;
  expect(Math.abs(aspect - 4 / 3)).toBeLessThan(0.05);
});
```

- [ ] **Step 13: Create `fit.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/fit — data-mode="fit" + 2-row layout fills 400px container', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/fit/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toHaveAttribute('data-mode', 'fit');

  const tiles = page.locator('mat-grid-tile');
  await expect(tiles).toHaveCount(8);

  // 8 tiles in a 4-col grid = 2 rows. Container is 400px tall.
  // Each row ≈ 200px minus gutter (1px default) → tile height ≈ 199.5px, tolerance ±3px.
  const tileBox = await tiles.first().boundingBox();
  expect(tileBox).not.toBeNull();
  expect(Math.abs(tileBox!.height - 200)).toBeLessThan(4);
});
```

- [ ] **Step 14: Create `spanning.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/spanning — 2x2 hero tile has ~2x width and ~2x height of a single-cell tile', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/spanning/`);
  await page.waitForSelector('[data-scenario-ready]');

  const hero = page.locator('mat-grid-tile').first();
  const single = page.locator('mat-grid-tile').nth(1);

  await expect(hero).toHaveAttribute('rowspan', '2');
  await expect(hero).toHaveAttribute('colspan', '2');

  const heroBox = await hero.boundingBox();
  const singleBox = await single.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(singleBox).not.toBeNull();

  // Hero width ≈ 2 × single width + 1 gutter (1px). Tolerance ±4px.
  const expectedHeroWidth = 2 * singleBox!.width + 1;
  expect(Math.abs(heroBox!.width - expectedHeroWidth)).toBeLessThan(5);

  // Hero height ≈ 2 × 100px + 1 gutter (fixed rowHeight="100px").
  expect(Math.abs(heroBox!.height - 201)).toBeLessThan(5);
});
```

- [ ] **Step 15: Create `ratio-spanning.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/ratio-spanning — compound aspect on 2x2 tile in a 4:3 grid ≈ 8/6', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/ratio-spanning/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toHaveAttribute('data-mode', 'ratio');

  const hero = page.locator('mat-grid-tile').first();
  await expect(hero).toHaveAttribute('rowspan', '2');
  await expect(hero).toHaveAttribute('colspan', '2');

  // Verify the inline aspect-ratio style is emitted
  const inlineAspect = await hero.evaluate((el) => (el as HTMLElement).style.aspectRatio);
  expect(inlineAspect).toContain('8');
  expect(inlineAspect).toContain('6');

  // Bounding-box aspect: colspan=2, rowspan=2, ratio 4:3 → aspect = (2*4)/(2*3) = 8/6 ≈ 1.333
  const heroBox = await hero.boundingBox();
  expect(heroBox).not.toBeNull();
  const aspect = heroBox!.width / heroBox!.height;
  expect(Math.abs(aspect - 8 / 6)).toBeLessThan(0.05);
});
```

- [ ] **Step 16: Create `gutter.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/gutter — gutterSize="16px" is applied as CSS gap', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/gutter/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  const gap = await list.evaluate((el) => getComputedStyle(el).gap);
  // Computed gap may be reported as "16px" or "16px 16px" depending on browser.
  expect(gap).toContain('16px');
});
```

- [ ] **Step 17: Create `aria-labeled.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/aria-labeled — role="list" on container + role="listitem" + aria-label on tiles', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toHaveAttribute('role', 'list');
  await expect(list).toHaveAttribute('aria-label', 'Photo grid');

  const tiles = page.locator('mat-grid-tile');
  await expect(tiles).toHaveCount(3);
  await expect(tiles.nth(0)).toHaveAttribute('role', 'listitem');
  await expect(tiles.nth(0)).toHaveAttribute('aria-label', 'Photo 1');
  await expect(tiles.nth(1)).toHaveAttribute('role', 'listitem');
  await expect(tiles.nth(2)).toHaveAttribute('role', 'listitem');
});
```

- [ ] **Step 18: Do NOT run Playwright**

Chromium install + preview server are human-managed steps. Skip execution — Task 10 documents the manual verification step.

- [ ] **Step 19: Commit**

```bash
git add \
  src/qwik-cdk-dev-app/src/root.tsx \
  src/qwik-cdk-dev-app/src/routes/index.tsx \
  src/qwik-cdk-dev-app/src/routes/mat-grid-list/ \
  src/qwik-cdk-parity-tests/specs/material-grid-list/
git commit -m "$(cat <<'EOF'
feat(multiple): mat-grid-list dev-app routes (7) + Playwright parity specs (7)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 10 — Finalisation

### Task 10: SYNC.md + pipeline verification

**Reference source:** `src/qwik-material/divider/SYNC.md` (existing SYNC pattern from the just-completed Divider port).

**Files:**
- Create: `src/qwik-material/grid-list/SYNC.md`

**Interfaces:**
- Consumes: everything from Tasks 1-9.
- Produces: `SYNC.md` documenting the grid-list port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/grid-list/SYNC.md`**

Contents:

```markdown
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
   - Invalid ratio (`"4:3:2"`) — parse yields `NaN`, browser silently ignores invalid `aspect-ratio`.
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

9. **`intrinsic-elements.d.ts` types `<mat-grid-list>` + `<mat-grid-tile>` as `QwikIntrinsicElements['div']`.** No custom-attribute widening needed — `data-mode`, `rowspan`, `colspan` are all covered by Qwik's base HTMLAttributes.

10. **First port with per-instance context.** `MAT_GRID_LIST_INSTANCE` is the first branch context in `qwik-material/` that flows from a parent component to its descendants (in addition to the global `MAT_GRID_LIST_CONFIG` provided by `QwikMaterialProvider`). Precedent for future container-with-children ports (tabs, stepper, etc.).

## Stub inventory delta

No new stubs — the grid-list SCSS chain does NOT reference `@angular/cdk` (grep-confirmed, matching Icon + Divider precedent). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/grid-list/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list.
```

- [ ] **Step 2: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** all 10 prebuilt CSS files emit; JS + d.ts under `dist/{dialog,button,card,toolbar,badge,icon,progress-bar,progress-spinner,divider,grid-list}/`.
- **Vitest:** all specs pass across 10 entry-points; total ≥ 209 pass.
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 3: Verify the class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/grid-list/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 4: Verify no SSR globals in the grid-list entry-point**

```bash
grep -RnE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/grid-list/ | grep -v '\.spec\.'
```

Expected: no output. Grid-list has no `useVisibleTask$` and no browser globals — it's pure computation from props.

- [ ] **Step 5: Verify no `isBrowser` import**

```bash
grep -RnE "from '@builder\.io/qwik/build'" src/qwik-material/grid-list/
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/grid-list/SYNC.md
git commit -m "$(cat <<'EOF'
docs(multiple): finalize qwik-material/grid-list SYNC.md + pipeline verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Layout

```
src/qwik-material/
  grid-list/
    grid-list-config.ts                — MatGridListConfig + MAT_GRID_LIST_CONFIG (Task 3)
    grid-list-context.ts               — MatGridListInstance + MAT_GRID_LIST_INSTANCE + DEFAULTS (Task 3)
    grid-list-context.spec.ts          — 5 it() covering both files (Task 3)
    mat-grid-list.tsx                  — <MatGridList> container (Task 4)
    mat-grid-list.spec.tsx             — smoke (Task 4)
    mat-grid-tile.tsx                  — <MatGridTile> child (Task 5)
    mat-grid-tile.spec.tsx             — smoke (Task 5)
    mat-grid-list-scenarios.spec.tsx   — upstream scenario port (Task 8)
    intrinsic-elements.d.ts            — <mat-grid-list> + <mat-grid-tile> JSX augmentation (Task 1)
    public-api.ts                      — consumer-facing re-exports (Task 7)
    index.ts                           — `export * from './public-api'` (Task 1 stub / Task 7 real)
    SYNC.md                            — deviation + stub log (Task 10)
  dialog/
    qwik-material-provider.tsx         — MODIFIED in Task 6 (adds matGridListConfig)
    qwik-material-provider-grid-list.spec.tsx — new spec (Task 6)
  scss/
    grid-list/                         — 3 synced partials + rewritten grid-list.scss + grid-list-prebuilt.scss (Task 2)
  package.json                         — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                       — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                           — MODIFIED in Task 9 (grid-list-prebuilt.css import)
    routes/
      index.tsx                        — MODIFIED in Task 9 (Grid lists section)
      mat-grid-list/                   — 7 new route files (Task 9)

src/qwik-cdk-parity-tests/
  specs/
    material-grid-list/                — 7 new Playwright specs (Task 9)
```

## Per-entry-point state

The `grid-list` entry-point becomes the tenth after `dialog` + `button` + `card` + `toolbar` + `badge` + `icon` + `progress-bar` + `progress-spinner` + `divider` in the qwik-material package. All ten live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` (from earlier ports) is the only intersection, extended in Task 6.

## Sync recipe

To re-sync a specific file from upstream `src/material/grid-list/`:

1. Locate the upstream file's counterpart in the `grid-list/SYNC.md` sync table.
2. If "synced" state (`_grid-list-theme.scss`, `_m2-grid-list.scss`, `_m3-grid-list.scss`): `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "rewritten" state (`grid-list.scss`): re-read upstream, apply any new grid-layout-relevant changes to the rewritten file, verify header/footer/avatar blocks stay stripped (scope decision #5).
4. If "ported" state (`mat-grid-list.tsx`, `mat-grid-tile.tsx`): manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change, update the corresponding `.spec.tsx`.
5. If "new" state (`grid-list-config.ts`, `grid-list-context.ts`, `grid-list-prebuilt.scss`): no upstream counterpart — evolve independently.
6. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest ≥ 209 pass + lint + typecheck)
- 7 dev-app routes at `/mat-grid-list/*` render visibly in browser preview
- 7 Playwright specs pass locally when run against the built dev-app preview
- Every Playwright spec asserts on the `<mat-grid-list>` OR `<mat-grid-tile>` custom-element tag AT LEAST ONCE — regression that drops either tag fails loudly
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/grid-list/` returns nothing)
- Zero SSR-leak violations
- `<QwikMaterialProvider>` has exactly 11 `useContextProvider` calls in order: MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_ANIMATIONS_DISABLED, MAT_BUTTON_CONFIG, MAT_CARD_CONFIG, MAT_BADGE_CONFIG, MAT_ICON_CONFIG, MAT_PROGRESS_BAR_CONFIG, MAT_PROGRESS_SPINNER_CONFIG, MAT_DIVIDER_CONFIG, MAT_GRID_LIST_CONFIG.
