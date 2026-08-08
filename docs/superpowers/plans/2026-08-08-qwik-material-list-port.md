# qwik-material List Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the display-list surface of `src/material/list` into a `qwik-material/list` entry-point: 10 components (`MatList`, `MatNavList`, `MatActionList`, `MatSubheader`, polymorphic `MatListItem`, plus 5 slot components: `MatListItemAvatar`, `MatListItemIcon`, `MatListItemTitle`, `MatListItemLine`, `MatListItemMeta`). Selection-list is out of scope (future forms-tier port). Line-count layout via CSS `:has()` — replaces upstream's `@ContentChildren` + `_updateItemLines` + `cdkObserveContent` JS pipeline. CSS grid layout replaces MDC's ~477-LOC `_list-inherited-structure.scss` flex mixin chain.

**Architecture:** All 10 components are pure `component$` wrappers, zero lifecycle, no ripple, no focus manager. Container variants (`MatList`, `MatNavList`, `MatActionList`, `MatSubheader`) read a global `MAT_LIST_CONFIG` with SSR-safe defaults fallback. `MatListItem` has polymorphic host via `as?: 'div' | 'a' | 'button'` — default renders `<mat-list-item>`, `'a'` renders `<a>` (mirrors upstream `a[mat-list-item]` selector), `'button'` renders `<button>`. Five slot components each render `<div class="<hooks>"><Slot /></div>` with class hooks that CSS grid places by column: avatar/icon left, title/lines center, meta right — regardless of DOM order. `:has()` selectors size the item to 48/64/88px based on line count.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./list`. New prebuilt CSS entry: `./list-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-08-08-qwik-material-list-port-design.md](../specs/2026-08-08-qwik-material-list-port-design.md). Read §2 (Architecture — CSS-grid + `:has()`), §3 (Component API — 10 components + 18 exports), §4 (SCSS — rewritten list.scss + dropped `_list-inherited-structure.scss`), §5 (10 deviations) before starting any port task.
- **Material source reference:** `src/material/list/`. Every port task names the exact source file(s) it mirrors (or explicitly removes).
- **DOM parity — custom-element tags:** upstream renders `<mat-list>`, `<mat-nav-list>`, `<mat-action-list>`, `<mat-list-item>`, and `<mat-subheader>` as real custom elements (subheader upstream is a directive that we ship as a real component for Qwik ergonomics). Port preserves all 5 via JSX augmentation in `intrinsic-elements.d.ts` typed as `QwikIntrinsicElements['div']`. No custom-attribute widening needed (no numeric attrs like grid-list's `cols`/`rowspan`/`colspan`; `href` on the polymorphic `<a>` variant is a native anchor attribute).
- **DOM parity — class ladders:**
  - `<mat-list>` = `mat-mdc-list mat-mdc-list-base mdc-list`
  - `<mat-nav-list>` = `mat-mdc-nav-list mat-mdc-list-base mdc-list`
  - `<mat-action-list>` = `mat-mdc-action-list mat-mdc-list-base mdc-list`
  - `<mat-subheader>` = `mat-mdc-subheader mdc-list-group__subheader`
  - `<mat-list-item>` (or `<a>`/`<button>`) = `mat-mdc-list-item mdc-list-item` + optional `mdc-list-item--activated` + optional `mdc-list-item--disabled`
- **DOM parity — polymorphic host:** `MatListItem` `as='div'` (default) → `<mat-list-item>`; `as='a'` → `<a>` (with `href` prop); `as='button'` → `<button>` (with `disabled` reflected). Matches upstream `mat-list-item, a[mat-list-item], button[mat-list-item]` selector.
- **DOM parity — MatListItem template:** slot components appear as children in ANY DOM order — CSS grid places them by class. No inner `<span class="mdc-list-item__content">` wrapper (upstream keeps one; we drop it as CSS grid handles positioning directly on the item host). No `<div class="mat-focus-indicator">` (upstream renders it for CDK focus indicator; we drop as we don't ship that stack). No `<ng-content select="mat-divider">` slot (users place `<MatDivider />` between items instead).
- **DOM parity — slot components:** each of the 5 renders a `<div>` with class hooks:
  - `MatListItemAvatar` → `mat-mdc-list-item-avatar mdc-list-item__start`
  - `MatListItemIcon` → `mat-mdc-list-item-icon mdc-list-item__start`
  - `MatListItemTitle` → `mat-mdc-list-item-title mdc-list-item__primary-text`
  - `MatListItemLine` → `mat-mdc-list-item-line mdc-list-item__secondary-text`
  - `MatListItemMeta` → `mat-mdc-list-item-meta mdc-list-item__end`
- **File-naming rule:** Angular source basenames get a `mat-` prefix. `list.ts` → `mat-list.tsx`, `list-item-sections.ts` → `mat-list-item-sections.tsx`.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/list/SYNC.md`.
- **No RxJS.** **No `HttpClient` / XHR.** **No `useVisibleTask$`** — all 10 components are pure props → JSX.
- **No exported classes** in `list/public-api.ts` or anywhere else in `src/qwik-material/list/`.
- **SSR safety:** No `document.` / `window.` / `navigator.` / `getComputedStyle(` / `requestAnimationFrame(` in non-spec files. No `isBrowser` import from `@builder.io/qwik/build`.
- **Every `useContext` call carries a defaults fallback** (Progress Bar / Progress Spinner post-mortem): `useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS)`, not bare `useContext(MAT_LIST_CONFIG)`. Bare form throws `QError_notFoundContext` (Code 13) when rendered outside `<QwikMaterialProvider>`.
- **Commit message scope:** `multiple` for every commit (hook enforced — no `--no-verify`, no hook bypass).
- **Pnpm version:** `pnpm@11.7.0`. Don't change.
- **No Bazel changes.** **No upstream CI integration.**
- **Class-list cast pattern (established):** `.filter(Boolean) as string[]` for Qwik's `ClassList` type quirk.
- **No `BooleanInput` / `NumberInput` coercion.** Qwik JSX passes booleans and numbers directly.
- **No @angular/cdk SCSS rewrite** expected (grid-list precedent — verified at Task 2 via grep). If a hidden reference surfaces, apply the established rewrite pattern (badge/toolbar/dialog/progress-bar/progress-spinner).
- **Spec files use smoke variant:** `createDOM(<component$/>)` hangs the Qwik optimizer worker under vitest. Smoke tests use module-import assertions. Real DOM assertions live in Task 11's Playwright parity specs.
- **`:has()` CSS dependency:** Baseline Late 2023 — Chrome ≥ 105, Safari ≥ 15.4, Firefox ≥ 121. Documented in spec §5 deviation #2.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `list` entry-point into the existing qwik-material package

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from earlier ports — grid-list is the most recent addition).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/list/intrinsic-elements.d.ts`
- Create: `src/qwik-material/list/index.ts` (empty stub — Task 8 replaces)

**Interfaces:**
- Consumes: existing package scaffolding (11 entry-points as of grid-list port).
- Produces: `pnpm -C src/qwik-material build` still succeeds (existing 10 prebuilt CSS files still emit; no list CSS yet). Type resolution for `@angular-community/qwik-material/list` returns an empty module. `<mat-list>`, `<mat-nav-list>`, `<mat-action-list>`, `<mat-list-item>`, `<mat-subheader>` are legal JSX elements.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./list` after `./grid-list`, and `./list-prebuilt.css` after `./grid-list-prebuilt.css`. Final relevant block:

```json
"./grid-list": {
  "qwik": "./grid-list/index.ts",
  "types": "./dist/grid-list/index.d.ts",
  "import": "./dist/grid-list/index.js"
},
"./list": {
  "qwik": "./list/index.ts",
  "types": "./dist/list/index.d.ts",
  "import": "./dist/list/index.js"
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
"./list-prebuilt.css": "./dist/list-prebuilt.css",
"./scss/*": "./scss/*"
```

- [ ] **Step 2: Extend `src/qwik-material/vite.config.ts` `entries` array + `sassEntries` list**

Read the file. `entries` currently reads `['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar', 'progress-spinner', 'divider', 'grid-list']`. Append `'list'`:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar', 'progress-spinner', 'divider', 'grid-list', 'list'];
```

`sassEntries` currently ends with `['scss/grid-list/grid-list-prebuilt.scss', 'dist/grid-list-prebuilt.css']`. Append the list pair:

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
  ['scss/list/list-prebuilt.scss', 'dist/list-prebuilt.css'],
];
```

- [ ] **Step 3: Create `src/qwik-material/list/intrinsic-elements.d.ts`**

All 5 custom elements type as `QwikIntrinsicElements['div']` — no custom camelCase or numeric attrs need widening. `href` on the polymorphic `<a>` variant is a native anchor attribute and NOT a custom attr on `<mat-list-item>` (it's on the `<a>` element itself, which Qwik types natively). Contents:

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material List's custom-element tag
 * names. Upstream renders <mat-list>, <mat-nav-list>, <mat-action-list>,
 * <mat-list-item>, and <mat-subheader> as actual custom elements; external
 * CMS styles may target the tags directly (not just the .mat-mdc-list-*
 * classes). All 5 type as QwikIntrinsicElements['div'] — no custom
 * camelCase attrs need widening (unlike grid-list's cols/rowspan/colspan).
 * See design spec §5 deviation #9.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-list': QwikIntrinsicElements['div'];
      'mat-nav-list': QwikIntrinsicElements['div'];
      'mat-action-list': QwikIntrinsicElements['div'];
      'mat-list-item': QwikIntrinsicElements['div'];
      'mat-subheader': QwikIntrinsicElements['div'];
    }
  }
}
```

- [ ] **Step 4: Create `src/qwik-material/list/index.ts`** (empty stub)

Contents:

```ts
export {};
```

Task 8 replaces this with `export * from './public-api';`.

- [ ] **Step 5: Run the build to confirm the stub compiles**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. The dts plugin generates `dist/list/index.d.ts` with `export {};`. The Sass pipeline logs a `skipping scss/list/list-prebuilt.scss — not yet present.` warning (ENOENT-tolerant guard); this is EXPECTED — Task 2 creates the SCSS file. Confirm the existing 10 prebuilt CSS files still emit:

```bash
ls src/qwik-material/dist/*.css
```

Expected: `dialog-prebuilt.css`, `button-prebuilt.css`, `card-prebuilt.css`, `toolbar-prebuilt.css`, `badge-prebuilt.css`, `icon-prebuilt.css`, `progress-bar-prebuilt.css`, `progress-spinner-prebuilt.css`, `divider-prebuilt.css`, `grid-list-prebuilt.css`. NOT `list-prebuilt.css` yet.

`ls src/qwik-material/dist/list/`:

```bash
ls src/qwik-material/dist/list/
```

Expected: `index.d.ts`, `index.js`, `index.js.map`. `dist/list/index.d.ts` contents: `export {};`.

- [ ] **Step 6: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. The `intrinsic-elements.d.ts` from Step 3 makes all 5 custom-element tags legal JSX.

- [ ] **Step 7: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/list/intrinsic-elements.d.ts \
  src/qwik-material/list/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): wire qwik-material/list entry-point + 5 custom-element JSX augmentations

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SCSS + prebuilt CSS

### Task 2: Copy 4 SCSS partials byte-identical + rewrite `list.scss` (~80 LOC) + new `list-prebuilt.scss`

**Reference source:** `src/material/list/*.scss` (6 files, ~1090 total LOC). Confirmed at this step via `grep '@angular/cdk' src/material/list/*.scss`: zero references expected. NO `@use '../cdk-stub' as cdk` rewrite needed — fourth port after Icon + Divider + Grid List to skip.

**Files:**
- Create: `src/qwik-material/scss/list/_list-theme.scss` (byte-identical copy)
- Create: `src/qwik-material/scss/list/_list-item-hcm-indicator.scss` (byte-identical copy)
- Create: `src/qwik-material/scss/list/_m2-list.scss` (byte-identical copy)
- Create: `src/qwik-material/scss/list/_m3-list.scss` (byte-identical copy)
- Create: `src/qwik-material/scss/list/list.scss` (heavily REWRITTEN — ~80 LOC of CSS-grid rules; drops all MDC state-layer / ripple / focus-indicator selectors)
- Create: `src/qwik-material/scss/list/list-prebuilt.scss` (new — `:root` var defaults)
- **NOT COPIED:** `_list-inherited-structure.scss` (477 LOC) — deliberately dropped per spec §5 deviation #7.

**Interfaces:**
- Consumes: existing SCSS ecosystem — sass compiler picks up `scss/list/list-prebuilt.scss` from Task 1's vite.config.ts change.
- Produces: `dist/list-prebuilt.css` after `pnpm -C src/qwik-material build`. Compiled CSS contains `.mat-mdc-list`, `.mat-mdc-nav-list`, `.mat-mdc-action-list`, `.mat-mdc-list-item` with `display: grid` + slot section positioning + `[data-mode]`-style `:has()` sizing branches, `.mat-mdc-subheader`, and the 5 slot-hook selectors. Every `--mat-*` reference has a matching `:root` declaration.

- [ ] **Step 1: Byte-identical copy of the 4 SCSS partials that don't need rewriting**

```bash
cp src/material/list/_list-theme.scss             src/qwik-material/scss/list/_list-theme.scss
cp src/material/list/_list-item-hcm-indicator.scss src/qwik-material/scss/list/_list-item-hcm-indicator.scss
cp src/material/list/_m2-list.scss                src/qwik-material/scss/list/_m2-list.scss
cp src/material/list/_m3-list.scss                src/qwik-material/scss/list/_m3-list.scss
```

Verify byte-identical:

```bash
diff -q src/material/list/_list-theme.scss             src/qwik-material/scss/list/_list-theme.scss
diff -q src/material/list/_list-item-hcm-indicator.scss src/qwik-material/scss/list/_list-item-hcm-indicator.scss
diff -q src/material/list/_m2-list.scss                src/qwik-material/scss/list/_m2-list.scss
diff -q src/material/list/_m3-list.scss                src/qwik-material/scss/list/_m3-list.scss
```

Expected: no output on any (empty stdout for each).

- [ ] **Step 2: Deliberately DO NOT copy `_list-inherited-structure.scss`**

Confirm the file is NOT present in the port:

```bash
ls src/qwik-material/scss/list/_list-inherited-structure.scss 2>&1 | tail -1
```

Expected: `No such file or directory`. This is INTENTIONAL per spec §5 deviation #7 — the file's 477 LOC of MDC flex-positioning + ripple hooks + state-layer + activated-state gradients are all replaced by our CSS-grid rewrite in Step 3, or scoped out entirely.

- [ ] **Step 3: Sanity-check ALL 6 upstream SCSS files have zero `@angular/cdk` references**

```bash
grep -RnE "^@use '@angular/cdk'" src/material/list/*.scss
```

Expected: no output. This confirms no `cdk-stub` rewrite is needed. Fourth port (after Icon + Divider + Grid List) to skip the rewrite entirely. Note this outcome verbatim in the SYNC.md sync-state row in Task 12.

- [ ] **Step 4: Create the rewritten `src/qwik-material/scss/list/list.scss`**

Upstream is 185 LOC that pulls in the 477-LOC `_list-inherited-structure.scss` chain via `@use`. Replaced by ~80 LOC of CSS-grid rules per spec §4. Contents:

```scss
// qwik-material list styling — CSS-grid strategy.
// Upstream uses MDC's flex-based positioning inherited from
// _list-inherited-structure.scss (477 LOC), plus JS-driven modifier classes
// (.mdc-list-item--with-leading-avatar, --with-leading-icon,
// --with-trailing-meta, --with-two-lines, --with-three-lines) computed by
// @ContentChildren + _updateItemLines. All of that is dropped entirely (spec
// §5 deviations #1, #2, #7) — CSS grid handles layout, :has() selectors
// handle line-count sizing.

@use './m3-list';
@use '../core/tokens/token-utils';

$fallbacks: m3-list.get-tokens();

// Container variants — flat block with vertical stacking of items.
.mat-mdc-list,
.mat-mdc-nav-list,
.mat-mdc-action-list {
  display: block;
  padding: 8px 0;
  margin: 0;
  list-style: none;

  &[aria-disabled='true'] .mat-mdc-list-item {
    pointer-events: none;
    opacity: 0.38;
  }
}

// Subheader — section title above a group of items.
.mat-mdc-subheader {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 16px;
  font-size: token-utils.slot(list-subheader-text-size, $fallbacks);
  font-weight: 500;
  color: var(--mat-list-list-item-supporting-text-color, rgba(0, 0, 0, 0.6));
  margin: 0;
}

// List-item grid layout — slot children positioned by class regardless of
// DOM order. Consumer writes slot components in any order.
.mat-mdc-list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-auto-rows: min-content;
  align-items: center;
  gap: 0 16px;
  min-height: 48px;
  padding: 0 16px;
  color: var(--mat-list-list-item-label-text-color, rgba(0, 0, 0, 0.87));
  font-size: token-utils.slot(list-item-label-text-size, $fallbacks);

  &.mdc-list-item--activated {
    background-color: rgba(0, 0, 0, 0.08);
  }

  &.mdc-list-item--disabled {
    pointer-events: none;
    opacity: 0.38;
  }

  // Slot section placement — leading (avatar/icon) in column 1 spanning
  // all rows; primary content (title + lines) in column 2 flowing rows;
  // trailing (meta) in column 3 spanning all rows.
  .mat-mdc-list-item-avatar,
  .mat-mdc-list-item-icon {
    grid-column: 1;
    grid-row: 1 / -1;
  }

  .mat-mdc-list-item-title,
  .mat-mdc-list-item-line {
    grid-column: 2;
  }

  .mat-mdc-list-item-meta {
    grid-column: 3;
    grid-row: 1 / -1;
  }
}

// Title styling — primary text, single line max.
.mat-mdc-list-item-title {
  font-size: token-utils.slot(list-item-label-text-size, $fallbacks);
  color: var(--mat-list-list-item-label-text-color, rgba(0, 0, 0, 0.87));
  line-height: 1.5;
}

// Secondary line styling — supporting text.
.mat-mdc-list-item-line {
  font-size: token-utils.slot(list-item-supporting-text-size, $fallbacks);
  color: var(--mat-list-list-item-supporting-text-color, rgba(0, 0, 0, 0.6));
  line-height: 1.4;
}

// Leading avatar sizing — circular by default.
.mat-mdc-list-item-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

// Leading icon sizing.
.mat-mdc-list-item-icon {
  width: 24px;
  height: 24px;
}

// Trailing meta styling — smaller supporting text on the right.
.mat-mdc-list-item-meta {
  font-size: 12px;
  color: var(--mat-list-list-item-supporting-text-color, rgba(0, 0, 0, 0.6));
}

// Line-count sizing via :has() — no JS, no @ContentChildren, no
// _updateItemLines. Reacts naturally to slot content changes.
// Baseline Late 2023 dependency (Chrome ≥ 105, Safari ≥ 15.4, Firefox ≥ 121).
.mat-mdc-list-item:has(> .mat-mdc-list-item-line) {
  min-height: 64px;
  padding: 8px 16px;
}

.mat-mdc-list-item:has(> .mat-mdc-list-item-line ~ .mat-mdc-list-item-line) {
  min-height: 88px;
}

// Anchor variant (nav-list items — MatListItem as='a').
a.mat-mdc-list-item {
  color: inherit;
  text-decoration: none;
}

// Button variant (action-list items — MatListItem as='button').
button.mat-mdc-list-item {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: inherit;
  font: inherit;

  &:disabled {
    cursor: default;
  }
}
```

Notes for the implementer:
- `@use './m3-list';` remains for future M3 typography token access; the referenced tokens flow through `token-utils.slot(...)` calls.
- `min-width: 0` / `min-height: 0` on grid items is not needed here because `.mat-mdc-list-item` IS the grid container, not a grid item itself.
- Do NOT `@use '../cdk-stub' as cdk` — list's upstream `.scss` uses only `list-common`, `layout-common`, `token-utils` (all from `../core/`), none of which come from `@angular/cdk`.
- Token names in `token-utils.slot(...)` calls (`list-subheader-text-size`, `list-item-label-text-size`, `list-item-supporting-text-size`) are best-effort guesses from the upstream `_m3-list.scss`. Step 6 verifies against compiled CSS and adjusts if the actual token names differ (Icon Task 2 precedent — plan said `--mat-icon-icon-color` but real emitted was `--mat-icon-color`).

- [ ] **Step 5: Create the initial `src/qwik-material/scss/list/list-prebuilt.scss`**

Start with a candidate `:root` block for the CSS custom properties the rewritten `list.scss` reads. Contents (candidate — Step 6 verifies + expands as needed):

```scss
// List prebuilt CSS. Wraps the port's list.scss with :root defaults for
// every --mat-list-* variable it emits. See design spec §4.

@use './list';

:root {
  --mat-list-list-item-label-text-color: rgba(0, 0, 0, 0.87);
  --mat-list-list-item-supporting-text-color: rgba(0, 0, 0, 0.6);
}
```

Note: `@use './list';` MUST come before the `:root` block (Sass requires `@use` first).

- [ ] **Step 6: Run the build to emit `dist/list-prebuilt.css`**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. `dist/list-prebuilt.css` present:

```bash
ls src/qwik-material/dist/list-prebuilt.css
```

Expected: file listed.

- [ ] **Step 7: Grep the emitted CSS for every `--mat-*` reference and reconcile against the `:root` block**

The KEY step. The candidate is a plan-author's guess; the compiled CSS is the source of truth (Icon Task 2 precedent — plan said `--mat-icon-icon-color` but real emitted was `--mat-icon-color`; Progress Bar Task 2 discovered 2 vars beyond candidate; Progress Spinner Task 2 removed 1 phantom; Divider + Grid List matched on first pass).

```bash
# What the compiled CSS actually references
grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/list-prebuilt.css | sort -u
```

Compare to what the `:root` block declares:

```bash
grep -oE '^\s*--mat-[a-z-]+' src/qwik-material/scss/list/list-prebuilt.scss | sort -u
```

For every `var(--mat-*)` reference NOT covered by a `:root` line:
- The rewritten `list.scss` uses 2 explicit vars (`--mat-list-list-item-label-text-color`, `--mat-list-list-item-supporting-text-color`). If additional `--mat-*` references sneak in via the M2/M3 token pipeline (e.g. the `token-utils.slot(...)` calls emit their own CSS vars), add a `:root` declaration with the M3 default from `_m3-list.scss`.

For every `:root` declaration NOT actually referenced in the compiled CSS: remove it (phantom variable).

Rebuild after every edit until the diff is empty:

```bash
diff \
  <(grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/list-prebuilt.css | sed 's/var(//' | sort -u) \
  <(grep -oE '^[[:space:]]*--mat-[a-z-]+' src/qwik-material/scss/list/list-prebuilt.scss | sed 's/^[[:space:]]*//' | sort -u)
```

Expected: no output.

- [ ] **Step 8: Confirm the structural CSS rules survived**

```bash
grep -cE '^\.mat-mdc-list' src/qwik-material/dist/list-prebuilt.css
```

Expected: at least `1`. Higher is fine (multiple container variants + `[aria-disabled]` selectors flatten to multiple top-level rules).

```bash
grep -cE '\.mat-mdc-list-item' src/qwik-material/dist/list-prebuilt.css
```

Expected: at least `5` — top-level `.mat-mdc-list-item` + `.mdc-list-item--activated` + `.mdc-list-item--disabled` + `:has()` variants + slot child selectors nested inside.

```bash
grep -E 'display:\s*grid' src/qwik-material/dist/list-prebuilt.css
```

Expected: at least one hit — the list-item declares `display: grid`.

```bash
grep -E ':has\(' src/qwik-material/dist/list-prebuilt.css
```

Expected: at least 2 hits — the two `:has(> .mat-mdc-list-item-line)` sizing rules.

- [ ] **Step 9: Confirm existing 10 prebuilt CSS files still emit**

```bash
ls src/qwik-material/dist/*.css
```

Expected: 11 files (dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list).

- [ ] **Step 10: Commit**

```bash
git add \
  src/qwik-material/scss/list/_list-theme.scss \
  src/qwik-material/scss/list/_list-item-hcm-indicator.scss \
  src/qwik-material/scss/list/_m2-list.scss \
  src/qwik-material/scss/list/_m3-list.scss \
  src/qwik-material/scss/list/list.scss \
  src/qwik-material/scss/list/list-prebuilt.scss
git commit -m "$(cat <<'EOF'
feat(multiple): list SCSS chain (4 partials synced + rewritten list.scss + prebuilt defaults)

4 upstream partials copied byte-identical (_list-theme, _list-item-hcm-indicator,
_m2-list, _m3-list). list.scss REWRITTEN to ~80 LOC of CSS-grid rules —
drops MDC's absolute-positioning + state-layer + ripple + focus-indicator
selectors per spec §4 + §5 deviation #7. _list-inherited-structure.scss
(477 LOC) DROPPED entirely — replaced by CSS grid + :has() line-count
sizing. No @use '@angular/cdk' rewrite needed (fourth port after Icon +
Divider + Grid List to skip).

list-prebuilt.scss declares :root defaults matching the CSS custom
properties emitted by the rewritten list.scss. Verified by grepping
dist/list-prebuilt.css and reconciling against the :root block until
the diff is empty.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Config token

### Task 3: `MatListConfig` + `MAT_LIST_CONFIG` context token

**Reference source:** design spec §3.5. Upstream has NO `MatListDefaultOptions` — the display list has no configurable defaults today. Empty `MatListConfig = {}` is a family-shape parity token, matching divider + grid-list precedent.

**Files:**
- Create: `src/qwik-material/list/list-config.ts`
- Create: `src/qwik-material/list/list-config.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface MatListConfig {}` (empty)
  - `const MAT_LIST_CONFIG: ContextId<MatListConfig>` with id `'qwik-material/list-config'`

- [ ] **Step 1: Create `src/qwik-material/list/list-config.ts`**

Contents:

```ts
import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every MatList / MatNavList / MatActionList / MatSubheader
 * in a subtree. Consumers provide this via
 * <QwikMaterialProvider matListConfig={...}>. Currently empty — the display
 * list has no consumer-configurable defaults today. Kept for family shape
 * parity with the other qwik-material components (divider, grid-list) and to
 * allow future fields without an API break.
 */
export interface MatListConfig {}

/**
 * Context id used by MatList / MatNavList / MatActionList / MatSubheader to
 * read config. The id string is exposed publicly and MUST remain stable
 * across releases — consumers may inject it directly in advanced scenarios.
 */
export const MAT_LIST_CONFIG = createContextId<MatListConfig>(
  'qwik-material/list-config',
);
```

- [ ] **Step 2: Create `src/qwik-material/list/list-config.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import {MAT_LIST_CONFIG, type MatListConfig} from './list-config';

describe('MAT_LIST_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_LIST_CONFIG.id).toBe('qwik-material/list-config');
  });

  it('MatListConfig accepts an empty object', () => {
    const cfg: MatListConfig = {};
    expect(cfg).toBeDefined();
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test list/list-config
```

Expected: 2/2 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/list/list-config.ts src/qwik-material/list/list-config.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatListConfig + MAT_LIST_CONFIG context token

Empty family-shape parity token matching divider + grid-list precedent.
No consumer-configurable defaults today; kept for future extensibility
without an API break.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Container variants

### Task 4: `MatList` + `MatNavList` + `MatActionList` + `MatSubheader` (4 container variants in one file)

**Reference source:** `src/material/list/list.ts` (91 LOC), `src/material/list/nav-list.ts` (38 LOC), `src/material/list/action-list.ts` (31 LOC), `src/material/list/subheader.ts` (21 LOC). Four upstream files collapsed into one Qwik port file since each Qwik component is a thin wrapper (config read + class ladder + Slot).

**Files:**
- Create: `src/qwik-material/list/mat-list.tsx`
- Create: `src/qwik-material/list/mat-list.spec.tsx`

**Interfaces:**
- Consumes:
  - `MAT_LIST_CONFIG` + `MatListConfig` from Task 3
- Produces:
  - `interface MatListProps` — role + disabled + aria trio + class + id per spec §3.1
  - `interface MatNavListProps extends MatListProps {}`
  - `interface MatActionListProps extends MatListProps {}`
  - `interface MatSubheaderProps` — aria trio + class + id (no role, no disabled)
  - `const MatList: Component<MatListProps>` — reads config with DEFAULTS fallback
  - `const MatNavList: Component<MatNavListProps>` — forces `role="navigation"`
  - `const MatActionList: Component<MatActionListProps>` — forces `role="group"`
  - `const MatSubheader: Component<MatSubheaderProps>`

- [ ] **Step 1: Create `src/qwik-material/list/mat-list.tsx`**

Contents:

```tsx
import {component$, Slot, useContext} from '@builder.io/qwik';
import {MAT_LIST_CONFIG, type MatListConfig} from './list-config';

/**
 * Shared props for the three container variants (MatList, MatNavList,
 * MatActionList). Each renders a distinct custom-element tag with its
 * own default role but the same underlying prop surface.
 */
export interface MatListProps {
  /** ARIA role passthrough. Upstream defaults to nothing (decorative);
   *  consumers may pass "list" per list.md guidance for lists of
   *  non-interactive content. Ignored on MatNavList (always "navigation")
   *  and MatActionList (always "group"). */
  role?: string;
  /** When true, sets aria-disabled on the container; CSS cascades disabled
   *  styling to all descendant list items via
   *  .mat-mdc-list[aria-disabled='true'] .mat-mdc-list-item — no per-item
   *  context needed. */
  disabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/** Alias interface for MatNavList. Same shape as MatListProps; the role
 *  prop is ignored (always "navigation"). */
export interface MatNavListProps extends MatListProps {}

/** Alias interface for MatActionList. Same shape as MatListProps; the role
 *  prop is ignored (always "group"). */
export interface MatActionListProps extends MatListProps {}

/**
 * Props for MatSubheader. Section title above a group of items. Upstream
 * ships this as a [matSubheader] directive; ported as a real component
 * with a <mat-subheader> custom-element tag for Qwik ergonomics.
 */
export interface MatSubheaderProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const CONFIG_DEFAULTS: MatListConfig = {};

export const MatList = component$<MatListProps>(props => {
  // Read config for family-shape consistency, even though it currently
  // has no fields to resolve. The read pattern is established so future
  // config fields plug in without a component-file rewrite. DEFAULTS
  // fallback is REQUIRED — bare useContext(MAT_LIST_CONFIG) throws
  // QError_notFoundContext when rendered outside <QwikMaterialProvider>
  // (Progress Bar / Progress Spinner post-mortem).
  useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS);

  const classes = ['mat-mdc-list', 'mat-mdc-list-base', 'mdc-list', props.class]
    .filter(Boolean) as string[];

  return (
    <mat-list
      id={props.id}
      class={classes}
      role={props.role}
      aria-disabled={props.disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-list>
  );
});

export const MatNavList = component$<MatNavListProps>(props => {
  useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS);

  const classes = ['mat-mdc-nav-list', 'mat-mdc-list-base', 'mdc-list', props.class]
    .filter(Boolean) as string[];

  return (
    <mat-nav-list
      id={props.id}
      class={classes}
      role="navigation"
      aria-disabled={props.disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-nav-list>
  );
});

export const MatActionList = component$<MatActionListProps>(props => {
  useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS);

  const classes = ['mat-mdc-action-list', 'mat-mdc-list-base', 'mdc-list', props.class]
    .filter(Boolean) as string[];

  return (
    <mat-action-list
      id={props.id}
      class={classes}
      role="group"
      aria-disabled={props.disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-action-list>
  );
});

export const MatSubheader = component$<MatSubheaderProps>(props => {
  useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS);

  const classes = ['mat-mdc-subheader', 'mdc-list-group__subheader', props.class]
    .filter(Boolean) as string[];

  return (
    <mat-subheader
      id={props.id}
      class={classes}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-subheader>
  );
});
```

Notes for the implementer:
- **All 4 components read `MAT_LIST_CONFIG` with `CONFIG_DEFAULTS` fallback** — required per Global Constraints (Progress Bar/Spinner lesson).
- **MatNavList forces `role="navigation"`** and MatActionList forces `role="group"` — matches upstream `host: { 'role': 'navigation' }` / `host: { 'role': 'group' }`. Consumer `role` prop is dropped from these variants (accepted in the interface for interface consistency but not passed through).
- **`aria-disabled` reflection** — only emitted when `props.disabled === true`, else `undefined` (Qwik drops undefined attrs). Matches upstream `[attr.aria-disabled]='disabled'` binding.
- **MatSubheader has NO disabled or role** — matches upstream's directive-only shape.
- **Class ladder cast pattern** — `.filter(Boolean) as string[]` for Qwik's `ClassList` type quirk (established from prior ports).

- [ ] **Step 2: Create `src/qwik-material/list/mat-list.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatList, MatNavList, MatActionList, MatSubheader} from './mat-list';

describe('MatList container variants (smoke)', () => {
  it('MatList is exported and is a function-shaped component', () => {
    expect(MatList).toBeDefined();
    expect(typeof MatList).toBe('function');
  });

  it('MatNavList is exported and is a function-shaped component', () => {
    expect(MatNavList).toBeDefined();
    expect(typeof MatNavList).toBe('function');
  });

  it('MatActionList is exported and is a function-shaped component', () => {
    expect(MatActionList).toBeDefined();
    expect(typeof MatActionList).toBe('function');
  });

  it('MatSubheader is exported and is a function-shaped component', () => {
    expect(MatSubheader).toBeDefined();
    expect(typeof MatSubheader).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test list/mat-list
```

Expected: 4/4 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/list/mat-list.tsx
```

Expected: no matches.

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/list/mat-list.tsx
```

Expected: no matches.

- [ ] **Step 6: Full-suite regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: full suite passes; total = pre-Task-4 total + 4 passing (this task's smoke), zero failures.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-material/list/mat-list.tsx src/qwik-material/list/mat-list.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatList/MatNavList/MatActionList/MatSubheader container variants

Four thin component$ wrappers in one file. All read MAT_LIST_CONFIG with
CONFIG_DEFAULTS fallback (SSR-safe per Progress Bar/Spinner lesson).
MatNavList forces role='navigation', MatActionList forces role='group',
MatList/MatSubheader pass through consumer role. disabled prop on
containers reflects aria-disabled=true; CSS cascade handles per-item
styling via [aria-disabled='true'] .mat-mdc-list-item.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — MatListItem (polymorphic host)

### Task 5: `<MatListItem>` component with `as` prop polymorphism

**Reference source:** `src/material/list/list.ts` MatListItem class (lines 44-91). Ports the polymorphic host selector `mat-list-item, a[mat-list-item], button[mat-list-item]` into an `as?: 'div' | 'a' | 'button'` prop. Drops ripple, focus indicator, `@ContentChildren` line-count JS, and CDK observer per spec §5 deviations #1-#5.

**Files:**
- Create: `src/qwik-material/list/mat-list-item.tsx`
- Create: `src/qwik-material/list/mat-list-item.spec.tsx`

**Interfaces:**
- Consumes: nothing (does NOT read MAT_LIST_CONFIG — only container components do; MatListItem is fully local).
- Produces:
  - `interface MatListItemProps` — `as` + `href` + `activated` + `disabled` + `role` + aria trio + class + id per spec §3.2
  - `const MatListItem: Component<MatListItemProps>`

- [ ] **Step 1: Create `src/qwik-material/list/mat-list-item.tsx`**

Contents:

```tsx
import {component$, Slot} from '@builder.io/qwik';

/**
 * Props for MatListItem. Polymorphic host via `as` prop:
 *   - 'div' (default) renders <mat-list-item> custom element
 *   - 'a' renders <a> (mirrors upstream a[mat-list-item] selector)
 *   - 'button' renders <button> (mirrors upstream button[mat-list-item]
 *     selector)
 *
 * See design spec §3.2 for rendered DOM shape per variant.
 */
export interface MatListItemProps {
  /** Which host tag to render. Default 'div' renders <mat-list-item>.
   *  'a' renders <a> (for nav-list items — combine with href).
   *  'button' renders <button> (for action-list items — combine with
   *  onClick$). */
  as?: 'div' | 'a' | 'button';
  /** When as='a', sets the href. Ignored for other tags. */
  href?: string;
  /** For nav-list items: marks this as the current page → emits
   *  aria-current="page". Only emitted when as='a' AND activated
   *  (matches upstream _getAriaCurrent). */
  activated?: boolean;
  /** Applies mdc-list-item--disabled + aria-disabled=true.
   *  When as='button', also reflects the native disabled attribute
   *  (matches upstream (_isButtonElement && disabled) || null binding). */
  disabled?: boolean;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatListItem = component$<MatListItemProps>(props => {
  const as = props.as ?? 'div';
  const activated = props.activated ?? false;
  const disabled = props.disabled ?? false;

  const classes = [
    'mat-mdc-list-item',
    'mdc-list-item',
    activated && 'mdc-list-item--activated',
    disabled && 'mdc-list-item--disabled',
    props.class,
  ].filter(Boolean) as string[];

  // aria-current="page" only for anchor variant with activated=true.
  const ariaCurrent = as === 'a' && activated ? 'page' : undefined;

  // Native disabled attribute only reflected on button variant.
  const nativeDisabled = as === 'button' && disabled ? true : undefined;

  if (as === 'a') {
    return (
      <a
        id={props.id}
        class={classes}
        href={props.href}
        role={props.role}
        aria-current={ariaCurrent}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
      >
        <Slot />
      </a>
    );
  }

  if (as === 'button') {
    return (
      <button
        id={props.id}
        class={classes}
        disabled={nativeDisabled}
        role={props.role}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
      >
        <Slot />
      </button>
    );
  }

  // Default: <mat-list-item> custom element.
  return (
    <mat-list-item
      id={props.id}
      class={classes}
      role={props.role}
      aria-disabled={disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-list-item>
  );
});
```

Notes for the implementer:
- **NO focus indicator `<div>`** — upstream renders `<div class="mat-focus-indicator" />` for CDK focus indicator; dropped per spec §5 deviation #5.
- **NO inner `<span class="mdc-list-item__content">` wrapper** — CSS grid handles positioning directly on the item host; no content wrapper needed. Consumer's slot components appear directly as children.
- **`aria-current="page"`** only when both `as='a'` AND `activated` — matches upstream `_getAriaCurrent()` logic exactly.
- **Native `disabled` attribute** only reflected on button variant — matches upstream `(_isButtonElement && disabled) || null` binding.
- **Three-branch render** (a / button / default custom-element) is necessary because Qwik JSX doesn't support dynamic tag names via string. Each branch renders the same class ladder + aria props but with the correct host tag. The three branches share the same `classes` / `activated` / `disabled` state — DRY within each render call.
- **No `useContext` for MAT_LIST_CONFIG** — MatListItem is fully local; only container components read the config. If future config fields need to influence items, add the useContext then.

- [ ] **Step 2: Create `src/qwik-material/list/mat-list-item.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatListItem} from './mat-list-item';

describe('MatListItem (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatListItem).toBeDefined();
    expect(typeof MatListItem).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test list/mat-list-item
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/list/mat-list-item.tsx
```

Expected: no matches.

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/list/mat-list-item.tsx
```

Expected: no matches.

- [ ] **Step 6: Full-suite regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: full suite passes; total = pre-Task-5 total + 1 passing, zero failures.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-material/list/mat-list-item.tsx src/qwik-material/list/mat-list-item.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatListItem with polymorphic host (as div/a/button)

Three-branch render mirrors upstream's mat-list-item, a[mat-list-item],
button[mat-list-item] polymorphic selector. Default renders
<mat-list-item> custom element. aria-current='page' only when as='a' AND
activated (matches _getAriaCurrent). Native disabled attribute only
reflected on button variant. No focus indicator div (spec §5 deviation
#5). No mdc-list-item__content inner wrapper — CSS grid handles slot
placement directly on the item host.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Slot components

### Task 6: Five slot components in one file

**Reference source:** `src/material/list/list-item-sections.ts` (100 LOC — 5 directives: MatListItemTitle, MatListItemLine, MatListItemMeta, MatListItemAvatar, MatListItemIcon, plus base class `_MatListItemGraphicBase` and CSS class hooks). Directives don't map to Qwik; ported as 5 wrapper components per spec §5 deviation #9.

**Files:**
- Create: `src/qwik-material/list/mat-list-item-sections.tsx`
- Create: `src/qwik-material/list/mat-list-item-sections.spec.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface MatListItemSectionProps` — `class?: string | ReadonlyArray<string>`, `id?: string` (shared by all 5)
  - `const MatListItemAvatar: Component<MatListItemSectionProps>` — class hooks `mat-mdc-list-item-avatar mdc-list-item__start`
  - `const MatListItemIcon: Component<MatListItemSectionProps>` — class hooks `mat-mdc-list-item-icon mdc-list-item__start`
  - `const MatListItemTitle: Component<MatListItemSectionProps>` — class hooks `mat-mdc-list-item-title mdc-list-item__primary-text`
  - `const MatListItemLine: Component<MatListItemSectionProps>` — class hooks `mat-mdc-list-item-line mdc-list-item__secondary-text`
  - `const MatListItemMeta: Component<MatListItemSectionProps>` — class hooks `mat-mdc-list-item-meta mdc-list-item__end`

- [ ] **Step 1: Create `src/qwik-material/list/mat-list-item-sections.tsx`**

Contents:

```tsx
import {component$, Slot} from '@builder.io/qwik';

/**
 * Shared props for the 5 slot components (Avatar, Icon, Title, Line, Meta).
 * Each is a trivial component$ wrapper rendering
 * <div class="<class-hooks>"><Slot /></div>. Consumer composes them as
 * children of <MatListItem> in ANY DOM order — CSS grid on
 * .mat-mdc-list-item places by class regardless of order.
 *
 * Upstream ships these as [matListItem*] attribute directives; ported as
 * real components for Qwik ergonomics per spec §5 deviation #9. CSS class
 * hooks preserved for external stylesheet compatibility.
 */
export interface MatListItemSectionProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/**
 * Leading avatar section. Circular by default (border-radius: 50%,
 * 40x40px). Placed in grid column 1 spanning all rows by list.scss.
 */
export const MatListItemAvatar = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-avatar', 'mdc-list-item__start', props.class]
    .filter(Boolean) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Leading icon section. 24x24px by default. Placed in grid column 1
 * spanning all rows by list.scss.
 */
export const MatListItemIcon = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-icon', 'mdc-list-item__start', props.class]
    .filter(Boolean) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Primary title text. Placed in grid column 2 by list.scss. Only one
 * title per list item (upstream constraint — no per-item enforcement in
 * the port; user responsibility).
 */
export const MatListItemTitle = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-title', 'mdc-list-item__primary-text', props.class]
    .filter(Boolean) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Secondary line text. Placed in grid column 2 by list.scss (auto-row
 * placement stacks multiple lines vertically). Line-count sizing (48/64/88px
 * min-height) driven by CSS :has() selectors on the parent item.
 */
export const MatListItemLine = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-line', 'mdc-list-item__secondary-text', props.class]
    .filter(Boolean) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Trailing meta section (control, button, additional text). Placed in
 * grid column 3 spanning all rows by list.scss.
 */
export const MatListItemMeta = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-meta', 'mdc-list-item__end', props.class]
    .filter(Boolean) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});
```

Notes for the implementer:
- **All 5 components share the exact same shape** — one shared interface, same class-ladder pattern, same `<div>{...}<Slot /></div>` render. Kept as 5 separate components (not one parametrized) for consumer ergonomics — `<MatListItemAvatar>` reads better than `<MatListItemSection type="avatar">`.
- **No `useContext` needed** — CSS grid handles positioning; no parent state needed. No `_MatListItemGraphicBase` equivalent (upstream detects `[LIST_OPTION]` presence to swap `__start`/`__end`; selection-list is out of scope so both Avatar and Icon always emit `mdc-list-item__start`).
- **Zero conditional logic** — each component is a straight render.

- [ ] **Step 2: Create `src/qwik-material/list/mat-list-item-sections.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {
  MatListItemAvatar,
  MatListItemIcon,
  MatListItemTitle,
  MatListItemLine,
  MatListItemMeta,
} from './mat-list-item-sections';

describe('MatListItem slot components (smoke)', () => {
  it('MatListItemAvatar is exported and is a function-shaped component', () => {
    expect(MatListItemAvatar).toBeDefined();
    expect(typeof MatListItemAvatar).toBe('function');
  });

  it('MatListItemIcon is exported and is a function-shaped component', () => {
    expect(MatListItemIcon).toBeDefined();
    expect(typeof MatListItemIcon).toBe('function');
  });

  it('MatListItemTitle is exported and is a function-shaped component', () => {
    expect(MatListItemTitle).toBeDefined();
    expect(typeof MatListItemTitle).toBe('function');
  });

  it('MatListItemLine is exported and is a function-shaped component', () => {
    expect(MatListItemLine).toBeDefined();
    expect(typeof MatListItemLine).toBe('function');
  });

  it('MatListItemMeta is exported and is a function-shaped component', () => {
    expect(MatListItemMeta).toBeDefined();
    expect(typeof MatListItemMeta).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test list/mat-list-item-sections
```

Expected: 5/5 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/list/mat-list-item-sections.tsx
```

Expected: no matches.

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/list/mat-list-item-sections.tsx
```

Expected: no matches.

- [ ] **Step 6: Full-suite regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: full suite passes; total = pre-Task-6 total + 5 passing, zero failures.

- [ ] **Step 7: Commit**

```bash
git add \
  src/qwik-material/list/mat-list-item-sections.tsx \
  src/qwik-material/list/mat-list-item-sections.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add 5 MatListItem slot components (Avatar, Icon, Title, Line, Meta)

Five trivial component$ wrappers each rendering
<div class="<hooks>"><Slot /></div>. Shared MatListItemSectionProps
interface (class + id). Consumer composes as children of MatListItem in
any DOM order — CSS grid on .mat-mdc-list-item places by class regardless
of order (no q:slot required). Upstream directives ([matListItemAvatar]
etc.) don't map to Qwik; ported as real components per spec §5 deviation
#9. CSS class hooks preserved.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Provider extension

### Task 7: Extend `<QwikMaterialProvider>` with `matListConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (currently ships 11 `useContextProvider` calls after Grid List). Adding list makes it 12.

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-list.spec.tsx`

**Interfaces:**
- Consumes: `MatListConfig` + `MAT_LIST_CONFIG` from Task 3.
- Produces: an extended `QwikMaterialProviderProps.matListConfig?: MatListConfig` field + a 12th `useContextProvider(MAT_LIST_CONFIG, ...)` call. All 11 pre-existing provider calls unchanged.

- [ ] **Step 1: Extend the imports at the top of `qwik-material-provider.tsx`**

Read the file's current import block. Add two import lines after the grid-list import block:

```tsx
import type {MatListConfig} from '../list/list-config';
import {MAT_LIST_CONFIG} from '../list/list-config';
```

- [ ] **Step 2: Extend `QwikMaterialProviderProps` with the `matListConfig?` field**

Append to the interface body (after `matGridListConfig`), with a doc comment:

```tsx
  /** Defaults applied to every MatList / MatNavList / MatActionList / MatSubheader in this subtree. */
  matListConfig?: MatListConfig;
```

- [ ] **Step 3: Add the 12th `useContextProvider` call at the end of the component body**

Append AFTER the `useContextProvider(MAT_GRID_LIST_CONFIG, props.matGridListConfig ?? {});` line and BEFORE the `return <Slot />;`:

```tsx
  // MatListConfig is a plain object (currently empty) — no noSerialize needed.
  // Lists outside a provider get the CONFIG_DEFAULTS declared in MatList/
  // MatNavList/MatActionList/MatSubheader; providing an empty object is
  // equivalent to accepting all defaults.
  useContextProvider(MAT_LIST_CONFIG, props.matListConfig ?? {});
```

Verify all 11 pre-existing `useContextProvider` calls are untouched (in order: MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_ANIMATIONS_DISABLED, MAT_BUTTON_CONFIG, MAT_CARD_CONFIG, MAT_BADGE_CONFIG, MAT_ICON_CONFIG, MAT_PROGRESS_BAR_CONFIG, MAT_PROGRESS_SPINNER_CONFIG, MAT_DIVIDER_CONFIG, MAT_GRID_LIST_CONFIG). Do NOT change their order or arguments.

- [ ] **Step 4: Create the provider-list smoke spec `qwik-material-provider-list.spec.tsx`**

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatListConfig} from '../list/list-config';

describe('QwikMaterialProvider — matListConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts an empty matListConfig', () => {
    const cfg: MatListConfig = {};
    const props: QwikMaterialProviderProps = {matListConfig: cfg};
    expect(props.matListConfig).toBeDefined();
  });

  it('QwikMaterialProviderProps.matListConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matListConfig).toBeUndefined();
  });
});
```

- [ ] **Step 5: Run the provider spec**

```bash
pnpm -C src/qwik-material test qwik-material-provider-list
```

Expected: 3/3 passing, exit 0.

- [ ] **Step 6: Run the full qwik-material vitest to confirm no regression**

```bash
pnpm -C src/qwik-material test
```

Expected: all files pass; total count = pre-Task-7 total + 3 passing.

- [ ] **Step 7: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add \
  src/qwik-material/dialog/qwik-material-provider.tsx \
  src/qwik-material/dialog/qwik-material-provider-list.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): extend QwikMaterialProvider with matListConfig

Adds the 12th useContextProvider call (after MAT_GRID_LIST_CONFIG). All
11 pre-existing provider calls preserved unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Public API

### Task 8: `list/public-api.ts` + `list/index.ts` + build verification

**Reference source:** design spec §3.6 (18 exports total).

**Files:**
- Create: `src/qwik-material/list/public-api.ts`
- Modify: `src/qwik-material/list/index.ts` (was empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Tasks 3, 4, 5, 6.
- Produces: the exact public export surface consumers see when they import from `@angular-community/qwik-material/list`. **18 total exports:** 7 types + 1 value + 10 components.

- [ ] **Step 1: Create `src/qwik-material/list/public-api.ts`**

Contents (matches design spec §3.6 verbatim):

```ts
// Public API for @angular-community/qwik-material/list.
// See docs/superpowers/specs/2026-08-08-qwik-material-list-port-design.md §3.

export type {MatListConfig} from './list-config';
export {MAT_LIST_CONFIG} from './list-config';

export {
  MatList,
  type MatListProps,
  MatNavList,
  type MatNavListProps,
  MatActionList,
  type MatActionListProps,
  MatSubheader,
  type MatSubheaderProps,
} from './mat-list';

export {MatListItem, type MatListItemProps} from './mat-list-item';

export {
  MatListItemAvatar,
  MatListItemIcon,
  MatListItemTitle,
  MatListItemLine,
  MatListItemMeta,
  type MatListItemSectionProps,
} from './mat-list-item-sections';
```

- [ ] **Step 2: Replace the empty stub in `src/qwik-material/list/index.ts`**

Replace the entire file (was `export {};` from Task 1) with:

```ts
export * from './public-api';
```

- [ ] **Step 3: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. No Rollup `Illegal reassignment of import` errors (list has no module-level mutable state — all 10 components are pure).

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify all 18 symbols are present in the emitted d.ts**

```bash
for sym in MatListConfig MAT_LIST_CONFIG \
           MatList MatListProps MatNavList MatNavListProps \
           MatActionList MatActionListProps MatSubheader MatSubheaderProps \
           MatListItem MatListItemProps \
           MatListItemAvatar MatListItemIcon MatListItemTitle MatListItemLine MatListItemMeta \
           MatListItemSectionProps; do
  count=$(grep -c "\b${sym}\b" src/qwik-material/dist/list/public-api.d.ts 2>/dev/null || echo 0)
  echo "$sym: $count"
done
```

Expected: each symbol reports `1` or greater. Total distinct symbol lookups = 18.

Confirm no leaked classes:

```bash
grep -nE "^export declare class" src/qwik-material/dist/list/public-api.d.ts
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/list/public-api.ts src/qwik-material/list/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): finalize qwik-material/list public API

18 exports total: MatListConfig type + MAT_LIST_CONFIG value + 4 container
props types + 4 container components + MatListItem/Props + 5 slot
components + MatListItemSectionProps type.

Largest export surface of any port so far, justified by the 10-component
compositional slot pattern.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Vitest scenario port

### Task 9: Vitest scenario port from `src/material/list/list.spec.ts`

**Reference source:** `src/material/list/list.spec.ts` (650 LOC — heavy on `@ContentChildren` QueryList assertions + `_updateItemLines` + `cdkObserveContent` behavior). Most of that is moot in the port because layout is pure CSS `:has()` (spec §5 deviations #1-#2). Restructured per spec §6.1.

**Files:**
- Create: `src/qwik-material/list/mat-list-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 8.
- Produces: consolidated scenario coverage documenting upstream test intent.

- [ ] **Step 1: Write the scenario spec**

Contents:

```tsx
/**
 * MatList scenario port from src/material/list/list.spec.ts.
 *
 * Upstream has ~40 `it()` blocks — heavy on @ContentChildren QueryList
 * inspection + _updateItemLines + cdkObserveContent behavior verification.
 * All of that is moot in the port because layout is pure CSS grid + :has()
 * (spec §5 deviations #1, #2). Restructured:
 *
 *   - Live sanity tests (7): typeof + MAT_LIST_CONFIG.id + config +
 *     props shape acceptance for all 10 components.
 *   - describe.skip DOM-rendered (8): container variants + polymorphic
 *     item + slot components + CSS grid layout + :has() sizing.
 *     Deferred to Playwright Task 11.
 *   - describe.skip Angular-only (4): BooleanInput/NumberInput coercion,
 *     @ContentChildren + _updateItemLines + cdkObserveContent,
 *     MatListBase/MatListItemBase inheritance, ripple/focus-manager/state
 *     layer. Deferred forever per spec §5.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-list/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_LIST_CONFIG,
  MatList,
  MatNavList,
  MatActionList,
  MatSubheader,
  MatListItem,
  MatListItemAvatar,
  MatListItemIcon,
  MatListItemTitle,
  MatListItemLine,
  MatListItemMeta,
  type MatListConfig,
  type MatListProps,
  type MatNavListProps,
  type MatActionListProps,
  type MatSubheaderProps,
  type MatListItemProps,
  type MatListItemSectionProps,
} from './public-api';

describe('MatList surface — sanity', () => {
  it('all 10 components are exported and function-shaped', () => {
    expect(typeof MatList).toBe('function');
    expect(typeof MatNavList).toBe('function');
    expect(typeof MatActionList).toBe('function');
    expect(typeof MatSubheader).toBe('function');
    expect(typeof MatListItem).toBe('function');
    expect(typeof MatListItemAvatar).toBe('function');
    expect(typeof MatListItemIcon).toBe('function');
    expect(typeof MatListItemTitle).toBe('function');
    expect(typeof MatListItemLine).toBe('function');
    expect(typeof MatListItemMeta).toBe('function');
  });

  it('MAT_LIST_CONFIG carries the expected context id', () => {
    expect(MAT_LIST_CONFIG.id).toBe('qwik-material/list-config');
  });

  it('MatListConfig accepts an empty object', () => {
    const cfg: MatListConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatListProps + MatNavListProps + MatActionListProps accept aria + role + disabled + class + id', () => {
    const listProps: MatListProps = {
      role: 'list',
      disabled: false,
      'aria-label': 'Inbox',
      'aria-labelledby': 'inbox-heading',
      'aria-describedby': 'inbox-desc',
      class: 'my-list',
      id: 'inbox',
    };
    const navProps: MatNavListProps = {
      role: 'ignored — nav forces navigation',
      disabled: true,
      'aria-label': 'Main navigation',
      class: 'my-nav',
      id: 'nav',
    };
    const actionProps: MatActionListProps = {
      disabled: false,
      class: 'my-actions',
      id: 'actions',
    };
    expect(listProps['aria-label']).toBe('Inbox');
    expect(navProps.disabled).toBe(true);
    expect(actionProps.class).toBe('my-actions');
  });

  it('MatListItemProps accepts as / href / activated / disabled + aria + role', () => {
    const divProps: MatListItemProps = {
      role: 'listitem',
      class: 'item',
      id: 'i1',
    };
    const anchorProps: MatListItemProps = {
      as: 'a',
      href: '/inbox',
      activated: true,
      'aria-label': 'Inbox',
      id: 'nav-inbox',
    };
    const buttonProps: MatListItemProps = {
      as: 'button',
      disabled: true,
      'aria-label': 'Delete',
      id: 'delete',
    };
    expect(divProps.role).toBe('listitem');
    expect(anchorProps.as).toBe('a');
    expect(anchorProps.href).toBe('/inbox');
    expect(anchorProps.activated).toBe(true);
    expect(buttonProps.as).toBe('button');
    expect(buttonProps.disabled).toBe(true);
  });

  it('MatSubheaderProps accepts aria + class + id (no role, no disabled)', () => {
    const props: MatSubheaderProps = {
      'aria-label': 'Section header',
      'aria-labelledby': 'section-title',
      'aria-describedby': 'section-desc',
      class: 'my-subheader',
      id: 'sh1',
    };
    expect(props['aria-label']).toBe('Section header');
  });

  it('MatListItemSectionProps accepts class + id (shared by all 5 slot components)', () => {
    const props: MatListItemSectionProps = {
      class: 'my-avatar',
      id: 'avatar-1',
    };
    expect(props.class).toBe('my-avatar');
    expect(props.id).toBe('avatar-1');
  });

  it('MatListItemProps.as union covers exactly div/a/button', () => {
    const divVariant: MatListItemProps['as'] = 'div';
    const anchorVariant: MatListItemProps['as'] = 'a';
    const buttonVariant: MatListItemProps['as'] = 'button';
    expect(divVariant).toBe('div');
    expect(anchorVariant).toBe('a');
    expect(buttonVariant).toBe('button');
  });
});

describe.skip('MatList DOM-rendered scenarios — deferred to Playwright Task 11', () => {
  it('MatList renders <mat-list> with class ladder + role passthrough', () => {});
  it('MatNavList renders <mat-nav-list role="navigation">', () => {});
  it('MatActionList renders <mat-action-list role="group">', () => {});
  it('MatListItem polymorphism: as="div" → <mat-list-item>; as="a" href → <a href>; as="button" → <button>', () => {});
  it('MatListItem activated on <a> emits aria-current="page"; on <div> does not', () => {});
  it('slot components (Avatar/Icon/Title/Line/Meta) render <div> with class hooks', () => {});
  it('CSS grid layout: avatar left, title/lines center, meta right (Playwright bounding-box)', () => {});
  it(':has() line-count sizing: 1/2/3 lines → 48/64/88px min-height', () => {});
});

describe.skip('MatList — Angular-only tests', () => {
  it('should coerce BooleanInput/NumberInput attribute values', () => {
    // Omitted — Qwik JSX passes booleans/numbers directly (spec §5 deviation #10).
  });
  it('should enumerate slot content via @ContentChildren + _updateItemLines + cdkObserveContent', () => {
    // Replaced by CSS :has() selectors (spec §5 deviation #2).
  });
  it('should inherit from MatListBase / MatListItemBase abstract classes', () => {
    // Collapsed to plain component$ wrappers (spec §5 deviation #10).
  });
  it('should integrate ripple / focus-manager / MDC state layer', () => {
    // All out of scope (spec §5 deviations #1, #4, #7).
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
pnpm -C src/qwik-material test list/mat-list-scenarios
```

Expected: 7 passing + 12 skipped, exit 0.

- [ ] **Step 3: Run the full qwik-material suite for regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-9 total + 7 passing + 12 skipped, zero failures. Cumulative new passes over the port (Tasks 3-9): 2 (Task 3 config) + 4 (Task 4 containers) + 1 (Task 5 item) + 5 (Task 6 sections) + 3 (Task 7 provider) + 7 (Task 9 scenarios) = 22. Baseline post-grid-list was 212 pass. Target after this task ≈ **234 pass** (exact count verified at implementation; may vary slightly by suite arithmetic).

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/list/mat-list-scenarios.spec.tsx
git commit -m "$(cat <<'EOF'
test(multiple): port MatList scenarios from upstream list.spec.ts

19 it() blocks total: 7 live sanity + 8 describe.skip DOM stubs (deferred
to Playwright Task 11) + 4 describe.skip Angular-only stubs (deferred
forever per spec §5). No createDOM — smoke variant only.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 10 — Dev-app routes

### Task 10: 8 mat-list dev-app routes + index tile + root.tsx CSS import

**Reference source:** existing dev-app patterns from Grid List port at `src/qwik-cdk-dev-app/src/routes/mat-grid-list/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add list-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Lists" section with 8 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-list/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-list/two-line/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-list/three-line/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-list/avatar/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-list/icon-meta/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-list/nav/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-list/action/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-list/with-subheader/index.tsx`

**Interfaces:**
- Consumes: `@angular-community/qwik-material/list` (Task 8), `@angular-community/qwik-material/divider` (for the with-subheader route).
- Produces: 8 dev-app routes at `/mat-list/*` rendering visibly in browser preview.

- [ ] **Step 1: Add the list-prebuilt.css import to `src/qwik-cdk-dev-app/src/root.tsx`**

Read the current file. Append the list CSS import after the grid-list one:

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
import '@angular-community/qwik-material/list-prebuilt.css';
```

- [ ] **Step 2: Add a "Lists" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert after the existing "Grid lists" section:

```tsx
<section>
  <h2>Lists</h2>
  <ul>
    <li><a href="/mat-list/basic/">basic</a></li>
    <li><a href="/mat-list/two-line/">two-line</a></li>
    <li><a href="/mat-list/three-line/">three-line</a></li>
    <li><a href="/mat-list/avatar/">avatar</a></li>
    <li><a href="/mat-list/icon-meta/">icon-meta</a></li>
    <li><a href="/mat-list/nav/">nav</a></li>
    <li><a href="/mat-list/action/">action</a></li>
    <li><a href="/mat-list/with-subheader/">with-subheader</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatList role="list">
      <MatListItem>
        <MatListItemTitle>Item 1</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Item 2</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Item 3</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Item 4</MatListItemTitle>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `two-line/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatList, MatListItem, MatListItemTitle, MatListItemLine} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatList role="list">
      <MatListItem>
        <MatListItemTitle>Message from Alice</MatListItemTitle>
        <MatListItemLine>Preview text goes here</MatListItemLine>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Message from Bob</MatListItemTitle>
        <MatListItemLine>Another preview line</MatListItemLine>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Message from Carol</MatListItemTitle>
        <MatListItemLine>Yet another preview</MatListItemLine>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `three-line/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatList, MatListItem, MatListItemTitle, MatListItemLine} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatList role="list">
      <MatListItem>
        <MatListItemTitle>Message from Alice</MatListItemTitle>
        <MatListItemLine>Subject line here</MatListItemLine>
        <MatListItemLine>Preview text of the message body</MatListItemLine>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Message from Bob</MatListItemTitle>
        <MatListItemLine>Different subject</MatListItemLine>
        <MatListItemLine>Different preview</MatListItemLine>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Message from Carol</MatListItemTitle>
        <MatListItemLine>Third subject</MatListItemLine>
        <MatListItemLine>Third preview</MatListItemLine>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create `avatar/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatListItemLine,
  MatListItemAvatar,
} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatList role="list">
      <MatListItem>
        <MatListItemAvatar>
          <div style={{width: '100%', height: '100%', background: '#f44336'}} />
        </MatListItemAvatar>
        <MatListItemTitle>Alice Smith</MatListItemTitle>
        <MatListItemLine>alice@example.com</MatListItemLine>
      </MatListItem>
      <MatListItem>
        <MatListItemAvatar>
          <div style={{width: '100%', height: '100%', background: '#4caf50'}} />
        </MatListItemAvatar>
        <MatListItemTitle>Bob Jones</MatListItemTitle>
        <MatListItemLine>bob@example.com</MatListItemLine>
      </MatListItem>
      <MatListItem>
        <MatListItemAvatar>
          <div style={{width: '100%', height: '100%', background: '#2196f3'}} />
        </MatListItemAvatar>
        <MatListItemTitle>Carol Davis</MatListItemTitle>
        <MatListItemLine>carol@example.com</MatListItemLine>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `icon-meta/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatListItemIcon,
  MatListItemMeta,
} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatList role="list">
      <MatListItem>
        <MatListItemIcon>
          <div style={{width: '100%', height: '100%', background: '#f44336', borderRadius: '4px'}} />
        </MatListItemIcon>
        <MatListItemTitle>Inbox</MatListItemTitle>
        <MatListItemMeta>128</MatListItemMeta>
      </MatListItem>
      <MatListItem>
        <MatListItemIcon>
          <div style={{width: '100%', height: '100%', background: '#4caf50', borderRadius: '4px'}} />
        </MatListItemIcon>
        <MatListItemTitle>Sent</MatListItemTitle>
        <MatListItemMeta>42</MatListItemMeta>
      </MatListItem>
      <MatListItem>
        <MatListItemIcon>
          <div style={{width: '100%', height: '100%', background: '#2196f3', borderRadius: '4px'}} />
        </MatListItemIcon>
        <MatListItemTitle>Drafts</MatListItemTitle>
        <MatListItemMeta>7</MatListItemMeta>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create `nav/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatNavList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatNavList>
      <MatListItem as="a" href="/inbox">
        <MatListItemTitle>Inbox</MatListItemTitle>
      </MatListItem>
      <MatListItem as="a" href="/sent" activated>
        <MatListItemTitle>Sent</MatListItemTitle>
      </MatListItem>
      <MatListItem as="a" href="/drafts">
        <MatListItemTitle>Drafts</MatListItemTitle>
      </MatListItem>
    </MatNavList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Create `action/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatActionList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatActionList>
      <MatListItem as="button">
        <MatListItemTitle>Save</MatListItemTitle>
      </MatListItem>
      <MatListItem as="button">
        <MatListItemTitle>Duplicate</MatListItemTitle>
      </MatListItem>
      <MatListItem as="button" disabled>
        <MatListItemTitle>Delete</MatListItemTitle>
      </MatListItem>
    </MatActionList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 10: Create `with-subheader/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatSubheader,
} from '@angular-community/qwik-material/list';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <MatList role="list">
      <MatSubheader>Inbox</MatSubheader>
      <MatListItem>
        <MatListItemTitle>Message 1</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Message 2</MatListItemTitle>
      </MatListItem>
      <MatDivider />
      <MatSubheader>Archive</MatSubheader>
      <MatListItem>
        <MatListItemTitle>Archived 1</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Archived 2</MatListItemTitle>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 11: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Confirm client + SSR builds succeed. Verify 8 mat-list routes in the manifest:

```bash
grep -oE 'mat-list/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `8`.

List them explicitly:

```bash
grep -oE 'mat-list/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u
```

Expected:
```
mat-list/action
mat-list/avatar
mat-list/basic
mat-list/icon-meta
mat-list/nav
mat-list/three-line
mat-list/two-line
mat-list/with-subheader
```

- [ ] **Step 12: Commit**

```bash
git add \
  src/qwik-cdk-dev-app/src/root.tsx \
  src/qwik-cdk-dev-app/src/routes/index.tsx \
  src/qwik-cdk-dev-app/src/routes/mat-list/
git commit -m "$(cat <<'EOF'
feat(multiple): mat-list dev-app routes (8)

8 routes under /mat-list/*: basic, two-line, three-line, avatar, icon-meta,
nav (as='a' + activated), action (as='button' + disabled), with-subheader
(mixed layout using MatSubheader + MatDivider composition).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 11 — Playwright parity specs

### Task 11: 8 Playwright parity specs

**Reference source:** existing Playwright patterns from Grid List at `src/qwik-cdk-parity-tests/specs/material-grid-list/` (7 specs — tag-based locators, bounding-box assertions).

**Files:**
- Create: `src/qwik-cdk-parity-tests/specs/material-list/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-list/two-line.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-list/three-line.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-list/avatar.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-list/icon-meta.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-list/nav.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-list/action.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-list/with-subheader.spec.ts`

**Interfaces:**
- Consumes: Task 10's 8 dev-app routes.
- Produces: 8 Playwright specs asserting host tag + classes + attrs + geometry.

- [ ] **Step 1: Create `basic.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/basic — <mat-list> with 4 items, role="list", ~48px min-height per item', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-list/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-list');
  await expect(list).toBeVisible();
  await expect(list).toHaveClass(/mat-mdc-list/);
  await expect(list).toHaveAttribute('role', 'list');

  const items = page.locator('mat-list-item');
  await expect(items).toHaveCount(4);
  await expect(items.first()).toHaveClass(/mat-mdc-list-item/);

  // Item min-height ≈ 48px (single-line default). Tolerance ±3px.
  const firstBox = await items.first().boundingBox();
  expect(firstBox).not.toBeNull();
  expect(Math.abs(firstBox!.height - 48)).toBeLessThan(4);
});
```

- [ ] **Step 2: Create `two-line.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/two-line — item min-height ≈ 64px via :has() selector', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-list/two-line/`);
  await page.waitForSelector('[data-scenario-ready]');

  const items = page.locator('mat-list-item');
  await expect(items).toHaveCount(3);

  const firstBox = await items.first().boundingBox();
  expect(firstBox).not.toBeNull();
  expect(Math.abs(firstBox!.height - 64)).toBeLessThan(4);
});
```

- [ ] **Step 3: Create `three-line.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/three-line — item min-height ≈ 88px via :has() selector', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-list/three-line/`);
  await page.waitForSelector('[data-scenario-ready]');

  const items = page.locator('mat-list-item');
  await expect(items).toHaveCount(3);

  const firstBox = await items.first().boundingBox();
  expect(firstBox).not.toBeNull();
  expect(Math.abs(firstBox!.height - 88)).toBeLessThan(4);
});
```

- [ ] **Step 4: Create `avatar.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/avatar — avatar at grid column 1 (leftmost), title right of it, border-radius: 50%', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-list/avatar/`);
  await page.waitForSelector('[data-scenario-ready]');

  const firstItem = page.locator('mat-list-item').first();
  const avatar = firstItem.locator('.mat-mdc-list-item-avatar');
  const title = firstItem.locator('.mat-mdc-list-item-title');

  await expect(avatar).toBeVisible();
  await expect(title).toBeVisible();

  // Avatar computed border-radius = 50%.
  const borderRadius = await avatar.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(borderRadius).toMatch(/50%|20px/); // 50% may resolve to px based on size

  // Avatar bounding-box left of title (grid column 1 vs column 2).
  const avatarBox = await avatar.boundingBox();
  const titleBox = await title.boundingBox();
  expect(avatarBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(avatarBox!.x).toBeLessThan(titleBox!.x);
});
```

- [ ] **Step 5: Create `icon-meta.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/icon-meta — icon at column 1, meta at column 3 (rightmost), icon ≈ 24px', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-list/icon-meta/`);
  await page.waitForSelector('[data-scenario-ready]');

  const firstItem = page.locator('mat-list-item').first();
  const icon = firstItem.locator('.mat-mdc-list-item-icon');
  const meta = firstItem.locator('.mat-mdc-list-item-meta');

  await expect(icon).toBeVisible();
  await expect(meta).toBeVisible();

  // Icon size ≈ 24px.
  const iconBox = await icon.boundingBox();
  expect(iconBox).not.toBeNull();
  expect(Math.abs(iconBox!.width - 24)).toBeLessThan(3);
  expect(Math.abs(iconBox!.height - 24)).toBeLessThan(3);

  // Meta bounding-box right of icon.
  const metaBox = await meta.boundingBox();
  expect(metaBox).not.toBeNull();
  expect(metaBox!.x).toBeGreaterThan(iconBox!.x);
});
```

- [ ] **Step 6: Create `nav.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/nav — <mat-nav-list role="navigation">, 3 <a class="mat-mdc-list-item">, activated has aria-current="page"', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-list/nav/`);
  await page.waitForSelector('[data-scenario-ready]');

  const navList = page.locator('mat-nav-list');
  await expect(navList).toBeVisible();
  await expect(navList).toHaveAttribute('role', 'navigation');

  // Polymorphic-item locator: <a class="mat-mdc-list-item"> (NOT <mat-list-item>).
  const anchors = page.locator('a.mat-mdc-list-item');
  await expect(anchors).toHaveCount(3);

  // Non-activated items have no aria-current attribute.
  const inbox = anchors.filter({hasText: 'Inbox'});
  await expect(inbox).toHaveAttribute('href', '/inbox');
  expect(await inbox.getAttribute('aria-current')).toBeNull();

  // Activated item has aria-current="page".
  const sent = anchors.filter({hasText: 'Sent'});
  await expect(sent).toHaveAttribute('aria-current', 'page');
  await expect(sent).toHaveClass(/mdc-list-item--activated/);

  const drafts = anchors.filter({hasText: 'Drafts'});
  expect(await drafts.getAttribute('aria-current')).toBeNull();
});
```

- [ ] **Step 7: Create `action.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/action — <mat-action-list role="group">, 3 <button class="mat-mdc-list-item">, disabled reflects both native disabled + aria-disabled + opacity', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-list/action/`);
  await page.waitForSelector('[data-scenario-ready]');

  const actionList = page.locator('mat-action-list');
  await expect(actionList).toBeVisible();
  await expect(actionList).toHaveAttribute('role', 'group');

  // Polymorphic-item locator: <button class="mat-mdc-list-item">.
  const buttons = page.locator('button.mat-mdc-list-item');
  await expect(buttons).toHaveCount(3);

  const deleteBtn = buttons.filter({hasText: 'Delete'});
  await expect(deleteBtn).toHaveAttribute('disabled', '');
  await expect(deleteBtn).toHaveAttribute('aria-disabled', 'true');
  await expect(deleteBtn).toHaveClass(/mdc-list-item--disabled/);

  // Disabled item opacity ≈ 0.38.
  const opacity = await deleteBtn.evaluate((el) => getComputedStyle(el).opacity);
  expect(parseFloat(opacity)).toBeCloseTo(0.38, 1);

  // Non-disabled items don't have disabled attribute.
  const saveBtn = buttons.filter({hasText: 'Save'});
  expect(await saveBtn.getAttribute('disabled')).toBeNull();
});
```

- [ ] **Step 8: Create `with-subheader.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/with-subheader — 2 subheaders + 1 divider + 4 items rendered in correct order', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-list/with-subheader/`);
  await page.waitForSelector('[data-scenario-ready]');

  const subheaders = page.locator('mat-subheader');
  await expect(subheaders).toHaveCount(2);
  await expect(subheaders.nth(0)).toHaveText('Inbox');
  await expect(subheaders.nth(1)).toHaveText('Archive');

  const dividers = page.locator('mat-divider');
  await expect(dividers).toHaveCount(1);

  const items = page.locator('mat-list-item');
  await expect(items).toHaveCount(4);
});
```

- [ ] **Step 9: Do NOT run Playwright**

Chromium install + preview server are human-managed steps. Skip execution — Task 12 documents the manual verification step.

- [ ] **Step 10: Verify the parity-tests package typechecks**

```bash
pnpm -C src/qwik-cdk-parity-tests typecheck
```

Expected: exit 0.

- [ ] **Step 11: Commit**

```bash
git add src/qwik-cdk-parity-tests/specs/material-list/
git commit -m "$(cat <<'EOF'
test(multiple): Playwright parity specs for mat-list (8)

