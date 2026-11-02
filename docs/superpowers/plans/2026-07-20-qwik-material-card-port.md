# qwik-material Card Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/card/` (14 purely-visual components) into a `qwik-material/card` entry-point that preserves upstream's custom-element tag names AND class names, so external CMS styles targeting `mat-card`, `mat-card-title` etc. continue to work.

**Architecture:** 14 thin `component$` wrappers + 1 config context token. Every component renders its upstream custom-element tag name (via a TypeScript `IntrinsicElements` augmentation) with the exact upstream class list. `MatCardHeader` + `MatCardTitleGroup` use Qwik's `q:slot` named slots for structured projection (upstream uses `<ng-content select>` which Qwik has no equivalent for). Prerequisite: one small commit fixes the existing Dialog port's DOM to also preserve upstream tag names, so both ports satisfy the CMS constraint from the same base.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package created by the Dialog + Button ports.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./card`. New prebuilt CSS entry: `./card-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths in this plan are relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-07-20-qwik-material-card-port-design.md](../specs/2026-07-20-qwik-material-card-port-design.md). Read §2 (Public API), §3 (Internal architecture), §6 (CSS delivery), §8 (Deviations catalog) before starting any port task.
- **Material source reference:** `src/material/card/`. Every port task names the exact source file(s) it mirrors.
- **DOM parity requirement:** every card component MUST render its upstream custom-element tag name (e.g. `<mat-card>`, `<mat-card-title>`), NOT `<div>`. This is the CMS constraint that drove the whole port design. Any diff that emits `<div>` for a custom-tag component fails review.
- **qwik-cdk peer:** `@angular-community/qwik-cdk` at `workspace:*` (already declared). Card doesn't consume qwik-cdk at runtime.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. E.g. `card.ts` → `mat-card.tsx`. Component files use `.tsx`. Templates (`*.html`) collapse into their `.tsx` JSX with a `<basename>.html.removed.md` breadcrumb.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/card/SYNC.md`.
- **No RxJS.**
- **No exported classes** in the consumer surface. `card/public-api.ts` must not contain `export class` — only `export interface`, `export type`, `export const *_CONTEXT`, `export const Mat*Card*` (component references), and `export * from` re-exports.
- **SSR safety:** every `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` call must be inside `useVisibleTask$` OR guarded by `typeof <global> !== 'undefined'`. **Do NOT use `isBrowser` from `@builder.io/qwik/build`** as an SSR guard — the qwikVite CSR-optimizer inlines it to `true` and DCE strips the guard. Card has no runtime browser-global access; the guard rule still applies to any future edits.
- **Commit message scope:** the upstream repo's commit-msg hook does not know `qwik-material`; use scope `multiple` (which is in the allowed list) for every commit in this plan (including Task 0's Dialog prereq fix).
- **Pnpm version:** the repo pins `pnpm@11.7.0`. Don't change it.
- **Node version:** the repo pins via `.nvmrc`. Don't change it.
- **No Bazel changes.** qwik-material lives outside the Bazel graph.
- **No upstream CI integration.** The plan stops at "qwik-material/card works locally".
- **Commit style:** every task ends with a commit named after the deliverable. Small mechanical tasks may squash the "write failing test / verify fails / implement / verify passes" cycle into two commits; larger tasks use TDD strictly.
- **Spec-tests use smoke variant.** Dialog + Button ports both verified that `createDOM(<component$/>)` hangs the Qwik optimizer worker (JSDOM `node.isAncestor` bug + optimizer interaction). Card `.spec.tsx` files use module-import assertions (`expect(Component).toBeDefined()` + `typeof === 'function'`) not `createDOM` renders. Real DOM assertions live in Task 14's Playwright parity specs.

---

## Task 0 — Prerequisite: Dialog DOM parity fix

**Blocks Task 1.** Consumer has an external CMS that provides styles targeting `mat-dialog-container`, `mat-dialog-title`, `mat-dialog-content`, `mat-dialog-actions` tag names (not just classes). The existing dialog port renders `<div>` / `<h2>` for these — CSS parity is broken today.

Lands as one small commit before Card Task 1 starts. Does not create new components; only swaps host tag names in existing files + adds a TypeScript augmentation + updates existing Playwright specs to assert on tag names.

**Reference source (Angular selector inventory — confirmed via `grep "selector:" src/material/dialog/dialog-content-directives.ts` and `src/material/dialog/dialog-container.ts`):**
- `mat-dialog-container` — component selector (custom-element tag)
- `[mat-dialog-title], [matDialogTitle]` — attribute directive (applied to `<h2>` typically)
- `[mat-dialog-content], mat-dialog-content, [matDialogContent]` — attribute OR custom-element
- `[mat-dialog-actions], mat-dialog-actions, [matDialogActions]` — attribute OR custom-element
- `[mat-dialog-close], [matDialogClose]` — attribute directive (applied to `<button>`)

**Files:**
- Create: `src/qwik-material/dialog/intrinsic-elements.d.ts` (new)
- Modify: `src/qwik-material/dialog/mat-dialog-container.tsx` (host tag)
- Modify: `src/qwik-material/dialog/mat-dialog-title.tsx` (add attribute)
- Modify: `src/qwik-material/dialog/mat-dialog-content.tsx` (host tag)
- Modify: `src/qwik-material/dialog/mat-dialog-actions.tsx` (host tag)
- Modify: `src/qwik-material/dialog/mat-dialog-close.tsx` (add attribute)
- Modify: `src/qwik-cdk-parity-tests/specs/material-dialog/*.spec.ts` (add tag-name assertions)

**Interfaces:**
- Consumes: existing dialog port.
- Produces: dialog DOM matches upstream tag names. Card tasks build on the fixed base.

- [ ] **Step 1: Create `src/qwik-material/dialog/intrinsic-elements.d.ts`**

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Dialog's custom-element tag
 * names. Upstream renders <mat-dialog-container>, <mat-dialog-content>,
 * <mat-dialog-actions> as actual custom elements; external CMS styles may
 * target these tag names directly (not just their .mat-mdc-dialog-* classes).
 * See docs/superpowers/specs/2026-07-20-qwik-material-card-port-design.md §0.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-dialog-container': QwikIntrinsicElements['div'];
      'mat-dialog-content': QwikIntrinsicElements['div'];
      'mat-dialog-actions': QwikIntrinsicElements['div'];
    }
  }
}
```

- [ ] **Step 2: Change host tag in `mat-dialog-container.tsx`**

Read the current file. Locate the top-level JSX return. Change the outer element from `<div ...>...</div>` to `<mat-dialog-container ...>...</mat-dialog-container>`. Preserve every attribute (id, class, role, aria-*, tabIndex, onKeyDown$, etc.) verbatim; only the tag name changes.

- [ ] **Step 3: Add `mat-dialog-title` attribute in `mat-dialog-title.tsx`**

Read the current file. The component renders `<h2 class="mat-mdc-dialog-title mdc-dialog__title" ...>`. Add the `mat-dialog-title` attribute (empty value):

```tsx
<h2 mat-dialog-title id={...} class={[...]}>
  <Slot />
</h2>
```

This matches upstream's `<h2 mat-dialog-title>` rendered when consumers use the directive form on their own `<h2>`. Keeps CSS parity for `h2[mat-dialog-title] { ... }` selectors.

**Do NOT** switch to `<mat-dialog-title>` as the tag — MatDialogTitle is a directive in upstream (not a component with a custom-element selector); consumers place it on their own element, most commonly `<h2>`. Preserving `<h2>` retains semantic structure and matches the most common upstream usage.

- [ ] **Step 4: Change host tag in `mat-dialog-content.tsx`**

Read the current file. Change the outer element from `<div class="mat-mdc-dialog-content mdc-dialog__content">` to `<mat-dialog-content class="mat-mdc-dialog-content mdc-dialog__content">`. Preserve every attribute verbatim.

- [ ] **Step 5: Change host tag in `mat-dialog-actions.tsx`**

Read the current file. Change the outer element from `<div class="mat-mdc-dialog-actions ...">` to `<mat-dialog-actions class="mat-mdc-dialog-actions ...">`. Preserve every attribute (align class binding etc.) verbatim.

- [ ] **Step 6: Add `mat-dialog-close` attribute in `mat-dialog-close.tsx`**

Read the current file. The component renders `<button type="button" class="mat-mdc-dialog-close" ...>`. Add the `mat-dialog-close` attribute (empty value):

```tsx
<button mat-dialog-close type="button" class="mat-mdc-dialog-close" ...>
  <Slot />
</button>
```

Preserves CSS parity for `button[mat-dialog-close] { ... }` selectors.

- [ ] **Step 7: Update existing dialog Playwright specs to assert on tag names**

Read `src/qwik-cdk-parity-tests/specs/material-dialog/basic.spec.ts`. Replace or supplement class-based locators with tag-name locators. Example diff intent:

```ts
// Before:
const container = page.locator('div.mat-mdc-dialog-container');

// After:
const container = page.locator('mat-dialog-container.mat-mdc-dialog-container');
```

Repeat the same pattern in every dialog spec that queries the dialog container, content, or actions (`aria.spec.ts`, `backdrop-and-escape.spec.ts`, `animation.spec.ts`, `restore-focus.spec.ts`, `close-with-result.spec.ts`). Do NOT rewrite the specs from scratch; just tighten the container selector to include the tag name.

For `mat-dialog-title` + `mat-dialog-close`, use attribute selectors:

```ts
const title = page.locator('h2[mat-dialog-title]');
const closeBtn = page.locator('button[mat-dialog-close]');
```

Add one new dedicated tag-name assertion per spec so a regression to `<div>` fails loudly.

- [ ] **Step 8: Rebuild + run pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green (build, vitest, lint, typecheck). Vitest count unchanged from before Task 0 (no new tests added).

- [ ] **Step 9: Manual verification via preview**

```bash
pnpm -C src/qwik-cdk-dev-app build
pnpm -C src/qwik-cdk-dev-app preview
```

Visit a dialog route (e.g. `/mat-dialog/basic/`). Open browser devtools; inspect the emitted DOM. Confirm the container is `<mat-dialog-container class="mat-mdc-dialog-container ...">` (not `<div>`). Confirm the title is `<h2 mat-dialog-title class="mat-mdc-dialog-title">`. Kill the preview server after inspection.

- [ ] **Step 10: Commit**

```bash
git add \
  src/qwik-material/dialog/intrinsic-elements.d.ts \
  src/qwik-material/dialog/mat-dialog-container.tsx \
  src/qwik-material/dialog/mat-dialog-title.tsx \
  src/qwik-material/dialog/mat-dialog-content.tsx \
  src/qwik-material/dialog/mat-dialog-actions.tsx \
  src/qwik-material/dialog/mat-dialog-close.tsx \
  src/qwik-cdk-parity-tests/specs/material-dialog/