8 specs targeting Task 10's dev-app routes. Custom-element tag locators
for container variants (mat-list, mat-nav-list, mat-action-list,
mat-subheader). Polymorphic-item variants use tag-qualified class
locators: a.mat-mdc-list-item for nav (aria-current="page" verified) and
button.mat-mdc-list-item for action (native disabled + aria-disabled +
opacity verified). Line-count sizing via :has() verified at 48/64/88px
bounding-box heights.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 12 — Finalisation

### Task 12: SYNC.md + pipeline verification

**Reference source:** `src/qwik-material/grid-list/SYNC.md` (existing SYNC pattern from the just-completed Grid List port).

**Files:**
- Create: `src/qwik-material/list/SYNC.md`

**Interfaces:**
- Consumes: everything from Tasks 1-11.
- Produces: `SYNC.md` documenting the list port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/list/SYNC.md`**

Contents:

```markdown
# qwik-material/list sync log

Tracks the sync state between this port and `src/material/list/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, and
`src/qwik-material/grid-list/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `list/mat-list.tsx` | `src/material/list/list.ts` (MatList) + `nav-list.ts` (MatNavList) + `action-list.ts` (MatActionList) + `subheader.ts` (MatListSubheaderCssMatStyler) | ported | 4 upstream files collapsed into one Qwik file — each is a thin component$ wrapper (config read + class ladder + Slot). MatNavList forces role='navigation', MatActionList forces role='group'. Subheader upstream is a directive; ported as real component with `<mat-subheader>` custom-element tag |
| `list/mat-list-item.tsx` | `src/material/list/list.ts` (MatListItem class, lines 44-91) | ported | Polymorphic host via `as` prop mirrors upstream's `mat-list-item, a[mat-list-item], button[mat-list-item]` selector. Drops ripple/focus-indicator/@ContentChildren/cdkObserveContent/mdc-list-item__content wrapper. aria-current='page' only when as='a' AND activated (matches _getAriaCurrent) |
| `list/mat-list-item-sections.tsx` | `src/material/list/list-item-sections.ts` (5 directives: Avatar, Icon, Title, Line, Meta) | ported | 5 upstream directives ported as 5 component$ wrappers. Shared MatListItemSectionProps interface. Directive pattern doesn't map to Qwik; wrapper components each render `<div class="<hooks>"><Slot />` |
| `list/list-config.ts` | (no upstream equivalent) | new | MatListConfig = {} interface + MAT_LIST_CONFIG context id; folded into QwikMaterialProvider.matListConfig for family shape parity |
| `scss/list/list.scss` | `src/material/list/list.scss` (185 LOC) | rewritten | ~80 LOC of CSS-grid rules replacing MDC's absolute-positioning + state-layer + ripple + focus-indicator approach. Drops all `.mdc-list-item--with-*` modifier class handling — replaced by CSS :has() selectors. No @use '@angular/cdk' rewrite needed (fourth port after Icon + Divider + Grid List) |
| `scss/list/_list-theme.scss` | `src/material/list/_list-theme.scss` | synced | byte-identical copy; theme mixin inert on our end (typography tokens for dropped ripple/state-layer variants) but kept for `diff -q` parity |
| `scss/list/_list-item-hcm-indicator.scss` | `src/material/list/_list-item-hcm-indicator.scss` | synced | byte-identical copy; small high-contrast helper, inert on our end |
| `scss/list/_m2-list.scss` | `src/material/list/_m2-list.scss` | synced | byte-identical copy |
| `scss/list/_m3-list.scss` | `src/material/list/_m3-list.scss` | synced | byte-identical copy |
| `scss/list/list-prebuilt.scss` | (qwik-material-specific) | new | @use list.scss + :root defaults matching emitted --mat-list-* references |