git commit -m "fix(multiple): render Material Dialog custom-element tag names for CSS parity"
```

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `card` entry-point into the existing qwik-material package + intrinsic-elements typing

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from Dialog + Button ports).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/card/index.ts` (empty stub — Task 8 replaces it)
- Create: `src/qwik-material/card/intrinsic-elements.d.ts`

**Interfaces:**
- Consumes: existing package scaffolding.
- Produces: `pnpm -C src/qwik-material build` still succeeds (dialog + button CSS still emit, no card CSS yet). Type resolution for `@angular-community/qwik-material/card` returns an empty module. All 8 card custom-element tag names are valid in TSX from any consumer file.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./card` after `./button`, and `./card-prebuilt.css` after `./button-prebuilt.css`. Final layout:

```json
"exports": {
  ".": {
    "qwik": "./index.ts",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./dialog": {
    "qwik": "./dialog/index.ts",
    "types": "./dist/dialog/index.d.ts",
    "import": "./dist/dialog/index.js"
  },
  "./button": {
    "qwik": "./button/index.ts",
    "types": "./dist/button/index.d.ts",
    "import": "./dist/button/index.js"
  },
  "./card": {
    "qwik": "./card/index.ts",
    "types": "./dist/card/index.d.ts",
    "import": "./dist/card/index.js"
  },
  "./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
  "./button-prebuilt.css": "./dist/button-prebuilt.css",
  "./card-prebuilt.css": "./dist/card-prebuilt.css",
  "./scss/*": "./scss/*"
}
```

- [ ] **Step 2: Extend the vite `entries` + `sassEntries` in `src/qwik-material/vite.config.ts`**

Change the `entries` constant from `['dialog', 'button']` to `['dialog', 'button', 'card']`. Change the `sassEntries` array in the `qwik-material-compile-sass-prebuilt` plugin's `closeBundle` to append the card prebuilt path (the SCSS file itself does not exist yet — Task 2 lands it; the ENOENT-tolerant guard added during Task 1 of the button port already swallows the missing-file case with a warning).

Final `entries` line:

```ts
const entries = ['dialog', 'button', 'card'];
```

Final `sassEntries` array:

```ts
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
  ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
];
```

- [ ] **Step 3: Create `src/qwik-material/card/index.ts`**

```ts
export {};
```

Empty stub. Task 8 replaces it with `export * from './public-api';`.

- [ ] **Step 4: Create `src/qwik-material/card/intrinsic-elements.d.ts`**

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Card's custom-element tag
 * names. Upstream renders <mat-card>, <mat-card-header>, <mat-card-title>,
 * etc. as actual custom elements; external CMS styles may target these tag
 * names directly (not just their .mat-mdc-card-* classes). See design spec
 * docs/superpowers/specs/2026-07-20-qwik-material-card-port-design.md §3.1.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-card': QwikIntrinsicElements['div'];
      'mat-card-header': QwikIntrinsicElements['div'];
      'mat-card-title-group': QwikIntrinsicElements['div'];
      'mat-card-title': QwikIntrinsicElements['div'];
      'mat-card-subtitle': QwikIntrinsicElements['div'];
      'mat-card-content': QwikIntrinsicElements['div'];
      'mat-card-actions': QwikIntrinsicElements['div'];
      'mat-card-footer': QwikIntrinsicElements['div'];
    }
  }
}
```

- [ ] **Step 5: Verify the build still succeeds**

```bash
pnpm -C src/qwik-material build
```

Expected:
- `dist/dialog-prebuilt.css` still emits.
- `dist/button-prebuilt.css` still emits.
- Console shows `[qwik-material] skipping scss/card/card-prebuilt.scss — not yet present.` (the ENOENT-tolerant plugin swallows the missing SCSS file).
- Exit code 0.
- `ls dist/card/` shows one entry: `index.d.ts` (empty module marker from the dts plugin).

- [ ] **Step 6: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/card/index.ts \
  src/qwik-material/card/intrinsic-elements.d.ts
git commit -m "build(multiple): wire qwik-material/card entry-point into package + vite"
```

---

## Phase 2 — SCSS chain + prebuilt CSS

### Task 2: Copy Card SCSS + stub loop + prebuilt CSS with M3 defaults

**Reference source:** `src/material/card/card.scss`, `src/material/card/_card-theme.scss`, `src/material/card/_m2-card.scss`, `src/material/card/_m3-card.scss`.

**Files:**
- Create: `src/qwik-material/scss/card/card.scss` (verbatim copy)
- Create: `src/qwik-material/scss/card/_card-theme.scss` (verbatim copy)
- Create: `src/qwik-material/scss/card/_m2-card.scss` (verbatim copy)
- Create: `src/qwik-material/scss/card/_m3-card.scss` (verbatim copy)
- Create: `src/qwik-material/scss/card/card-prebuilt.scss` (new entry — `@use ./card` + M3 :root defaults)
- Create (as needed): any additional stubs under `src/qwik-material/scss/` for `@use` paths outside `card/`. Most stubs likely exist from Dialog + Button ports; iterative loop identifies any gaps.

**Interfaces:**
- Consumes: Task 1's vite plumbing (`sassEntries` includes `scss/card/card-prebuilt.scss`).
- Produces: `dist/card-prebuilt.css` emitted after `pnpm build`. The CSS contains Material Card's structural + theme layers + M3 default `:root` values.

**Approach:** Copy the 4 source SCSS files verbatim. Enumerate any `@use` paths pointing outside the card folder. For each missing upstream path, either reuse an existing stub under `src/qwik-material/scss/core/**` (created by dialog + button ports) or create a new stub. Each new stub starts with a `// STUB — see SYNC.md` header.

- [ ] **Step 1: Copy the 4 SCSS files verbatim**

```bash
mkdir -p src/qwik-material/scss/card
cp src/material/card/card.scss           src/qwik-material/scss/card/card.scss
cp src/material/card/_card-theme.scss    src/qwik-material/scss/card/_card-theme.scss
cp src/material/card/_m2-card.scss       src/qwik-material/scss/card/_m2-card.scss
cp src/material/card/_m3-card.scss       src/qwik-material/scss/card/_m3-card.scss
```

- [ ] **Step 2: Enumerate `@use` paths that need stubs**

Run:

```bash
grep -h "^@use" src/qwik-material/scss/card/*.scss | sort -u
```

For each `@use` path that starts with `../` or references an Angular Material internal (e.g. `../core/tokens/m2-utils`, `../core/style/private`), record the path. Compare against existing stubs under `src/qwik-material/scss/core/**` (created by Dialog Task 3 and Button Task 2). Note new paths that need fresh stubs.

- [ ] **Step 3: Create stubs for any missing `@use` paths (iterative)**

For each unresolved path not already covered by an existing stub, create a stub file at the matching relative path under `src/qwik-material/scss/`. Stub content = minimum function/mixin/variable definitions needed to satisfy the compile. Header:

```scss
// STUB: this file is a compile-time stand-in for @angular/material/<path>.
// See src/qwik-material/dialog/SYNC.md for the stubbing rationale.
// (Card-specific additions are logged in src/qwik-material/card/SYNC.md — Task 15.)
```

Iterative loop:
1. Run `pnpm -C src/qwik-material build`.
2. Read the first Sass error at the top of the output.
3. Either add the missing symbol to an existing stub OR create a new stub file.
4. Repeat until the build succeeds.

Cap at ~10 iterations before flagging BLOCKED. Prefer permissive definitions (mixin emits nothing, function returns `null` or a sensible neutral value) over reproducing real Material Design DSL logic.

- [ ] **Step 4: Create `src/qwik-material/scss/card/card-prebuilt.scss`**

```scss
// Prebuilt Material Card CSS entry.
//
// Emits: structural styles from card.scss + a minimal set of M3 default
// values for the `--mdc-*` and `--mat-card-*` custom properties the
// structural rules reference. Consumers import via
// `@angular-community/qwik-material/card-prebuilt.css`.
// For full custom theming, consumers should instead @use the *-theme mixins
// from `@angular-community/qwik-material/scss/card/_card-theme.scss` once
// the qwik-material/core theming DSL lands.

@use './card';

// Minimal Material Design 3 defaults so a bare consumer sees a themed card.
// Values sourced from @angular/material/card M3 tokens. Every value can be
// overridden by the consumer at :root or on any ancestor of the card.
:root {
  // Raised (elevated) — the default appearance
  --mdc-elevated-card-container-color: var(--mat-sys-surface, #fef7ff);
  --mdc-elevated-card-container-shape: 12px;
  --mdc-elevated-card-container-elevation-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 1px 3px 1px rgba(0, 0, 0, 0.15);

  // Outlined
  --mdc-outlined-card-container-color: var(--mat-sys-surface, #fef7ff);
  --mdc-outlined-card-container-shape: 12px;
  --mdc-outlined-card-outline-color: var(--mat-sys-outline, rgba(0, 0, 0, 0.12));
  --mdc-outlined-card-outline-width: 1px;

  // Filled (Mat-specific)
  --mat-card-filled-container-color: color-mix(
    in srgb,
    var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87)) 5%,
    transparent
  );
  --mat-card-filled-container-shape: 12px;

  // Typography for title / subtitle
  --mat-card-title-text-color: var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87));
  --mat-card-title-text-font: Roboto, "Helvetica Neue", sans-serif;
  --mat-card-title-text-size: 1rem;
  --mat-card-title-text-weight: 500;
  --mat-card-subtitle-text-color: var(--mat-sys-on-surface-variant, rgba(0, 0, 0, 0.6));
  --mat-card-subtitle-text-font: Roboto, "Helvetica Neue", sans-serif;
  --mat-card-subtitle-text-size: 0.875rem;
  --mat-card-subtitle-text-weight: 400;
}
```

- [ ] **Step 5: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected:
- `dist/card-prebuilt.css` exists and is non-empty.
- Console shows `✓ built in …ms` with no Sass errors.

- [ ] **Step 6: Sanity-check the emitted CSS**

```bash
grep -c "mat-mdc-card\|mdc-card" src/qwik-material/dist/card-prebuilt.css
```

Expected: a number > 20 (indicates the card structural rules made it through).

Also confirm the M3 defaults landed:

```bash
grep -c "mdc-elevated-card-container-color: var(--mat-sys-surface" src/qwik-material/dist/card-prebuilt.css
```

Expected: `1`.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-material/scss/card/ src/qwik-material/scss/  # includes any new stubs
git commit -m "feat(multiple): copy Material Card SCSS + prebuilt CSS entry with M3 defaults"
```

---

## Phase 3 — Foundation types

### Task 3: `MatCardAppearance` type

**Reference source:** `src/material/card/card.ts` line 18 (MatCardAppearance type).

**Files:**
- Create: `src/qwik-material/card/card-appearance.ts`
- Create: `src/qwik-material/card/card-appearance.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MatCardAppearance` type. Consumed by `card-config.ts` (Task 4), `mat-card.tsx` (Task 9), scenario spec (Task 12).

- [ ] **Step 1: Write `card-appearance.ts`**

```ts
/**
 * Visual appearance of a <MatCard>.
 * See https://m3.material.io/components/cards/overview.
 */
export type MatCardAppearance = 'raised' | 'outlined' | 'filled';
```

- [ ] **Step 2: Write `card-appearance.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import type {MatCardAppearance} from './card-appearance';

describe('MatCardAppearance', () => {
  it('accepts the three documented literal values', () => {
    const a: MatCardAppearance = 'raised';
    const b: MatCardAppearance = 'outlined';
    const c: MatCardAppearance = 'filled';
    expect([a, b, c]).toEqual(['raised', 'outlined', 'filled']);
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm -C src/qwik-material test card/card-appearance
```

Expected: 1/1 passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/card/card-appearance.ts src/qwik-material/card/card-appearance.spec.ts
git commit -m "feat(multiple): add MatCardAppearance type"
```

---

### Task 4: `MatCardConfig` + `MAT_CARD_CONFIG` context token

**Reference source:** `src/material/card/card.ts` lines 20-27 (MatCardConfig interface + MAT_CARD_CONFIG injection token).

**Files:**
- Create: `src/qwik-material/card/card-config.ts`
- Create: `src/qwik-material/card/card-config.spec.ts`

**Interfaces:**
- Consumes: `MatCardAppearance` from Task 3.
- Produces: `MatCardConfig` interface, `MAT_CARD_CONFIG: ContextId<MatCardConfig>` token. Consumed by Task 9 (MatCard reads `useContext(MAT_CARD_CONFIG, DEFAULTS)`) and Task 10 (QwikMaterialProvider installs the token).

- [ ] **Step 1: Write `card-config.ts`**

```ts
import {createContextId} from '@builder.io/qwik';
import type {MatCardAppearance} from './card-appearance';

/**
 * Object that can be used to configure default options for every MatCard
 * rendered inside a <QwikMaterialProvider matCardConfig={…}> subtree.
 *
 * See design spec §2.1 and §2.3 for full field semantics.
 */
export interface MatCardConfig {
  /** Default appearance for cards. Defaults to 'raised' when unset. */
  appearance?: MatCardAppearance;
}

/**
 * Context token that installs default MatCard options in a subtree.
 * Provided by <QwikMaterialProvider matCardConfig={…}>. Consumed by
 * MatCard via `useContext(MAT_CARD_CONFIG, DEFAULTS)`.
 */
export const MAT_CARD_CONFIG = createContextId<MatCardConfig>(
  'qwik-material/card-config',
);
```

- [ ] **Step 2: Write `card-config.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import {MAT_CARD_CONFIG, type MatCardConfig} from './card-config';

describe('MatCardConfig', () => {
  it('accepts an empty config', () => {
    const c: MatCardConfig = {};
    expect(c).toBeDefined();
  });

  it('accepts every documented field', () => {
    const c: MatCardConfig = {
      appearance: 'outlined',
    };
    expect(c.appearance).toBe('outlined');
  });

  it('MAT_CARD_CONFIG carries the expected context id', () => {
    expect(MAT_CARD_CONFIG.id).toBe('qwik-material/card-config');
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm -C src/qwik-material test card/card-config
```

Expected: 3/3 passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/card/card-config.ts src/qwik-material/card/card-config.spec.ts
git commit -m "feat(multiple): add MatCardConfig interface + MAT_CARD_CONFIG token"
```

---

## Phase 4 — Simple components

### Task 5: `<MatCardTitle>` + `<MatCardSubtitle>` + `<MatCardContent>` + `<MatCardFooter>` + `<MatCardActions>`

**Reference source:** `src/material/card/card.ts` — MatCardTitle (line 67-71), MatCardSubtitle (100-110), MatCardContent (93-97), MatCardFooter (166-170), MatCardActions (119-141).

**Files:**
- Create: `src/qwik-material/card/mat-card-title.tsx`
- Create: `src/qwik-material/card/mat-card-subtitle.tsx`
- Create: `src/qwik-material/card/mat-card-content.tsx`
- Create: `src/qwik-material/card/mat-card-footer.tsx`
- Create: `src/qwik-material/card/mat-card-actions.tsx`
- Create: `src/qwik-material/card/mat-card-title.spec.tsx`
- Create: `src/qwik-material/card/mat-card-subtitle.spec.tsx`
- Create: `src/qwik-material/card/mat-card-content.spec.tsx`
- Create: `src/qwik-material/card/mat-card-footer.spec.tsx`
- Create: `src/qwik-material/card/mat-card-actions.spec.tsx`

**Interfaces:**
- Consumes: `IntrinsicElements` augmentation from Task 1 (all five components render custom tag names).
- Produces: 5 components exported. Consumed by public-api (Task 8), scenario spec (Task 12), dev-app routes (Task 13), Playwright specs (Task 14).

- [ ] **Step 1: Write `mat-card-title.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';

export interface MatCardTitleProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardTitle = component$<MatCardTitleProps>(props => {
  const classes = ['mat-mdc-card-title', props.class].filter(Boolean) as (
    | string
    | ReadonlyArray<string>
  )[];
  return (
    <mat-card-title id={props.id} class={classes}>
      <Slot />
    </mat-card-title>
  );
});
```

- [ ] **Step 2: Write `mat-card-subtitle.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';

export interface MatCardSubtitleProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardSubtitle = component$<MatCardSubtitleProps>(props => {
  const classes = ['mat-mdc-card-subtitle', props.class].filter(Boolean) as (
    | string
    | ReadonlyArray<string>
  )[];
  return (
    <mat-card-subtitle id={props.id} class={classes}>
      <Slot />
    </mat-card-subtitle>
  );
});
```

- [ ] **Step 3: Write `mat-card-content.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';

export interface MatCardContentProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardContent = component$<MatCardContentProps>(props => {
  const classes = ['mat-mdc-card-content', props.class].filter(Boolean) as (
    | string
    | ReadonlyArray<string>
  )[];
  return (
    <mat-card-content id={props.id} class={classes}>
      <Slot />
    </mat-card-content>
  );
});
```

- [ ] **Step 4: Write `mat-card-footer.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';

export interface MatCardFooterProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardFooter = component$<MatCardFooterProps>(props => {
  const classes = ['mat-mdc-card-footer', props.class].filter(Boolean) as (
    | string
    | ReadonlyArray<string>
  )[];
  return (
    <mat-card-footer id={props.id} class={classes}>
      <Slot />
    </mat-card-footer>
  );
});
```

- [ ] **Step 5: Write `mat-card-actions.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';

export interface MatCardActionsProps {
  align?: 'start' | 'end';
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardActions = component$<MatCardActionsProps>(props => {
  const classes = [
    'mat-mdc-card-actions',
    'mdc-card__actions',
    props.align === 'end' && 'mat-mdc-card-actions-align-end',
    props.class,
  ].filter(Boolean) as (string | ReadonlyArray<string>)[];
  return (
    <mat-card-actions id={props.id} class={classes}>
      <Slot />
    </mat-card-actions>
  );
});
```

- [ ] **Step 6: Write smoke spec `mat-card-title.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatCardTitle} from './mat-card-title';

describe('MatCardTitle (module-import smoke)', () => {
  it('MatCardTitle is a Qwik component', () => {
    expect(MatCardTitle).toBeDefined();
    expect(typeof MatCardTitle).toBe('function');
  });
});
```

- [ ] **Step 7: Write smoke spec `mat-card-subtitle.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatCardSubtitle} from './mat-card-subtitle';

describe('MatCardSubtitle (module-import smoke)', () => {
  it('MatCardSubtitle is a Qwik component', () => {
    expect(MatCardSubtitle).toBeDefined();
    expect(typeof MatCardSubtitle).toBe('function');
  });
});
```

- [ ] **Step 8: Write smoke spec `mat-card-content.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatCardContent} from './mat-card-content';

describe('MatCardContent (module-import smoke)', () => {
  it('MatCardContent is a Qwik component', () => {
    expect(MatCardContent).toBeDefined();
    expect(typeof MatCardContent).toBe('function');
  });
});
```

- [ ] **Step 9: Write smoke spec `mat-card-footer.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatCardFooter} from './mat-card-footer';

describe('MatCardFooter (module-import smoke)', () => {
  it('MatCardFooter is a Qwik component', () => {
    expect(MatCardFooter).toBeDefined();
    expect(typeof MatCardFooter).toBe('function');
  });
});
```

- [ ] **Step 10: Write smoke spec `mat-card-actions.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatCardActions} from './mat-card-actions';

describe('MatCardActions (module-import smoke)', () => {
  it('MatCardActions is a Qwik component', () => {
    expect(MatCardActions).toBeDefined();
    expect(typeof MatCardActions).toBe('function');
  });
});
```

- [ ] **Step 11: Run tests**

```bash
pnpm -C src/qwik-material test card
```

Expected: 6 tests passing (this task's 5 smoke tests + Task 4's 3 config tests + Task 3's 1 appearance test = 9 total tests in `card/`). Actually the numbers may differ slightly if you re-run only card tests; the point is zero failures.

- [ ] **Step 12: Run typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. Note: if the typecheck errors on unknown JSX intrinsic elements (`mat-card-title` etc.), the `intrinsic-elements.d.ts` from Task 1 didn't load — verify tsconfig includes cover `src/qwik-material/card/**/*.d.ts`.

- [ ] **Step 13: Commit**

```bash
git add src/qwik-material/card/mat-card-title.tsx src/qwik-material/card/mat-card-title.spec.tsx \
        src/qwik-material/card/mat-card-subtitle.tsx src/qwik-material/card/mat-card-subtitle.spec.tsx \
        src/qwik-material/card/mat-card-content.tsx src/qwik-material/card/mat-card-content.spec.tsx \
        src/qwik-material/card/mat-card-footer.tsx src/qwik-material/card/mat-card-footer.spec.tsx \
        src/qwik-material/card/mat-card-actions.tsx src/qwik-material/card/mat-card-actions.spec.tsx