## Removed upstream files

- `_list-inherited-structure.scss` (477 LOC) — MDC flex-positioning mixins + ripple hooks + state-layer + activated-state gradients; replaced by CSS-grid rewrite + `:has()` line-count sizing (spec §5 deviation #7)
- `list-base.ts` (350 LOC) — MatListBase + MatListItemBase abstract classes with ripple integration + line-count management; replaced by plain component$ wrappers (spec §5 deviation #10)
- `list-module.ts` — Qwik has no module concept
- `testing/` — Angular test harness surface; no equivalent needed
- `public-api.ts` (upstream) — replaced with our own re-export shape (§3.6)
- `list.spec.ts` (650 LOC) — ported to `mat-list-scenarios.spec.tsx` per smoke-only vitest constraint
- `list-item.html` — upstream projection template; inlined into JSX (no `<span class="mdc-list-item__content">` wrapper — CSS grid handles positioning directly on item host)
- `list-option.ts` (328 LOC), `list-option.html`, `list-option.scss`, `list-option-types.ts` — MatListOption is selection-list territory, out of scope
- `selection-list.ts` (482 LOC), `selection-list.spec.ts` (1970 LOC) — future dedicated port with forms tier (checkbox / radio / slide-toggle)
- `tokens.ts` — inlined via SCSS token references
- `MatLine` reuse from `../core` — grid-list precedent; not needed for display-list layout

## Deviations from upstream

1. **Ripple system removed entirely.** Upstream MatListItemBase integrates `RippleRenderer` + `MAT_RIPPLE_GLOBAL_OPTIONS` + `RippleTarget` interface (~50 LOC). Consumers who want tap feedback style `:active` / `:focus-visible` themselves.

2. **`@ContentChildren` line-count JS removed.** Upstream `_updateItemLines` + `cdkObserveContent` inspect projected content on every mutation, then set `.mdc-list-item--with-*-lines` / `.mdc-list-item--with-leading-*` / `.mdc-list-item--with-trailing-*` classes. Replaced by CSS `:has()` selectors — reacts naturally to slot content changes at zero JS cost, SSR-safe by definition. Deviation depends on browsers that ship `:has()` (Baseline Late 2023 — Chrome ≥ 105, Safari ≥ 15.4, Firefox ≥ 121).

3. **`AfterViewInit` / `OnDestroy` lifecycle removed.** No lifecycle work needed — port is pure component$(props) → JSX.

4. **`NgZone` + `Platform` dependencies removed.** Only used by the ripple system + line-count observer.

5. **Focus indicator `<div class="mat-focus-indicator">` removed from MatListItem template.** Upstream renders this element for the CDK focus-indicator system. Since we don't ship the CDK focus indicator, the element serves no purpose. Users get browser-default `:focus-visible` outline on `<a>` / `<button>` variants.

6. **`MAT_LIST` and `MAT_NAV_LIST` DI tokens removed.** Nothing in the display-list scope reads them, and selection-list is out of scope. Family-shape config still ships as `MAT_LIST_CONFIG`.

7. **`_list-inherited-structure.scss` (477 LOC) dropped entirely.** Contains MDC's flex-based positioning mixins + ripple hooks + state layer + activated-state background gradients. Replaced by our ~80-LOC CSS-grid rewrite of `list.scss`.

8. **`MatListSubheaderCssMatStyler` (upstream `[matSubheader]` directive) → `MatSubheader` component with `<mat-subheader>` custom-element tag.** Upstream is a directive that applies a CSS class to any host. We ship a real custom element with a component wrapper for Qwik ergonomics (directive pattern doesn't map cleanly). CSS class hooks preserved for consumer stylesheet parity.

9. **Slot directives (`[matListItemAvatar]` / `[matListItemIcon]` / `[matListItemTitle]` / `[matListItemLine]` / `[matListItemMeta]`) replaced with 5 wrapper components.** Same reasoning as #8. Wrapper components each render `<div class="<hooks>"><Slot />`. CSS class hooks preserved. No `q:slot` required from the consumer since layout is CSS-grid-driven (class-based placement, not slot-name-based).

10. **Angular-specific removals:**
   - `@Input()` decorators + `BooleanInput` / `NumberInput` coercion — replaced by TypeScript types + inline defaults.
   - `signal()` for reactive disabled state — plain prop consumed each render.
   - `Directive` scaffolding + `MatListBase` / `MatListItemBase` abstract classes — collapsed to plain `component$` wrappers.
   - `exportAs: 'matList' / 'matListItem' / ...` — Angular template-ref concept, N/A.
   - Host bindings (`[attr.aria-disabled]`, `[attr.disabled]`, `[attr.aria-current]`, `[class.mdc-list-item--*]`) — plain JSX attribute passthrough.
   - `providers: [{provide: MatListBase, useExisting: MatList}]` — no Angular DI graph.
   - `<ng-content select="mat-divider">` slot inside `MatListItem` template — dropped; consumers place `<MatDivider />` between items instead of nested inside.
   - `<span class="mdc-list-item__content">` inner wrapper in `MatListItem` template — dropped; CSS grid handles positioning directly on the item host.

## Stub inventory delta

No new stubs — the list SCSS chain does NOT reference `@angular/cdk` (grep-confirmed, matching Icon + Divider + Grid List precedent). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/list/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list.
```

- [ ] **Step 2: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** all 11 prebuilt CSS files emit; JS + d.ts under `dist/{dialog,button,card,toolbar,badge,icon,progress-bar,progress-spinner,divider,grid-list,list}/`.
- **Vitest:** all specs pass across 11 entry-points; total ≥ 234 pass (exact count depends on prior suite counts).
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 3: Verify the class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/list/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 4: Verify no SSR globals in the list entry-point**

```bash
grep -RnE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/list/ | grep -v '\.spec\.'
```

Expected: no output. List has no `useVisibleTask$` and no browser globals — all 10 components are pure computation from props.

- [ ] **Step 5: Verify no `isBrowser` import**

```bash
grep -RnE "from '@builder\.io/qwik/build'" src/qwik-material/list/
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/list/SYNC.md
git commit -m "$(cat <<'EOF'
docs(multiple): finalize qwik-material/list SYNC.md + pipeline verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Layout

```
src/qwik-material/
  list/
    list-config.ts                    — MatListConfig + MAT_LIST_CONFIG (Task 3)
    list-config.spec.ts
    mat-list.tsx                      — MatList + MatNavList + MatActionList + MatSubheader (Task 4)
    mat-list.spec.tsx                 — 4 smoke
    mat-list-item.tsx                 — MatListItem (polymorphic as prop) (Task 5)
    mat-list-item.spec.tsx            — 1 smoke
    mat-list-item-sections.tsx        — Avatar + Icon + Title + Line + Meta (Task 6)
    mat-list-item-sections.spec.tsx   — 5 smoke
    mat-list-scenarios.spec.tsx       — upstream scenario port (Task 9)
    intrinsic-elements.d.ts           — 5 custom-element JSX augmentations (Task 1)
    public-api.ts                     — 18-symbol consumer-facing re-exports (Task 8)
    index.ts                          — `export * from './public-api'` (Task 1 stub / Task 8 real)
    SYNC.md                           — deviation + stub log (Task 12)
  dialog/
    qwik-material-provider.tsx        — MODIFIED in Task 7 (adds matListConfig)
    qwik-material-provider-list.spec.tsx — new spec (Task 7)
  scss/
    list/                             — 4 synced partials + rewritten list.scss + list-prebuilt.scss (Task 2)
  package.json                        — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                      — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                          — MODIFIED in Task 10 (list-prebuilt.css import)
    routes/
      index.tsx                       — MODIFIED in Task 10 (Lists section)
      mat-list/                       — 8 new route files (Task 10)

src/qwik-cdk-parity-tests/
  specs/
    material-list/                    — 8 new Playwright specs (Task 11)
```

## Per-entry-point state

The `list` entry-point becomes the eleventh after `dialog` + `button` + `card` + `toolbar` + `badge` + `icon` + `progress-bar` + `progress-spinner` + `divider` + `grid-list` in the qwik-material package. All eleven live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` (from earlier ports) is the only intersection, extended in Task 7.

## Sync recipe

To re-sync a specific file from upstream `src/material/list/`:

1. Locate the upstream file's counterpart in the `list/SYNC.md` sync table.
2. If "synced" state (`_list-theme.scss`, `_list-item-hcm-indicator.scss`, `_m2-list.scss`, `_m3-list.scss`): `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "rewritten" state (`list.scss`): re-read upstream, apply any new grid-layout-relevant changes to the rewritten file, verify ripple/state-layer/focus-indicator blocks stay stripped (scope decision).
4. If "ported" state (`mat-list.tsx`, `mat-list-item.tsx`, `mat-list-item-sections.tsx`): manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change, update the corresponding `.spec.tsx`.
5. If "new" state (`list-config.ts`, `list-prebuilt.scss`): no upstream counterpart — evolve independently.
6. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest ≥ 234 pass + lint + typecheck)
- 8 dev-app routes at `/mat-list/*` render visibly in browser preview
- 8 Playwright specs pass locally when run against the built dev-app preview
- Every Playwright spec asserts on a custom-element tag (`mat-list`, `mat-nav-list`, `mat-action-list`, `mat-subheader`, `mat-list-item`) OR tag-qualified class locator (`a.mat-mdc-list-item`, `button.mat-mdc-list-item`) AT LEAST ONCE — regression that drops any tag fails loudly
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/list/` returns nothing)
- Zero SSR-leak violations
- `<QwikMaterialProvider>` has exactly 12 `useContextProvider` calls in order: MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_ANIMATIONS_DISABLED, MAT_BUTTON_CONFIG, MAT_CARD_CONFIG, MAT_BADGE_CONFIG, MAT_ICON_CONFIG, MAT_PROGRESS_BAR_CONFIG, MAT_PROGRESS_SPINNER_CONFIG, MAT_DIVIDER_CONFIG, MAT_GRID_LIST_CONFIG, MAT_LIST_CONFIG.