git commit -m "feat(multiple): add MatCardTitle + Subtitle + Content + Footer + Actions"
```

---

### Task 6: `<MatCardImage>` (+ 4 size variants) + `<MatCardAvatar>`

**Reference source:** `src/material/card/card.ts` — MatCardImage (lines 185-191), MatCardSmImage (194-198), MatCardMdImage (201-205), MatCardLgImage (208-212), MatCardXlImage (215-219), MatCardAvatar (230-234).

**Files:**
- Create: `src/qwik-material/card/mat-card-image.tsx` (5 exports: MatCardImage, MatCardSmImage, MatCardMdImage, MatCardLgImage, MatCardXlImage)
- Create: `src/qwik-material/card/mat-card-avatar.tsx`
- Create: `src/qwik-material/card/mat-card-image.spec.tsx`
- Create: `src/qwik-material/card/mat-card-avatar.spec.tsx`

**Interfaces:**
- Consumes: nothing (all render `<img>` — no custom tag names needed here).
- Produces: 6 components. Consumed by public-api (Task 8), dev-app routes (Task 13), Playwright specs (Task 14).

- [ ] **Step 1: Write `mat-card-image.tsx`**

```tsx
import {component$} from '@builder.io/qwik';

/**
 * Props shared by MatCardImage and its 4 size variants. Upstream applies
 * these as attribute directives to a consumer-supplied <img>; qwik-material
 * renders <img> directly with src/alt so the consumer never touches <img>.
 */
export interface MatCardImageProps {
  src: string;
  alt?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={
      ['mat-mdc-card-image', 'mdc-card__media', props.class].filter(Boolean) as (
        | string
        | ReadonlyArray<string>
      )[]
    }
  />
));

export const MatCardSmImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={
      ['mat-mdc-card-sm-image', 'mdc-card__media', props.class].filter(Boolean) as (
        | string
        | ReadonlyArray<string>
      )[]
    }
  />
));

export const MatCardMdImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={
      ['mat-mdc-card-md-image', 'mdc-card__media', props.class].filter(Boolean) as (
        | string
        | ReadonlyArray<string>
      )[]
    }
  />
));

export const MatCardLgImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={
      ['mat-mdc-card-lg-image', 'mdc-card__media', props.class].filter(Boolean) as (
        | string
        | ReadonlyArray<string>
      )[]
    }
  />
));

export const MatCardXlImage = component$<MatCardImageProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={
      ['mat-mdc-card-xl-image', 'mdc-card__media', props.class].filter(Boolean) as (
        | string
        | ReadonlyArray<string>
      )[]
    }
  />
));
```

- [ ] **Step 2: Write `mat-card-avatar.tsx`**

```tsx
import {component$} from '@builder.io/qwik';

export interface MatCardAvatarProps {
  src: string;
  alt?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardAvatar = component$<MatCardAvatarProps>(props => (
  <img
    id={props.id}
    src={props.src}
    alt={props.alt ?? ''}
    class={
      ['mat-mdc-card-avatar', props.class].filter(Boolean) as (
        | string
        | ReadonlyArray<string>
      )[]
    }
  />
));
```

- [ ] **Step 3: Write smoke spec `mat-card-image.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {
  MatCardImage,
  MatCardSmImage,
  MatCardMdImage,
  MatCardLgImage,
  MatCardXlImage,
} from './mat-card-image';

describe('MatCardImage family (module-import smoke)', () => {
  it('all 5 image components are Qwik components', () => {
    expect(MatCardImage).toBeDefined();
    expect(typeof MatCardImage).toBe('function');
    expect(MatCardSmImage).toBeDefined();
    expect(typeof MatCardSmImage).toBe('function');
    expect(MatCardMdImage).toBeDefined();
    expect(typeof MatCardMdImage).toBe('function');
    expect(MatCardLgImage).toBeDefined();
    expect(typeof MatCardLgImage).toBe('function');
    expect(MatCardXlImage).toBeDefined();
    expect(typeof MatCardXlImage).toBe('function');
  });
});
```

- [ ] **Step 4: Write smoke spec `mat-card-avatar.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatCardAvatar} from './mat-card-avatar';

describe('MatCardAvatar (module-import smoke)', () => {
  it('MatCardAvatar is a Qwik component', () => {
    expect(MatCardAvatar).toBeDefined();
    expect(typeof MatCardAvatar).toBe('function');
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm -C src/qwik-material test card/mat-card-image card/mat-card-avatar
```

Expected: 2/2 passing.

- [ ] **Step 6: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-material/card/mat-card-image.tsx src/qwik-material/card/mat-card-image.spec.tsx \
        src/qwik-material/card/mat-card-avatar.tsx src/qwik-material/card/mat-card-avatar.spec.tsx
git commit -m "feat(multiple): add MatCardImage (5 size variants) + MatCardAvatar"
```

---

## Phase 5 — Structured components (with named slots)

### Task 7: `<MatCardHeader>` + `<MatCardTitleGroup>` (q:slot pattern)

**Reference source:** `src/material/card/card.ts` — MatCardHeader (lines 151-157), MatCardTitleGroup (78-84). Upstream templates: `src/material/card/card-header.html`, `src/material/card/card-title-group.html`.

**Files:**
- Create: `src/qwik-material/card/mat-card-header.tsx`
- Create: `src/qwik-material/card/mat-card-title-group.tsx`
- Create: `src/qwik-material/card/mat-card-header.spec.tsx`
- Create: `src/qwik-material/card/mat-card-title-group.spec.tsx`
- Create: `src/qwik-material/card/card-header.html.removed.md`
- Create: `src/qwik-material/card/card-title-group.html.removed.md`

**Interfaces:**
- Consumes: `IntrinsicElements` augmentation from Task 1.
- Produces: 2 components exported. Consumed by public-api (Task 8), dev-app routes (Task 13), Playwright specs (Task 14).

- [ ] **Step 1: Write `card-header.html.removed.md`**

```markdown
# card-header.html — removed

Upstream `src/material/card/card-header.html` is inlined into
`mat-card-header.tsx` as JSX per the qwik-material file-naming rule.
Upstream template:

    <ng-content></ng-content>
    <ng-content select="[mat-card-avatar], [matCardAvatar]"></ng-content>
    <div class="mat-mdc-card-header-text">
      <ng-content
        select="mat-card-title, mat-card-subtitle,
                [mat-card-title], [mat-card-subtitle],
                [matCardTitle], [matCardSubtitle]"></ng-content>
    </div>

Angular's `<ng-content select>` picks projected children by SELECTOR match.
Qwik has no equivalent; consumers must use `q:slot="avatar"` on their
MatCardAvatar and `q:slot="text"` on their MatCardTitle / MatCardSubtitle.
Rendered structure preserved:

    <mat-card-header class="mat-mdc-card-header">
      <!-- Default (unnamed) slot for any free-projected content -->
      <!-- q:slot="avatar" slot -->
      <div class="mat-mdc-card-header-text">
        <!-- q:slot="text" slot -->
      </div>
    </mat-card-header>
```

- [ ] **Step 2: Write `card-title-group.html.removed.md`**

```markdown
# card-title-group.html — removed

Upstream `src/material/card/card-title-group.html` is inlined into
`mat-card-title-group.tsx` as JSX per the qwik-material file-naming rule.
Upstream template:

    <div>
      <ng-content
        select="mat-card-title, mat-card-subtitle,
                [mat-card-title], [mat-card-subtitle],
                [matCardTitle], [matCardSubtitle]"></ng-content>
    </div>
    <ng-content select="[mat-card-image], [matCardImage],
                        [mat-card-sm-image], [matCardImageSmall],
                        [mat-card-md-image], [matCardImageMedium],
                        [mat-card-lg-image], [matCardImageLarge],
                        [mat-card-xl-image], [matCardImageXLarge]"></ng-content>
    <ng-content></ng-content>

Qwik equivalent uses `q:slot="text"` for title/subtitle and `q:slot="image"`
for the image element. The final unnamed slot picks up any free content.
```

- [ ] **Step 3: Write `mat-card-header.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';

export interface MatCardHeaderProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/**
 * Header region of a card. Uses q:slot named slots for structured projection:
 * - unnamed <Slot/> for any free-projected content (rendered first)
 * - q:slot="avatar" for a MatCardAvatar (rendered second)
 * - q:slot="text" for MatCardTitle / MatCardSubtitle (rendered inside the
 *   .mat-mdc-card-header-text wrapper div, matches upstream template)
 *
 * Consumer example:
 *   <MatCardHeader>
 *     <MatCardAvatar q:slot="avatar" src="/u.png" alt="User" />
 *     <MatCardTitle q:slot="text">Hello</MatCardTitle>
 *     <MatCardSubtitle q:slot="text">World</MatCardSubtitle>
 *   </MatCardHeader>
 */
export const MatCardHeader = component$<MatCardHeaderProps>(props => {
  const classes = ['mat-mdc-card-header', props.class].filter(Boolean) as (
    | string
    | ReadonlyArray<string>
  )[];
  return (
    <mat-card-header id={props.id} class={classes}>
      <Slot />
      <Slot name="avatar" />
      <div class="mat-mdc-card-header-text">
        <Slot name="text" />
      </div>
    </mat-card-header>
  );
});
```

- [ ] **Step 4: Write `mat-card-title-group.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';

export interface MatCardTitleGroupProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/**
 * Title-group region of a card. Uses q:slot named slots:
 * - q:slot="text" for MatCardTitle / MatCardSubtitle (rendered inside an
 *   unclassed wrapper <div>, matches upstream template)
 * - q:slot="image" for a MatCardImage family element
 * - unnamed <Slot/> for any free-projected content (rendered last)
 *
 * Consumer example:
 *   <MatCardTitleGroup>
 *     <MatCardTitle q:slot="text">Hello</MatCardTitle>
 *     <MatCardSubtitle q:slot="text">World</MatCardSubtitle>
 *     <MatCardImage q:slot="image" src="/x.png" alt="X" />
 *   </MatCardTitleGroup>
 */
export const MatCardTitleGroup = component$<MatCardTitleGroupProps>(props => {
  const classes = ['mat-mdc-card-title-group', props.class].filter(Boolean) as (
    | string
    | ReadonlyArray<string>
  )[];
  return (
    <mat-card-title-group id={props.id} class={classes}>
      <div>
        <Slot name="text" />
      </div>
      <Slot name="image" />
      <Slot />
    </mat-card-title-group>
  );
});
```

- [ ] **Step 5: Write smoke spec `mat-card-header.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatCardHeader} from './mat-card-header';

describe('MatCardHeader (module-import smoke)', () => {
  it('MatCardHeader is a Qwik component', () => {
    expect(MatCardHeader).toBeDefined();
    expect(typeof MatCardHeader).toBe('function');
  });
});
```

- [ ] **Step 6: Write smoke spec `mat-card-title-group.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatCardTitleGroup} from './mat-card-title-group';

describe('MatCardTitleGroup (module-import smoke)', () => {
  it('MatCardTitleGroup is a Qwik component', () => {
    expect(MatCardTitleGroup).toBeDefined();
    expect(typeof MatCardTitleGroup).toBe('function');
  });
});
```

- [ ] **Step 7: Run tests**

```bash
pnpm -C src/qwik-material test card/mat-card-header card/mat-card-title-group
```

Expected: 2/2 passing.

- [ ] **Step 8: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/qwik-material/card/mat-card-header.tsx src/qwik-material/card/mat-card-header.spec.tsx \
        src/qwik-material/card/mat-card-title-group.tsx src/qwik-material/card/mat-card-title-group.spec.tsx \
        src/qwik-material/card/card-header.html.removed.md \
        src/qwik-material/card/card-title-group.html.removed.md
git commit -m "feat(multiple): add MatCardHeader + MatCardTitleGroup with q:slot named slots"
```

---

## Phase 6 — MatCard container

### Task 8: `<MatCard>` component (with config-driven appearance)

**Reference source:** `src/material/card/card.ts` lines 35-56 (MatCard component + host bindings).

**Files:**
- Create: `src/qwik-material/card/mat-card.tsx`
- Create: `src/qwik-material/card/mat-card.spec.tsx`
- Create: `src/qwik-material/card/card.html.removed.md`

**Interfaces:**
- Consumes: `MatCardAppearance` from Task 3; `MAT_CARD_CONFIG` + `MatCardConfig` from Task 4; `IntrinsicElements` augmentation from Task 1.
- Produces: `MatCard: Component<MatCardProps>`, `MatCardProps` interface. Consumed by public-api (Task 9), dev-app routes (Task 13), Playwright specs (Task 14).

- [ ] **Step 1: Write `card.html.removed.md`**

```markdown
# card.html — removed

Upstream `src/material/card/card.html` is inlined into `mat-card.tsx` as
JSX per the qwik-material file-naming rule. Upstream template is:

    <ng-content></ng-content>

Single default projection slot. qwik-material renders `<mat-card>` with
a single `<Slot />` for children — no structured slots.
```

- [ ] **Step 2: Write `mat-card.tsx`**

```tsx
import {component$, Slot, useContext} from '@builder.io/qwik';
import type {MatCardAppearance} from './card-appearance';
import {MAT_CARD_CONFIG, type MatCardConfig} from './card-config';

export interface MatCardProps {
  /** Visual appearance. Overrides the provider config. Defaults to 'raised'. */
  appearance?: MatCardAppearance;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatCardConfig = {appearance: 'raised'};

export const MatCard = component$<MatCardProps>(props => {
  const config = useContext(MAT_CARD_CONFIG, DEFAULTS);
  const appearance = props.appearance ?? config.appearance ?? 'raised';

  const classes = [
    'mat-mdc-card',
    'mdc-card',
    appearance === 'outlined' && 'mat-mdc-card-outlined',
    appearance === 'outlined' && 'mdc-card--outlined',
    appearance === 'filled' && 'mat-mdc-card-filled',
    appearance === 'filled' && 'mdc-card--filled',
    props.class,
  ].filter(Boolean) as (string | ReadonlyArray<string>)[];

  return (
    <mat-card id={props.id} class={classes}>
      <Slot />
    </mat-card>
  );
});
```

- [ ] **Step 3: Write smoke spec `mat-card.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatCard} from './mat-card';

describe('MatCard (module-import smoke)', () => {
  it('MatCard is a Qwik component', () => {
    expect(MatCard).toBeDefined();
    expect(typeof MatCard).toBe('function');
  });
});
```

- [ ] **Step 4: Run tests**

```bash
pnpm -C src/qwik-material test card/mat-card
```

Expected: 1/1 passing.

- [ ] **Step 5: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/card/mat-card.tsx src/qwik-material/card/mat-card.spec.tsx \
        src/qwik-material/card/card.html.removed.md
git commit -m "feat(multiple): add MatCard container with 3 appearances + config default"
```

---

## Phase 7 — Provider extension

### Task 9: Extend `<QwikMaterialProvider>` with `matCardConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (existing provider from Dialog + Button ports).

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-card.spec.tsx`

**Interfaces:**
- Consumes: `MatCardConfig` + `MAT_CARD_CONFIG` from Task 4.
- Produces: `QwikMaterialProviderProps.matCardConfig` optional field. When set, provider installs `MAT_CARD_CONFIG` in the subtree. Consumed by MatCard (Task 8) via `useContext(MAT_CARD_CONFIG, DEFAULTS)`.

- [ ] **Step 1: Read the current provider file**

```bash
cat src/qwik-material/dialog/qwik-material-provider.tsx
```

Confirm the existing structure. It currently has four `useContextProvider` calls (dialog defaults, dialog scroll-strategy, animations-disabled, button config).

- [ ] **Step 2: Add the `matCardConfig` prop + provider call**

Update the file in-place. Add imports:

```tsx
import type {MatCardConfig} from '../card/card-config';
import {MAT_CARD_CONFIG} from '../card/card-config';
```

Add the prop to `QwikMaterialProviderProps`:

```tsx
/** Defaults applied to every MatCard in this subtree. */
matCardConfig?: MatCardConfig;
```

Add the `useContextProvider` call after the button-config one:

```tsx
// MatCardConfig is a plain object with primitive fields — no noSerialize needed.
// Cards outside a provider get the DEFAULTS declared in MatCard; providing
// an empty object is equivalent to accepting all defaults.
useContextProvider(MAT_CARD_CONFIG, props.matCardConfig ?? {});
```

Preserve every existing `useContextProvider` call unchanged (dialog defaults, dialog scroll-strategy, animations-disabled, button config). New provider call goes at the END of the sequence.

- [ ] **Step 3: Write `qwik-material-provider-card.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider} from './qwik-material-provider';

describe('QwikMaterialProvider (card config smoke)', () => {
  it('QwikMaterialProvider is a Qwik component', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });
});
```

This is a smoke-only spec because the createDOM+useContext pattern hangs vitest (same infra bug as dialog + button ports). Flow-through verification lives in Task 13 (dev-app) via manual browser inspection.

- [ ] **Step 4: Run the new spec + regression-check the existing provider spec**

```bash
pnpm -C src/qwik-material test dialog/qwik-material-provider
```

Expected: previously passing count unchanged + 1 new smoke test.

- [ ] **Step 5: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/dialog/qwik-material-provider.tsx \
        src/qwik-material/dialog/qwik-material-provider-card.spec.tsx
git commit -m "feat(multiple): extend QwikMaterialProvider with matCardConfig field"
```

---

## Phase 8 — Public API + build validation

### Task 10: `card/public-api.ts` + `card/index.ts` + build verification

**Reference source:** `src/qwik-material/button/public-api.ts` (existing pattern).

**Files:**
- Create: `src/qwik-material/card/public-api.ts`
- Modify: `src/qwik-material/card/index.ts` (replaces the empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Phases 3-6.
- Produces: consumer-facing surface `@angular-community/qwik-material/card`. Consumed by dev-app routes (Task 13), Playwright specs (Task 14).

- [ ] **Step 1: Write `card/public-api.ts`**

```ts
// Public API for @angular-community/qwik-material/card.
// See docs/superpowers/specs/2026-07-20-qwik-material-card-port-design.md §2.

export type {MatCardAppearance} from './card-appearance';
export type {MatCardConfig} from './card-config';
export {MAT_CARD_CONFIG} from './card-config';

export {MatCard, type MatCardProps} from './mat-card';
export {MatCardHeader, type MatCardHeaderProps} from './mat-card-header';
export {MatCardTitleGroup, type MatCardTitleGroupProps} from './mat-card-title-group';
export {MatCardTitle, type MatCardTitleProps} from './mat-card-title';
export {MatCardSubtitle, type MatCardSubtitleProps} from './mat-card-subtitle';
export {MatCardContent, type MatCardContentProps} from './mat-card-content';
export {MatCardActions, type MatCardActionsProps} from './mat-card-actions';
export {MatCardFooter, type MatCardFooterProps} from './mat-card-footer';
export {
  MatCardImage,
  MatCardSmImage,
  MatCardMdImage,
  MatCardLgImage,
  MatCardXlImage,
  type MatCardImageProps,
} from './mat-card-image';
export {MatCardAvatar, type MatCardAvatarProps} from './mat-card-avatar';
```

- [ ] **Step 2: Replace `card/index.ts` stub with the real re-export**

```ts
export * from './public-api';
```

- [ ] **Step 3: Verify build + typecheck**

```bash
pnpm -C src/qwik-material build && pnpm -C src/qwik-material typecheck
```

Expected:
- Build emits `dist/card/index.js` (~1-2 KB) + `dist/card/index.d.ts` containing the 14 component + 1 config token surface.
- Both commands exit 0.

- [ ] **Step 4: Sanity-check the exported surface**

```bash
grep -nE "^export " src/qwik-material/dist/card/public-api.d.ts
```

Expected output includes 14 component exports (MatCard + Header + TitleGroup + Title + Subtitle + Content + Actions + Footer + Image + Sm/Md/Lg/Xl Image + Avatar) + MAT_CARD_CONFIG + all Props type re-exports.

Also confirm zero exported classes on the consumer surface:

```bash
grep -nE "^export declare class" src/qwik-material/dist/card/public-api.d.ts
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/card/public-api.ts src/qwik-material/card/index.ts
git commit -m "feat(multiple): finalize qwik-material/card public API"
```

---

## Phase 9 — Scenario tests

### Task 11: Vitest scenario port from `src/material/card/card.spec.ts`

**Reference source:** `src/material/card/card.spec.ts` (58 LOC, ~8 upstream `it` blocks).

**Files:**
- Create: `src/qwik-material/card/mat-card-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 10.
- Produces: consolidated scenario coverage documenting upstream test intent.

Categorise upstream `it()` blocks by bucket: portable (~7) covering appearance/align/config/image/avatar; angular-only (~1) TestBed-specific.

Given the smoke-only vitest constraint (createDOM hangs Qwik optimizer — verified across dialog + button ports), restructure the port as:
- **Live sanity tests (~15):** confirm every public export is defined and callable
- **describe.skip block (~7 todo stubs):** upstream `it()` names preserved for future porting when DOM-render infra is fixed
- **describe.skip block (~1 todo stub):** Angular-only tests preserved as reference

Total target: 11 passing sanity tests + 8 skipped stubs (7 DOM-rendered + 1 Angular-only).

- [ ] **Step 1: Enumerate upstream `it()` blocks**

```bash
grep -n "^  it(" src/material/card/card.spec.ts
```

Bucket each match into DOM-rendered / config-injection / Angular-only categories.

- [ ] **Step 2: Write the scenario spec**

```tsx
/**
 * MatCard scenario port from src/material/card/card.spec.ts.
 *
 * Structure: (i) live sanity tests confirming every public export is
 * callable; (ii) describe.skip blocks preserving upstream `it()` names
 * for traceability, deferred to Playwright (Task 14) where real DOM
 * rendering is possible.
 *
 * Real DOM assertions (class emissions, appearance toggling, actions
 * align, config flow-through) live in Task 14's Playwright specs. This
 * file's job is to (a) prove exports load without error, (b) document
 * what still needs porting when infra allows.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_CARD_CONFIG,
  MatCard,
  MatCardHeader,
  MatCardTitleGroup,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
  MatCardActions,
  MatCardFooter,
  MatCardImage,
  MatCardSmImage,
  MatCardMdImage,
  MatCardLgImage,
  MatCardXlImage,
  MatCardAvatar,
} from './public-api';

describe('MatCard — sanity', () => {
  it('MAT_CARD_CONFIG has the expected context id', () => {
    expect(MAT_CARD_CONFIG.id).toBe('qwik-material/card-config');
  });

  it('MatCard is exported', () => {
    expect(MatCard).toBeDefined();
    expect(typeof MatCard).toBe('function');
  });

  it('MatCardHeader is exported', () => {
    expect(MatCardHeader).toBeDefined();
    expect(typeof MatCardHeader).toBe('function');
  });

  it('MatCardTitleGroup is exported', () => {
    expect(MatCardTitleGroup).toBeDefined();
    expect(typeof MatCardTitleGroup).toBe('function');
  });

  it('MatCardTitle is exported', () => {
    expect(MatCardTitle).toBeDefined();
    expect(typeof MatCardTitle).toBe('function');
  });

  it('MatCardSubtitle is exported', () => {
    expect(MatCardSubtitle).toBeDefined();
    expect(typeof MatCardSubtitle).toBe('function');
  });

  it('MatCardContent is exported', () => {
    expect(MatCardContent).toBeDefined();
    expect(typeof MatCardContent).toBe('function');
  });

  it('MatCardActions is exported', () => {
    expect(MatCardActions).toBeDefined();
    expect(typeof MatCardActions).toBe('function');
  });

  it('MatCardFooter is exported', () => {
    expect(MatCardFooter).toBeDefined();
    expect(typeof MatCardFooter).toBe('function');
  });

  it('MatCardImage family (5 variants) is exported', () => {
    expect(MatCardImage).toBeDefined();
    expect(MatCardSmImage).toBeDefined();
    expect(MatCardMdImage).toBeDefined();
    expect(MatCardLgImage).toBeDefined();
    expect(MatCardXlImage).toBeDefined();
    [MatCardImage, MatCardSmImage, MatCardMdImage, MatCardLgImage, MatCardXlImage].forEach(c => {
      expect(typeof c).toBe('function');
    });
  });

  it('MatCardAvatar is exported', () => {
    expect(MatCardAvatar).toBeDefined();
    expect(typeof MatCardAvatar).toBe('function');
  });
});

describe.skip('MatCard DOM-rendered scenarios — deferred to Playwright Task 14', () => {
  // The following upstream `it()` names are preserved from
  // src/material/card/card.spec.ts. Real DOM assertions live in
  // src/qwik-cdk-parity-tests/specs/material-card/*.spec.ts.

  it('should apply class based on appearance (raised default)', () => {});
  it('should apply mat-mdc-card-outlined when appearance="outlined"', () => {});
  it('should apply mat-mdc-card-filled when appearance="filled"', () => {});
  it('should apply mat-mdc-card-actions-align-end when align="end"', () => {});
  it('should not apply align-end class when align="start" (default)', () => {});
  it('should apply mat-mdc-card-image + mdc-card__media classes on image', () => {});
  it('should apply mat-mdc-card-avatar class on avatar', () => {});
});

describe.skip('MatCard — Angular-only tests', () => {
  it('should use MAT_CARD_CONFIG provider default appearance', () => {
    // Provider flow-through verified in Task 13 dev-app + Task 14 Playwright.
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test card/mat-card-scenarios
```

Expected: 11 passing + 8 skipped.

- [ ] **Step 4: Run the full qwik-material safe-subset to confirm no regression**

```bash
pnpm -C src/qwik-material test
```

Expected: total count = pre-Task-11 total + 11 passing + 8 skipped from this task.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/card/mat-card-scenarios.spec.tsx
git commit -m "test(multiple): port MatCard scenarios from upstream card.spec.ts"
```

---

## Phase 10 — Dev-app scenarios

### Task 12: Dev-app: 10 mat-card routes + index tile + root.tsx CSS import

**Reference source:** existing dev-app patterns from Dialog + Button ports at `src/qwik-cdk-dev-app/src/routes/mat-button/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add card-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Cards" section with 10 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/outlined/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/filled/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/with-header/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/with-actions-start/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/with-actions-end/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/with-image/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/with-footer/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/title-group/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-card/full-composed/index.tsx`

**Interfaces:**
- Consumes: everything from `@angular-community/qwik-material/card`.
- Produces: 10 mount-only routes at `/mat-card/*` each rendering `<Component />` + `<main data-scenario-ready>ready</main>` for Playwright.

- [ ] **Step 1: Add the card-prebuilt.css import to root.tsx**

Read `src/qwik-cdk-dev-app/src/root.tsx`. Append the card CSS import after the button one:

```tsx
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/card-prebuilt.css';
```

- [ ] **Step 2: Add a "Cards" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert a new `<section>` after the existing "Buttons" section:

```tsx
<section>
  <h2>Cards</h2>
  <ul>
    <li><a href="/mat-card/basic/">basic</a></li>
    <li><a href="/mat-card/outlined/">outlined</a></li>
    <li><a href="/mat-card/filled/">filled</a></li>
    <li><a href="/mat-card/with-header/">with-header</a></li>
    <li><a href="/mat-card/with-actions-start/">with-actions-start</a></li>
    <li><a href="/mat-card/with-actions-end/">with-actions-end</a></li>
    <li><a href="/mat-card/with-image/">with-image</a></li>
    <li><a href="/mat-card/with-footer/">with-footer</a></li>
    <li><a href="/mat-card/title-group/">title-group</a></li>
    <li><a href="/mat-card/full-composed/">full-composed</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardTitle>Basic card</MatCardTitle>
      <MatCardSubtitle>Raised appearance by default</MatCardSubtitle>
      <MatCardContent>
        <p>The default appearance is 'raised'. This card demonstrates the container plus three text-only children.</p>
      </MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `outlined/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitle,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard appearance="outlined">
      <MatCardTitle>Outlined card</MatCardTitle>
      <MatCardContent>Outlined appearance — border instead of shadow.</MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `filled/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitle,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard appearance="filled">
      <MatCardTitle>Filled card</MatCardTitle>
      <MatCardContent>Filled appearance — subtle tinted background, no shadow, no border.</MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create `with-header/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardHeader,
  MatCardAvatar,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardHeader>
        <MatCardAvatar q:slot="avatar" src="https://placehold.co/40x40" alt="Avatar" />
        <MatCardTitle q:slot="text">With header</MatCardTitle>
        <MatCardSubtitle q:slot="text">Avatar + title + subtitle</MatCardSubtitle>
      </MatCardHeader>
      <MatCardContent>Header uses q:slot="avatar" and q:slot="text" for structured projection.</MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `with-actions-start/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitle,
  MatCardContent,
  MatCardActions,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardTitle>Actions align=start (default)</MatCardTitle>
      <MatCardContent>Actions row aligned to the start.</MatCardContent>
      <MatCardActions>
        <button type="button">Action 1</button>
        <button type="button">Action 2</button>
      </MatCardActions>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create `with-actions-end/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitle,
  MatCardContent,
  MatCardActions,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardTitle>Actions align=end</MatCardTitle>
      <MatCardContent>Actions row aligned to the end.</MatCardContent>
      <MatCardActions align="end">
        <button type="button">Cancel</button>
        <button type="button">Confirm</button>
      </MatCardActions>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Create `with-image/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardImage,
  MatCardTitle,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardImage src="https://placehold.co/600x200" alt="Cover" />
      <MatCardTitle>With image</MatCardTitle>
      <MatCardContent>MatCardImage renders an &lt;img&gt; with the mat-mdc-card-image + mdc-card__media classes.</MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 10: Create `with-footer/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitle,
  MatCardContent,
  MatCardFooter,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardTitle>With footer</MatCardTitle>
      <MatCardContent>Card with a footer element below the content.</MatCardContent>
      <MatCardFooter>Footer text</MatCardFooter>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 11: Create `title-group/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitleGroup,
  MatCardTitle,
  MatCardSubtitle,
  MatCardImage,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardTitleGroup>
        <MatCardTitle q:slot="text">Title group</MatCardTitle>
        <MatCardSubtitle q:slot="text">Title + subtitle + trailing image</MatCardSubtitle>
        <MatCardImage q:slot="image" src="https://placehold.co/80x80" alt="Icon" />
      </MatCardTitleGroup>
      <MatCardContent>MatCardTitleGroup uses q:slot="text" and q:slot="image".</MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 12: Create `full-composed/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardHeader,
  MatCardAvatar,
  MatCardTitle,
  MatCardSubtitle,
  MatCardImage,
  MatCardContent,
  MatCardActions,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardHeader>
        <MatCardAvatar q:slot="avatar" src="https://placehold.co/40x40" alt="User" />
        <MatCardTitle q:slot="text">Full composed card</MatCardTitle>
        <MatCardSubtitle q:slot="text">Header + image + content + actions</MatCardSubtitle>
      </MatCardHeader>
      <MatCardImage src="https://placehold.co/600x200" alt="Cover" />
      <MatCardContent>
        <p>A realistic composition: avatar-headed card with a cover image, body copy, and an actions row at the bottom.</p>
      </MatCardContent>
      <MatCardActions align="end">
        <button type="button">Dismiss</button>
        <button type="button">Open</button>
      </MatCardActions>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 13: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Expected:
- Client + SSR builds succeed (~250+ modules).
- All 10 mat-card routes appear in `dist/q-manifest.json`:

```bash
grep -oE '"mat-card/[a-z-]+/"' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `10`.

- [ ] **Step 14: Manual verification (preview)**

```bash
pnpm -C src/qwik-cdk-dev-app preview
```

Visit each of the 10 routes in a browser. Confirm the DOM (via devtools) shows `<mat-card>`, `<mat-card-header>`, `<mat-card-title>` etc. as actual custom element tags — NOT `<div>`. Kill the preview after inspection.

- [ ] **Step 15: Commit**

```bash
git add src/qwik-cdk-dev-app/src/root.tsx \
        src/qwik-cdk-dev-app/src/routes/index.tsx \
        src/qwik-cdk-dev-app/src/routes/mat-card/
git commit -m "feat(multiple): add mat-card dev-app routes (10) + index tile + CSS import"
```

---

## Phase 11 — Playwright parity

### Task 13: Playwright material-card parity specs (10)

**Reference source:** `src/qwik-cdk-parity-tests/specs/material-button/text.spec.ts` (existing pattern from Button port).

**Files:**
- Create: `src/qwik-cdk-parity-tests/specs/material-card/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-card/outlined.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-card/filled.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-card/with-header.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-card/with-actions-start.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-card/with-actions-end.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-card/with-image.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-card/with-footer.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-card/title-group.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-card/full-composed.spec.ts`

**Interfaces:**
- Consumes: Task 12's dev-app routes at `http://localhost:4173/mat-card/*`.
- Produces: 10 Playwright specs asserting **tag name AND class** for CMS parity.

Every spec asserts on the custom-element tag name (via `page.locator('mat-card')` etc.) AT LEAST ONCE, so a regression to `<div>` fails loudly.

- [ ] **Step 1: Read the existing material-button spec template**

```bash
cat src/qwik-cdk-parity-tests/specs/material-button/text.spec.ts
```

Note the imports, `BASE_URL`, `page.waitForSelector('[data-scenario-ready]')`, and assertion style. Reuse this template.

- [ ] **Step 2: Write `basic.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/basic — renders <mat-card> custom-element tag + expected classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  // Tag-name assertion (CMS parity — regression to <div> fails here)
  const card = page.locator('mat-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/mat-mdc-card(\s|$)/);
  await expect(card).toHaveClass(/mdc-card(\s|$)/);

  // Child components render with correct custom tags
  await expect(page.locator('mat-card-title')).toHaveText('Basic card');
  await expect(page.locator('mat-card-subtitle')).toHaveText(/Raised appearance/);
  await expect(page.locator('mat-card-content')).toBeVisible();
});
```

- [ ] **Step 3: Write `outlined.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/outlined — <mat-card> with outlined classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/outlined/`);
  await page.waitForSelector('[data-scenario-ready]');

  const card = page.locator('mat-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/mat-mdc-card-outlined/);
  await expect(card).toHaveClass(/mdc-card--outlined/);
});
```

- [ ] **Step 4: Write `filled.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/filled — <mat-card> with filled classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/filled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const card = page.locator('mat-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/mat-mdc-card-filled/);
  await expect(card).toHaveClass(/mdc-card--filled/);
});
```

- [ ] **Step 5: Write `with-header.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/with-header — <mat-card-header> + avatar + text-wrapper', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/with-header/`);
  await page.waitForSelector('[data-scenario-ready]');

  const header = page.locator('mat-card-header');
  await expect(header).toBeVisible();
  await expect(header).toHaveClass(/mat-mdc-card-header/);

  // Avatar renders as <img> with the avatar class
  const avatar = header.locator('img.mat-mdc-card-avatar');
  await expect(avatar).toBeVisible();
  await expect(avatar).toHaveAttribute('src', /placehold\.co/);

  // Title + subtitle wrapped in .mat-mdc-card-header-text div
  const wrapper = header.locator('div.mat-mdc-card-header-text');
  await expect(wrapper).toBeVisible();
  await expect(wrapper.locator('mat-card-title')).toHaveText('With header');
  await expect(wrapper.locator('mat-card-subtitle')).toHaveText(/Avatar/);
});
```

- [ ] **Step 6: Write `with-actions-start.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/with-actions-start — <mat-card-actions> without align-end class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/with-actions-start/`);
  await page.waitForSelector('[data-scenario-ready]');

  const actions = page.locator('mat-card-actions');
  await expect(actions).toBeVisible();
  await expect(actions).toHaveClass(/mat-mdc-card-actions/);
  await expect(actions).toHaveClass(/mdc-card__actions/);
  await expect(actions).not.toHaveClass(/mat-mdc-card-actions-align-end/);
});
```

- [ ] **Step 7: Write `with-actions-end.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/with-actions-end — <mat-card-actions> with align-end class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/with-actions-end/`);
  await page.waitForSelector('[data-scenario-ready]');

  const actions = page.locator('mat-card-actions');
  await expect(actions).toBeVisible();
  await expect(actions).toHaveClass(/mat-mdc-card-actions-align-end/);
});
```

- [ ] **Step 8: Write `with-image.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/with-image — <img> with mat-mdc-card-image + mdc-card__media', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/with-image/`);
  await page.waitForSelector('[data-scenario-ready]');

  const img = page.locator('mat-card img.mat-mdc-card-image');
  await expect(img).toBeVisible();
  await expect(img).toHaveClass(/mdc-card__media/);
  await expect(img).toHaveAttribute('src', /placehold\.co/);
});
```

- [ ] **Step 9: Write `with-footer.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/with-footer — <mat-card-footer> renders with expected class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/with-footer/`);
  await page.waitForSelector('[data-scenario-ready]');

  const footer = page.locator('mat-card-footer');
  await expect(footer).toBeVisible();
  await expect(footer).toHaveClass(/mat-mdc-card-footer/);
  await expect(footer).toHaveText('Footer text');
});
```

- [ ] **Step 10: Write `title-group.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/title-group — <mat-card-title-group> with q:slot structure', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/title-group/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-card-title-group');
  await expect(group).toBeVisible();
  await expect(group).toHaveClass(/mat-mdc-card-title-group/);

  // Title + subtitle wrapped in an unclassed div (upstream template)
  const wrapper = group.locator('> div').first();
  await expect(wrapper.locator('mat-card-title')).toHaveText('Title group');
  await expect(wrapper.locator('mat-card-subtitle')).toHaveText(/Title \+ subtitle/);

  // Image renders directly as <img>
  await expect(group.locator('img.mat-mdc-card-image')).toBeVisible();
});
```

- [ ] **Step 11: Write `full-composed.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/full-composed — every card sub-component renders with its custom tag', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/full-composed/`);
  await page.waitForSelector('[data-scenario-ready]');

  // All the expected custom-element tags exist inside the card
  await expect(page.locator('mat-card')).toBeVisible();
  await expect(page.locator('mat-card-header')).toBeVisible();
  await expect(page.locator('mat-card-title')).toHaveText('Full composed card');
  await expect(page.locator('mat-card-subtitle')).toBeVisible();
  await expect(page.locator('mat-card-content')).toBeVisible();
  await expect(page.locator('mat-card-actions')).toHaveClass(/mat-mdc-card-actions-align-end/);
  await expect(page.locator('img.mat-mdc-card-avatar')).toBeVisible();
  await expect(page.locator('img.mat-mdc-card-image')).toBeVisible();
});
```

- [ ] **Step 12: Do NOT run Playwright yet**

Running the specs requires a human to run `pnpm -C src/qwik-cdk-dev-app preview` in a separate terminal AND to have installed the Chromium browser via `pnpm -C src/qwik-cdk-parity-tests exec playwright install chromium` at least once. Skip the pipeline invocation — the finalization task (Task 14) documents the manual verification step.

- [ ] **Step 13: Commit**

```bash
git add src/qwik-cdk-parity-tests/specs/material-card/
git commit -m "test(multiple): Playwright material-card parity specs (10 routes, tag+class assertions)"
```

---

## Phase 12 — Finalisation

### Task 14: SYNC.md + pipeline verification + optional dialog SYNC append

**Reference source:** `src/qwik-material/button/SYNC.md` (existing SYNC pattern).

**Files:**
- Create: `src/qwik-material/card/SYNC.md`
- Modify (only if new stubs added): `src/qwik-material/dialog/SYNC.md` (append note about card-owned stubs, if any)
- Verify (no change): root `package.json` `test:qwik-material` script (exists from dialog port; card is picked up by the existing glob).

**Interfaces:**
- Consumes: everything from Task 0 (Dialog prereq) + Tasks 1-13.
- Produces: `SYNC.md` documenting the card port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/card/SYNC.md`**

```markdown
# qwik-material/card sync log

Tracks the sync state between this port and `src/material/card/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md` and `src/qwik-material/button/SYNC.md`
in the same package.

## Upstream sync state

| File                                     | Upstream path                                        | Sync state | Notes                                                                                     |
| ---------------------------------------- | ---------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `card/mat-card.tsx`                      | `src/material/card/card.ts` (MatCard) + `card.html`  | ported     | Component→component$; renders <mat-card> custom-element tag; reads MAT_CARD_CONFIG        |
| `card/mat-card-header.tsx`               | `src/material/card/card.ts` (MatCardHeader) + `card-header.html` | ported | q:slot="avatar" + q:slot="text" replace ng-content-by-selector projection            |
| `card/mat-card-title-group.tsx`          | `src/material/card/card.ts` (MatCardTitleGroup) + `card-title-group.html` | ported | q:slot="text" + q:slot="image" replace ng-content-by-selector projection      |
| `card/mat-card-title.tsx`                | `src/material/card/card.ts` (MatCardTitle)           | ported     | Renders <mat-card-title>; upstream is directive on any element                            |
| `card/mat-card-subtitle.tsx`             | `src/material/card/card.ts` (MatCardSubtitle)        | ported     | Renders <mat-card-subtitle>                                                               |
| `card/mat-card-content.tsx`              | `src/material/card/card.ts` (MatCardContent)         | ported     | Renders <mat-card-content>                                                                |
| `card/mat-card-actions.tsx`              | `src/material/card/card.ts` (MatCardActions)         | ported     | align prop preserved verbatim (upstream marked TODO-to-deprecate; we follow if renamed)  |
| `card/mat-card-footer.tsx`               | `src/material/card/card.ts` (MatCardFooter)          | ported     | Renders <mat-card-footer>                                                                 |
| `card/mat-card-image.tsx`                | `src/material/card/card.ts` (MatCardImage + 4 size variants) | ported | Renders <img> directly (not directive on consumer <img>); 5 exports in one file    |
| `card/mat-card-avatar.tsx`               | `src/material/card/card.ts` (MatCardAvatar)          | ported     | Renders <img> directly                                                                    |
| `card/card-config.ts`                    | `src/material/card/card.ts` (MatCardConfig)          | ported     | Injection token → createContextId; folded into QwikMaterialProvider.matCardConfig         |
| `card/card-appearance.ts`                | `src/material/card/card.ts` (MatCardAppearance type) | ported     | Byte-equivalent type re-export                                                            |
| `card/intrinsic-elements.d.ts`           | (Qwik-material-specific)                             | new        | TS augmentation declaring 8 custom-element tag names as valid IntrinsicElements           |
| `scss/card/card.scss`                    | `src/material/card/card.scss`                        | synced     | byte-identical copy                                                                       |
| `scss/card/_card-theme.scss`             | `src/material/card/_card-theme.scss`                 | synced     | byte-identical copy                                                                       |
| `scss/card/_m2-card.scss`                | `src/material/card/_m2-card.scss`                    | synced     | byte-identical copy                                                                       |
| `scss/card/_m3-card.scss`                | `src/material/card/_m3-card.scss`                    | synced     | byte-identical copy                                                                       |
| `scss/card/card-prebuilt.scss`           | (Qwik-material-specific)                             | new        | @use of card.scss + M3 :root defaults                                                     |

## Removed upstream files

- `card.html` → inlined into `mat-card.tsx`; breadcrumb at `card.html.removed.md`
- `card-header.html` → inlined into `mat-card-header.tsx`; breadcrumb at `card-header.html.removed.md`
- `card-title-group.html` → inlined into `mat-card-title-group.tsx`; breadcrumb at `card-title-group.html.removed.md`
- `card-module.ts` → Qwik has no module concept
- `card.spec.ts` → port lives in `mat-card-scenarios.spec.tsx` with restructured coverage per the createDOM-hangs constraint

## Deviations from upstream

1. **Image and avatar are components that render `<img>`, not directives applied to a consumer-supplied `<img>`.** `<MatCardImage src alt />` renders `<img class="mat-mdc-card-image mdc-card__media" src alt />`. Consumers who want `<picture>` or `<video>` for card media must add the classes manually until a Slot-accepting variant is added.
2. **`MAT_CARD_CONFIG` folded into `QwikMaterialProvider.matCardConfig` field.** Mirrors the dialog + button pattern; upstream has a separate `MAT_CARD_CONFIG` injection token consumed only by `MatCard`.
3. **Custom-element tag names (`mat-card`, `mat-card-header`, etc.) emitted verbatim.** Requires a small `IntrinsicElements` TypeScript augmentation. Consumers using strict JSX intrinsic typing work automatically once the .d.ts is loaded.
4. **Header + title-group use `q:slot` named slots (`avatar`, `text`, `image`) for structured projection.** Upstream projects children by TYPE via `<ng-content select>`; Qwik has no equivalent so consumers must add the `q:slot` attribute explicitly. Documented with usage examples in the JSDoc of each component.
5. **`<MatCardActions>` `align` prop stays as `'start' | 'end'`.** Upstream marked `align` as TODO-to-deprecate in favor of `actionPosition` / `actionAlignment`. We keep the current name for parity; if upstream renames it, we follow.

## Stub inventory delta

(Populated by the Task 2 SCSS-copy step. If Task 2 added any new stubs beyond
the ones already present from the dialog + button ports, list them here with
`{stub path, upstream path}`. If no new stubs were needed, write "No new stubs
— card chain reused all existing stubs.")

## Class count

`grep -nE "^export class" src/qwik-material/card/**/*.ts src/qwik-material/card/**/*.tsx`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card.
```

- [ ] **Step 2: Update the dialog SYNC.md if card added any new stubs**

If Task 2 added any new stubs under `src/qwik-material/scss/` outside `card/` (i.e. shared core stubs the dialog port didn't already create), append a new section to `src/qwik-material/dialog/SYNC.md`:

```markdown
## Additions from qwik-material/card port

- `<path/to/new-stub.scss>` — stand-in for `@angular/material/<upstream-path>`
- …
```

If Task 2's report said "No new stubs — card chain reused all existing stubs", this step is a no-op — just note that in the commit body.

- [ ] **Step 3: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** `dist/dialog-prebuilt.css` + `dist/button-prebuilt.css` + `dist/card-prebuilt.css` all emit; component JS + d.ts files land under `dist/dialog/` + `dist/button/` + `dist/card/`.
- **Vitest:** dialog + button + card scenarios all pass (or fall back to smoke if createDOM hangs).
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 4: Verify the Class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/card/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/card/SYNC.md \
        src/qwik-material/dialog/SYNC.md  # only if step 2 changed it
git commit -m "docs(multiple): finalize qwik-material/card SYNC.md + pipeline verification"
```

---

## Layout

```
src/qwik-material/
  card/
    card-appearance.ts               — MatCardAppearance type (Task 3)
    card-appearance.spec.ts          — foundation tests (Task 3)
    card-config.ts                   — MatCardConfig + MAT_CARD_CONFIG (Task 4)
    card-config.spec.ts              — foundation tests (Task 4)
    intrinsic-elements.d.ts          — 8 custom-element tag augmentations (Task 1)
    mat-card.tsx                     — <MatCard> (Task 8)
    mat-card.spec.tsx                — smoke (Task 8)
    card.html.removed.md             — breadcrumb (Task 8)
    mat-card-header.tsx              — <MatCardHeader> (Task 7)
    mat-card-header.spec.tsx         — smoke (Task 7)
    card-header.html.removed.md      — breadcrumb (Task 7)
    mat-card-title-group.tsx         — <MatCardTitleGroup> (Task 7)
    mat-card-title-group.spec.tsx    — smoke (Task 7)
    card-title-group.html.removed.md — breadcrumb (Task 7)
    mat-card-title.tsx               — <MatCardTitle> (Task 5)
    mat-card-title.spec.tsx          — smoke (Task 5)
    mat-card-subtitle.tsx            — <MatCardSubtitle> (Task 5)
    mat-card-subtitle.spec.tsx       — smoke (Task 5)
    mat-card-content.tsx             — <MatCardContent> (Task 5)
    mat-card-content.spec.tsx        — smoke (Task 5)
    mat-card-actions.tsx             — <MatCardActions> (Task 5)
    mat-card-actions.spec.tsx        — smoke (Task 5)
    mat-card-footer.tsx              — <MatCardFooter> (Task 5)
    mat-card-footer.spec.tsx         — smoke (Task 5)
    mat-card-image.tsx               — <MatCardImage> + 4 size variants (Task 6)
    mat-card-image.spec.tsx          — smoke (Task 6)
    mat-card-avatar.tsx              — <MatCardAvatar> (Task 6)
    mat-card-avatar.spec.tsx         — smoke (Task 6)
    mat-card-scenarios.spec.tsx      — upstream scenario port (Task 11)
    public-api.ts                    — consumer-facing re-exports (Task 10)
    index.ts                         — `export * from './public-api'` (Task 1 stub / Task 10 real)
    SYNC.md                          — deviation + stub log (Task 14)
  dialog/
    intrinsic-elements.d.ts          — CREATED in Task 0 (4 dialog tag augmentations)
    mat-dialog-container.tsx         — MODIFIED in Task 0 (host tag)
    mat-dialog-title.tsx             — MODIFIED in Task 0 (attribute)
    mat-dialog-content.tsx           — MODIFIED in Task 0 (host tag)
    mat-dialog-actions.tsx           — MODIFIED in Task 0 (host tag)
    mat-dialog-close.tsx             — MODIFIED in Task 0 (attribute)
    qwik-material-provider.tsx       — MODIFIED in Task 9 (adds matCardConfig)
    qwik-material-provider-card.spec.tsx — new spec (Task 9)
    SYNC.md                          — MODIFIED in Task 14 (stub delta note only, if any)
  scss/
    card/                            — 4 verbatim SCSS files + card-prebuilt.scss (Task 2)
    <any new stubs>                  — added iteratively by Task 2
  package.json                       — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                     — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                         — MODIFIED in Task 12 (card-prebuilt.css import)
    routes/
      index.tsx                      — MODIFIED in Task 12 (Cards section)
      mat-card/                      — 10 new route files (Task 12)

src/qwik-cdk-parity-tests/
  specs/
    material-dialog/                 — MODIFIED in Task 0 (tag-name assertions)
    material-card/                   — 10 new Playwright specs (Task 13)
```

## Per-entry-point state

The `card` entry-point becomes the third entry after `dialog` + `button` in the qwik-material package. All three live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` is the one place they intersect.

## Sync recipe

To re-sync a specific file from upstream `src/material/card/`:

1. Locate the upstream file's counterpart in the `card/SYNC.md` sync table.
2. If "synced" state: `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "ported" state: manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change to the `mat-card-*.tsx` file, update the corresponding `.spec.tsx`.
4. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck)
- 10 dev-app routes at `/mat-card/*` render visibly in browser preview with M3 styling
- 10 Playwright specs pass locally when run against the built dev-app preview
- **Every Playwright spec asserts on the custom-element tag name AT LEAST ONCE** — a regression to `<div>` fails loudly
- 5 dialog Playwright specs (updated in Task 0) also assert on `mat-dialog-container` / `mat-dialog-content` / `mat-dialog-actions` / `h2[mat-dialog-title]` / `button[mat-dialog-close]` tag+attribute selectors — dialog DOM parity locked in
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/card/` returns nothing)
- Zero SSR-leak violations
- SYNC.md populated with all 5 deviations + any new stub delta
- Task 0 (Dialog DOM parity fix) landed before Task 1 — verified in git log

---

## Class count

Zero exported classes on the consumer surface. The port uses interfaces + `component$` factories + `createContextId` tokens exclusively, mirroring the dialog + button ports.

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package. Adding card doesn't require any change to the pipeline — the scripts already glob the entire `src/qwik-material/` tree.
