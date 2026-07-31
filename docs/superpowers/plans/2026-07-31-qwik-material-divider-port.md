# qwik-material Divider Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/divider/` (46-LOC component with empty template + 5 SCSS files + 68-LOC spec) into a `qwik-material/divider` entry-point as a self-closing `<MatDivider>` component with 2 boolean props (`vertical`, `inset`) + 3 aria-* passthroughs + `role="separator"` host attribute. Smallest port in the series — no color type, no mode type, no factory, no useVisibleTask$.

**Architecture:** Single `component$` with no lifecycle. Reads `MAT_DIVIDER_CONFIG` for family-shape parity even though the config is currently `{}` (no fields). Renders a self-closing `<mat-divider>` custom element with class ladder + host attrs; CSS handles the line rendering via `border-top` / `border-right`.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./divider`. New prebuilt CSS entry: `./divider-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-07-31-qwik-material-divider-port-design.md](../specs/2026-07-31-qwik-material-divider-port-design.md). Read §2 (Public API), §3 (Internal architecture), §5 (CSS delivery — no @angular/cdk rewrite needed), §6 (Deviations catalog — 8 items) before starting any port task.
- **Material source reference:** `src/material/divider/`. Every port task names the exact source file(s) it mirrors.
- **DOM parity — custom-element tag:** upstream renders `<mat-divider>` as a real custom element. Port preserves the tag name via a JSX augmentation in `intrinsic-elements.d.ts` typed as `QwikIntrinsicElements['hr']` (closest semantic HTML element). No custom-attribute widening needed.
- **DOM parity — class ladder:** `mat-divider` (static), `mat-divider-vertical` OR `mat-divider-horizontal` (mutually exclusive), `mat-divider-inset` (when inset).
- **DOM parity — host attributes:** `role="separator"` (always), `aria-orientation` mirrors `vertical` prop. Plus 3 aria-* passthroughs.
- **DOM parity — template:** self-closing (`<mat-divider />`) with no children. Upstream has `template: ''`.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. `divider.ts` → `mat-divider.tsx`.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/divider/SYNC.md`.
- **No RxJS.** **No `HttpClient` / XHR.**
- **No exported classes** in `divider/public-api.ts`.
- **SSR safety:** progress-spinner has NO `useVisibleTask$` and no browser globals — the same applies to divider. No `document.` / `window.` / `navigator.` / `getComputedStyle(` / `requestAnimationFrame(`. No `isBrowser` import from `@builder.io/qwik/build`.
- **Commit message scope:** `multiple` for every commit.
- **Pnpm version:** `pnpm@11.7.0`. Don't change.
- **No Bazel changes.** **No upstream CI integration.**
- **Class-list cast pattern (established):** `.filter(Boolean) as string[]`. Qwik's `ClassList` type rejects the mixed `(string | ReadonlyArray<string>)[]` shape.
- **`BooleanInput` + `coerceBooleanProperty` omitted.** Qwik JSX passes booleans directly. Consumer writes `<MatDivider vertical={true}>` or omits.
- **No @angular/cdk SCSS rewrite needed** — grep-confirmed zero `@use '@angular/cdk'` in all 5 divider SCSS files. Second port after Icon to skip the rewrite. If Task 2's reconciliation loop surfaces a hidden `cdk.*` call, apply the established rewrite pattern; expected outcome is zero rewrite.
- **Spec files use smoke variant:** `createDOM(<component$/>)` hangs the Qwik optimizer worker under vitest. Divider `.spec.tsx` files use module-import assertions. Real DOM assertions live in Task 8's Playwright parity specs.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `divider` entry-point into the existing qwik-material package

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from earlier ports).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/divider/intrinsic-elements.d.ts`
- Create: `src/qwik-material/divider/index.ts` (empty stub — Task 6 replaces)

**Interfaces:**
- Consumes: existing package scaffolding.
- Produces: `pnpm -C src/qwik-material build` still succeeds (existing 8 prebuilt CSS files still emit; no divider CSS yet). Type resolution for `@angular-community/qwik-material/divider` returns an empty module. `<mat-divider>` is a legal JSX element.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./divider` after `./progress-spinner`, and `./divider-prebuilt.css` after `./progress-spinner-prebuilt.css`. Final relevant block:

```json
"./progress-spinner": {
  "qwik": "./progress-spinner/index.ts",
  "types": "./dist/progress-spinner/index.d.ts",
  "import": "./dist/progress-spinner/index.js"
},
"./divider": {
  "qwik": "./divider/index.ts",
  "types": "./dist/divider/index.d.ts",
  "import": "./dist/divider/index.js"
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
"./scss/*": "./scss/*"
```

- [ ] **Step 2: Extend `src/qwik-material/vite.config.ts` `entries` array + `sassEntries` list**

Read the file. `entries` currently reads `['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar', 'progress-spinner']`. Append `'divider'`:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar', 'progress-spinner', 'divider'];
```

`sassEntries` currently ends with `['scss/progress-spinner/progress-spinner-prebuilt.scss', 'dist/progress-spinner-prebuilt.css']`. Append the divider pair:

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
];
```

- [ ] **Step 3: Create `src/qwik-material/divider/intrinsic-elements.d.ts`**

The `<mat-divider>` custom element is used as a semantic separator — the closest HTML native is `<hr>`. No custom camelCase attributes (unlike Icon's `fontIcon` or Progress Bar's `mode`), so no `& {...}` widening needed. Contents:

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Divider's custom-element tag
 * name. Upstream renders <mat-divider> as an actual custom element; external
 * CMS styles may target the tag directly (not just the .mat-divider class).
 * Typed as QwikIntrinsicElements['hr'] because <hr> is the closest semantic
 * HTML element (an <hr> IS a separator in HTML). See design spec
 * docs/superpowers/specs/2026-07-31-qwik-material-divider-port-design.md
 * §3.4 + §6 deviation #6.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-divider': QwikIntrinsicElements['hr'];
    }
  }
}
```

- [ ] **Step 4: Create `src/qwik-material/divider/index.ts`** (empty stub)

Contents:

```ts
export {};
```

Task 6 replaces this with `export * from './public-api';`.

- [ ] **Step 5: Run the build to confirm the stub compiles**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. The dts plugin generates `dist/divider/index.d.ts` with `export {};`. The Sass pipeline logs a `skipping scss/divider/divider-prebuilt.scss — not yet present.` warning (ENOENT-tolerant guard); this is EXPECTED — Task 2 creates the SCSS file. Confirm the existing 8 prebuilt CSS files still emit:

```bash
ls src/qwik-material/dist/*.css
```

Expected: `dialog-prebuilt.css`, `button-prebuilt.css`, `card-prebuilt.css`, `toolbar-prebuilt.css`, `badge-prebuilt.css`, `icon-prebuilt.css`, `progress-bar-prebuilt.css`, `progress-spinner-prebuilt.css`. NOT `divider-prebuilt.css` yet.

`ls src/qwik-material/dist/divider/`:

```bash
ls src/qwik-material/dist/divider/
```

Expected: `index.d.ts`, `index.js`, `index.js.map`. `dist/divider/index.d.ts` contents: `export {};`.

- [ ] **Step 6: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. The `intrinsic-elements.d.ts` from Step 3 makes `<mat-divider>` a legal JSX element.

- [ ] **Step 7: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/divider/intrinsic-elements.d.ts \
  src/qwik-material/divider/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): wire qwik-material/divider entry-point + <mat-divider> JSX augmentation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SCSS + prebuilt CSS

### Task 2: Copy Divider SCSS + iterative `:root` variable-name verification + prebuilt CSS

**Reference source:** `src/material/divider/*.scss` (5 files, ~152 total LOC). Confirmed via `grep '@angular/cdk' src/material/divider/*.scss`: zero references. NO `@use '../cdk-stub' as cdk` rewrite needed for divider — same "no rewrite" case as Icon Task 2.

**Files:**
- Create: `src/qwik-material/scss/divider/divider.scss` (byte-identical copy of upstream)
- Create: `src/qwik-material/scss/divider/_divider-theme.scss` (byte-identical)
- Create: `src/qwik-material/scss/divider/_divider-offset.scss` (byte-identical)
- Create: `src/qwik-material/scss/divider/_m2-divider.scss` (byte-identical)
- Create: `src/qwik-material/scss/divider/_m3-divider.scss` (byte-identical)
- Create: `src/qwik-material/scss/divider/divider-prebuilt.scss` (new — `@use` + `:root` M3 defaults)

**Interfaces:**
- Consumes: existing SCSS ecosystem — sass compiler picks up `scss/divider/divider-prebuilt.scss` from Task 1's vite.config.ts change.
- Produces: `dist/divider-prebuilt.css` after `pnpm -C src/qwik-material build`. Every `--mat-divider-*` and `--mat-sys-*` reference emitted by the compiled CSS has a matching `:root` declaration.

- [ ] **Step 1: Byte-identical copy of the 5 upstream SCSS files**

```bash
cp src/material/divider/divider.scss          src/qwik-material/scss/divider/divider.scss
cp src/material/divider/_divider-theme.scss   src/qwik-material/scss/divider/_divider-theme.scss
cp src/material/divider/_divider-offset.scss  src/qwik-material/scss/divider/_divider-offset.scss
cp src/material/divider/_m2-divider.scss      src/qwik-material/scss/divider/_m2-divider.scss
cp src/material/divider/_m3-divider.scss      src/qwik-material/scss/divider/_m3-divider.scss
```

Verify byte-identical:

```bash
diff -q src/material/divider/divider.scss         src/qwik-material/scss/divider/divider.scss
diff -q src/material/divider/_divider-theme.scss  src/qwik-material/scss/divider/_divider-theme.scss
diff -q src/material/divider/_divider-offset.scss src/qwik-material/scss/divider/_divider-offset.scss
diff -q src/material/divider/_m2-divider.scss     src/qwik-material/scss/divider/_m2-divider.scss
diff -q src/material/divider/_m3-divider.scss     src/qwik-material/scss/divider/_m3-divider.scss
```

Expected: no output on any (empty stdout for each).

- [ ] **Step 2: Sanity-check the SCSS chain has zero `@angular/cdk` references**

```bash
grep -RnE "^@use '@angular/cdk'" src/qwik-material/scss/divider/
```

Expected: no output. This confirms no `cdk-stub` rewrite is needed. Different from badge/toolbar/dialog/progress-bar/progress-spinner SCSS which DID reference `@angular/cdk`. Note this outcome verbatim in the SYNC.md sync-state row in Task 9.

- [ ] **Step 3: Create the initial `src/qwik-material/scss/divider/divider-prebuilt.scss`**

Start with a candidate `:root` block for the tokens `_m3-divider.scss` references. Contents (candidate — Step 5 verifies + expands as needed):

```scss
// Divider prebuilt CSS. Wraps the port's divider.scss with :root defaults
// for every --mat-divider-* variable it emits. See design spec §5.

@use './divider';

:root {
  // M3 sys-color token referenced by _m3-divider.scss via slot(divider-color).
  --mat-sys-outline-variant: #cac4d0;

  // Divider-specific tokens (emitted by _m3-divider.scss's base + color).
  --mat-divider-width: 1px;
  --mat-divider-color: var(--mat-sys-outline-variant, #cac4d0);
}
```

Note: `@use './divider';` MUST come before the `:root` block (Sass requires `@use` first). The candidate above places it correctly — do NOT reorder.

- [ ] **Step 4: Run the build to emit `dist/divider-prebuilt.css`**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. `dist/divider-prebuilt.css` present:

```bash
ls src/qwik-material/dist/divider-prebuilt.css
```

Expected: file listed.

- [ ] **Step 5: Grep the emitted CSS for every `--mat-*` reference and reconcile against the `:root` block**

The KEY step. The candidate is a plan-author's guess; the compiled CSS is the source of truth (Icon Task 2 precedent — plan said `--mat-icon-icon-color` but real emitted was `--mat-icon-color`; Progress Bar Task 2 discovered 2 vars beyond candidate; Progress Spinner Task 2 removed 1 phantom).

```bash
# What the compiled CSS actually references
grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/divider-prebuilt.css | sort -u
```

Compare to what the `:root` block declares:

```bash
grep -oE '^\s*--mat-[a-z-]+' src/qwik-material/scss/divider/divider-prebuilt.scss | sort -u
```

For every `var(--mat-*)` reference NOT covered by a `:root` line:
- Look up the token name in `src/material/core/tokens/m3/_md-sys-color.scss` (for `--mat-sys-*` refs) or `_m3-divider.scss` (for `--mat-divider-*` refs).
- Add a `:root` declaration with the correct M3 default. Prefer `var(--mat-sys-<name>, <literal-fallback>)` wrap; if no sys equivalent, use the literal value from `_m3-divider.scss`.

For every `:root` declaration NOT actually referenced in the compiled CSS: remove it (phantom variable).

Rebuild after every edit until the diff is empty:

```bash
diff \
  <(grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/divider-prebuilt.css | sed 's/var(//' | sort -u) \
  <(grep -oE '^[[:space:]]*--mat-[a-z-]+' src/qwik-material/scss/divider/divider-prebuilt.scss | sed 's/^[[:space:]]*//' | sort -u)
```

Expected: no output.

- [ ] **Step 6: Confirm the `.mat-divider` structural rules survived**

```bash
grep -cE '^\.mat-divider' src/qwik-material/dist/divider-prebuilt.css
```

Expected: at least `1` (top-level `.mat-divider` block + potentially more via `.mat-divider.mat-divider-vertical`, `.mat-divider.mat-divider-inset`, `[dir='rtl'] .mat-divider.mat-divider-inset`, etc.). Higher is fine.

- [ ] **Step 7: Confirm existing 8 prebuilt CSS files still emit**

```bash
ls src/qwik-material/dist/*.css
```

Expected: 9 files (dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider).

- [ ] **Step 8: Commit**

```bash
git add \
  src/qwik-material/scss/divider/divider.scss \
  src/qwik-material/scss/divider/_divider-theme.scss \
  src/qwik-material/scss/divider/_divider-offset.scss \
  src/qwik-material/scss/divider/_m2-divider.scss \
  src/qwik-material/scss/divider/_m3-divider.scss \
  src/qwik-material/scss/divider/divider-prebuilt.scss
git commit -m "$(cat <<'EOF'
feat(multiple): copy Divider SCSS chain + divider-prebuilt.css defaults

5 upstream .scss files copied byte-identical (divider.scss + _divider-theme,
_divider-offset, _m2-divider, _m3-divider). No @use '@angular/cdk' rewrite
needed — divider.scss (and none of the partials) reference the cdk
namespace (unlike badge/toolbar/dialog/progress-bar/progress-spinner ports).
Second port after Icon to skip the rewrite entirely.

divider-prebuilt.scss adds :root defaults for every --mat-divider-* and
--mat-sys-* variable the compiled CSS references. Verified by grepping
dist/divider-prebuilt.css and reconciling against the :root block until
the diff is empty.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Config token

### Task 3: `MatDividerConfig` + `MAT_DIVIDER_CONFIG` context token

**Reference source:** design spec §2.1. Note: upstream has NO `MatDividerDefaultOptions` — divider is entirely input-driven, no configurable defaults. The empty `MatDividerConfig = {}` is a family-shape parity token for future extensibility.

**Files:**
- Create: `src/qwik-material/divider/divider-config.ts`
- Create: `src/qwik-material/divider/divider-config.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface MatDividerConfig {}` (empty)
  - `const MAT_DIVIDER_CONFIG: ContextId<MatDividerConfig>` with id `'qwik-material/divider-config'`

- [ ] **Step 1: Create `src/qwik-material/divider/divider-config.ts`**

Contents:

```ts
import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every <MatDivider> in a subtree. Consumers provide this
 * via <QwikMaterialProvider matDividerConfig={...}>. Currently empty — the
 * divider has no consumer-configurable defaults today. Kept for family shape
 * parity with the other qwik-material components and to allow future fields
 * without an API break.
 */
export interface MatDividerConfig {}

/**
 * Context id used by <MatDivider> to read config. The id string is exposed
 * publicly and MUST remain stable across releases — consumers may inject it
 * directly in advanced scenarios.
 */
export const MAT_DIVIDER_CONFIG = createContextId<MatDividerConfig>(
  'qwik-material/divider-config',
);
```

- [ ] **Step 2: Create `src/qwik-material/divider/divider-config.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import {MAT_DIVIDER_CONFIG, type MatDividerConfig} from './divider-config';

describe('MAT_DIVIDER_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_DIVIDER_CONFIG.id).toBe('qwik-material/divider-config');
  });

  it('MatDividerConfig accepts an empty object', () => {
    const cfg: MatDividerConfig = {};
    expect(cfg).toBeDefined();
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test divider/divider-config
```

Expected: 2/2 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/divider/divider-config.ts src/qwik-material/divider/divider-config.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatDividerConfig + MAT_DIVIDER_CONFIG context token

MatDividerConfig is intentionally empty — the divider has no consumer-
configurable defaults today. Kept as a token for family shape parity with
the other qwik-material components and to allow future fields without an
API break.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Component

### Task 4: `<MatDivider>` component

**Reference source:** `src/material/divider/divider.ts` (46 LOC — MatDivider component with 2 boolean props + host bindings; empty template).

**Files:**
- Create: `src/qwik-material/divider/mat-divider.tsx`
- Create: `src/qwik-material/divider/mat-divider.spec.tsx`

**Interfaces:**
- Consumes:
  - `MAT_DIVIDER_CONFIG` + `MatDividerConfig` from Task 3
- Produces:
  - `interface MatDividerProps` — 7 optional fields per spec §2.2
  - `const MatDivider: Component<MatDividerProps>`

- [ ] **Step 1: Create `src/qwik-material/divider/mat-divider.tsx`**

Contents (mirrors the shape of `src/qwik-material/icon/mat-icon.tsx` — stateless component$, prop resolution, class ladder via `.filter(Boolean) as string[]`):

```tsx
import {component$, useContext} from '@builder.io/qwik';
import {MAT_DIVIDER_CONFIG, type MatDividerConfig} from './divider-config';

/**
 * Props for <MatDivider>. Renders a self-closing <mat-divider> custom
 * element with role="separator" and aria-orientation reflecting the
 * `vertical` prop. See design spec §3.1 for rendered DOM shape.
 */
export interface MatDividerProps {
  /** Renders as a vertical divider (right border) instead of horizontal (top border). */
  vertical?: boolean;
  /** Applies inset margin (80px start-side, RTL-aware). */
  inset?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatDividerConfig = {};

export const MatDivider = component$<MatDividerProps>(props => {
  // Read config for family-shape consistency, even though it currently has
  // no fields to resolve. The read pattern is established so future config
  // fields plug in without a component-file rewrite.
  useContext(MAT_DIVIDER_CONFIG, DEFAULTS);

  const vertical = props.vertical ?? false;
  const inset = props.inset ?? false;

  const classes = [
    'mat-divider',
    vertical ? 'mat-divider-vertical' : 'mat-divider-horizontal',
    inset && 'mat-divider-inset',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-divider
      id={props.id}
      class={classes}
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    />
  );
});
```

Notes for the implementer:
- **Self-closing `<mat-divider />`** — upstream template is `''` (empty). No `<Slot />` needed.
- **`useContext(MAT_DIVIDER_CONFIG, DEFAULTS)` with a default** — matches the established pattern from Icon (`useContext(MAT_ICON_CONFIG, DEFAULTS)`) and the final-review fix that Progress Bar + Progress Spinner adopted (`useAnimationsDisabled()` helper with default). A bare `useContext(MAT_DIVIDER_CONFIG)` without a default would throw `QError_notFoundContext` (Code 13) when consumers render `<MatDivider>` outside a `<QwikMaterialProvider>` ancestor.
- **`mat-divider-horizontal` vs `mat-divider-vertical` are mutually exclusive** in the class ladder ternary — matches upstream's `[class.mat-divider-horizontal]: '!vertical'` binding exactly.
- **No `mode` attribute** — divider emits no custom camelCase attributes, so Task 1's intrinsic-elements typing (`QwikIntrinsicElements['hr']`) doesn't need widening.

- [ ] **Step 2: Create `src/qwik-material/divider/mat-divider.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatDivider} from './mat-divider';

describe('MatDivider (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatDivider).toBeDefined();
    expect(typeof MatDivider).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test divider/mat-divider
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. Task 1's `intrinsic-elements.d.ts` makes `<mat-divider>` a legal JSX element.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/divider/mat-divider.tsx
```

Expected: no matches.

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/divider/mat-divider.tsx
```

Expected: no matches (`isBrowser` import banned per Global Constraints).

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/divider/mat-divider.tsx src/qwik-material/divider/mat-divider.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatDivider component (self-closing separator with vertical/inset booleans)

Single stateless component$ with no lifecycle. Reads MAT_DIVIDER_CONFIG
with a default (safe outside <QwikMaterialProvider>). Renders a self-
closing <mat-divider> with class ladder + role="separator" + aria-*
passthroughs. CSS handles the actual line rendering via border-top /
border-right.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Provider extension

### Task 5: Extend `<QwikMaterialProvider>` with `matDividerConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (currently ships 9 `useContextProvider` calls after Progress Spinner). Adding divider makes it 10.

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-divider.spec.tsx`

**Interfaces:**
- Consumes: `MatDividerConfig` + `MAT_DIVIDER_CONFIG` from Task 3.
- Produces: an extended `QwikMaterialProviderProps.matDividerConfig?: MatDividerConfig` field + a 10th `useContextProvider(MAT_DIVIDER_CONFIG, ...)` call. All 9 pre-existing provider calls unchanged.

- [ ] **Step 1: Extend the imports at the top of `qwik-material-provider.tsx`**

Read the file's current import block. Add two import lines after the progress-spinner import block:

```tsx
import type {MatDividerConfig} from '../divider/divider-config';
import {MAT_DIVIDER_CONFIG} from '../divider/divider-config';
```

- [ ] **Step 2: Extend `QwikMaterialProviderProps` with the `matDividerConfig?` field**

Append to the interface body (after `matProgressSpinnerConfig`), with a doc comment:

```tsx
  /** Defaults applied to every MatDivider in this subtree. */
  matDividerConfig?: MatDividerConfig;
```

- [ ] **Step 3: Add the 10th `useContextProvider` call at the end of the component body**

Append AFTER the `useContextProvider(MAT_PROGRESS_SPINNER_CONFIG, props.matProgressSpinnerConfig ?? {});` line and BEFORE the `return <Slot />;`:

```tsx
  // MatDividerConfig is a plain object (currently empty) — no noSerialize needed.
  // Dividers outside a provider get the DEFAULTS declared in MatDivider; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_DIVIDER_CONFIG, props.matDividerConfig ?? {});
```

Verify all 9 pre-existing `useContextProvider` calls are untouched (in order: MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_ANIMATIONS_DISABLED, MAT_BUTTON_CONFIG, MAT_CARD_CONFIG, MAT_BADGE_CONFIG, MAT_ICON_CONFIG, MAT_PROGRESS_BAR_CONFIG, MAT_PROGRESS_SPINNER_CONFIG). Do NOT change their order or arguments.

- [ ] **Step 4: Create the provider-divider smoke spec `qwik-material-provider-divider.spec.tsx`**

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatDividerConfig} from '../divider/divider-config';

describe('QwikMaterialProvider — matDividerConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts an empty matDividerConfig', () => {
    const cfg: MatDividerConfig = {};
    const props: QwikMaterialProviderProps = {matDividerConfig: cfg};
    expect(props.matDividerConfig).toBeDefined();
  });

  it('QwikMaterialProviderProps.matDividerConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matDividerConfig).toBeUndefined();
  });
});
```

- [ ] **Step 5: Run the provider spec**

```bash
pnpm -C src/qwik-material test qwik-material-provider-divider
```

Expected: 3/3 passing, exit 0.

- [ ] **Step 6: Run the full qwik-material vitest to confirm no regression**

```bash
pnpm -C src/qwik-material test
```

Expected: all files pass; total count = pre-Task-5 total + 3 passing.

- [ ] **Step 7: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add \
  src/qwik-material/dialog/qwik-material-provider.tsx \
  src/qwik-material/dialog/qwik-material-provider-divider.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): extend QwikMaterialProvider with matDividerConfig

Adds the 10th useContextProvider call (after MAT_PROGRESS_SPINNER_CONFIG).
All 9 pre-existing provider calls preserved unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Public API

### Task 6: `divider/public-api.ts` + `divider/index.ts` + build verification

**Reference source:** design spec §2.4.

**Files:**
- Create: `src/qwik-material/divider/public-api.ts`
- Modify: `src/qwik-material/divider/index.ts` (was empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Tasks 3, 4, 5.
- Produces: the exact public export surface consumers see when they import from `@angular-community/qwik-material/divider`.

- [ ] **Step 1: Create `src/qwik-material/divider/public-api.ts`**

Contents (matches design spec §2.4 verbatim):

```ts
// Public API for @angular-community/qwik-material/divider.
// See docs/superpowers/specs/2026-07-31-qwik-material-divider-port-design.md §2.

export type {MatDividerConfig} from './divider-config';
export {MAT_DIVIDER_CONFIG} from './divider-config';
export {MatDivider, type MatDividerProps} from './mat-divider';
```

- [ ] **Step 2: Replace the empty stub in `src/qwik-material/divider/index.ts`**

Replace the entire file (was `export {};` from Task 1) with:

```ts
export * from './public-api';
```

- [ ] **Step 3: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. No Rollup `Illegal reassignment of import` errors (divider has no module-level mutable state — the component is pure).

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify the emitted d.ts export surface**

```bash
grep -nE "^export " src/qwik-material/dist/divider/public-api.d.ts
```

Expected: 3 export lines covering `MatDividerConfig` (type), `MAT_DIVIDER_CONFIG` (value), and `MatDivider` + `MatDividerProps` type.

Confirm no leaked classes:

```bash
grep -nE "^export declare class" src/qwik-material/dist/divider/public-api.d.ts
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/divider/public-api.ts src/qwik-material/divider/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): finalize qwik-material/divider public API

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Vitest scenario port

### Task 7: Vitest scenario port from `src/material/divider/divider.spec.ts`

**Reference source:** `src/material/divider/divider.spec.ts` (68 LOC, ~11 upstream `it()` blocks). Most tests exercise Angular's `@Input()` field-shape and `BooleanInput` coercion; port covers the rest via Playwright.

**Files:**
- Create: `src/qwik-material/divider/mat-divider-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 6.
- Produces: consolidated scenario coverage documenting upstream test intent.

- [ ] **Step 1: Write the scenario spec**

Contents:

```tsx
/**
 * MatDivider scenario port from src/material/divider/divider.spec.ts.
 *
 * Upstream has ~11 `it()` blocks — mostly host classes/attrs + BooleanInput
 * coercion. Restructured:
 *
 *   - Live sanity tests (5): typeof + MAT_DIVIDER_CONFIG.id + empty config +
 *     props shape.
 *   - describe.skip DOM-rendered (8): host classes/attrs + aria-* forwarding.
 *     Deferred to Playwright Task 8.
 *   - describe.skip Angular-only (3): BooleanInput coercion, NgModule
 *     declaration, @Input field-shape. Deferred forever per design spec §6
 *     deviations.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-divider/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_DIVIDER_CONFIG,
  MatDivider,
  type MatDividerConfig,
  type MatDividerProps,
} from './public-api';

describe('MatDivider — sanity', () => {
  it('MatDivider is exported', () => {
    expect(MatDivider).toBeDefined();
    expect(typeof MatDivider).toBe('function');
  });

  it('MAT_DIVIDER_CONFIG carries the expected context id', () => {
    expect(MAT_DIVIDER_CONFIG.id).toBe('qwik-material/divider-config');
  });

  it('MatDividerConfig accepts an empty object', () => {
    const cfg: MatDividerConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatDividerProps accepts the boolean surface', () => {
    const p: MatDividerProps = {vertical: true, inset: true};
    expect(p.vertical).toBe(true);
    expect(p.inset).toBe(true);
  });

  it('MatDividerProps accepts aria + class + id surface', () => {
    const p: MatDividerProps = {
      'aria-label': 'End of comments',
      'aria-labelledby': 'section-heading',
      'aria-describedby': 'section-desc',
      class: 'my-custom-divider',
      id: 'section-divider',
    };
    expect(p['aria-label']).toBe('End of comments');
  });
});

describe.skip('MatDivider DOM-rendered scenarios — deferred to Playwright Task 8', () => {
  it('should apply .mat-divider class', () => {});
  it('should apply .mat-divider-horizontal class when vertical is false (default)', () => {});
  it('should apply .mat-divider-vertical class when vertical is true', () => {});
  it('should apply .mat-divider-inset class when inset is true', () => {});
  it('should emit role="separator"', () => {});
  it('should emit aria-orientation="horizontal" (default)', () => {});
  it('should emit aria-orientation="vertical" when vertical is true', () => {});
  it('should forward aria-label / aria-labelledby / aria-describedby', () => {});
});

describe.skip('MatDivider — Angular-only tests', () => {
  it('should coerce BooleanInput attribute values via coerceBooleanProperty', () => {
    // Omitted — Qwik JSX passes booleans directly (§6 deviation #2).
  });
  it('should be declared in MatDividerModule', () => {
    // NgModule concept omitted (§6 deviation #8's NgModule removal).
  });
  it('should expose vertical/inset as Angular @Input() fields', () => {
    // Ports as regular props on MatDividerProps interface.
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
pnpm -C src/qwik-material test divider/mat-divider-scenarios
```

Expected: 5 passing + 11 skipped, exit 0.

- [ ] **Step 3: Run the full qwik-material suite for regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-7 total + 5 passing + 11 skipped, zero failures.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/divider/mat-divider-scenarios.spec.tsx
git commit -m "$(cat <<'EOF'
test(multiple): port MatDivider scenarios from upstream divider.spec.ts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Dev-app + Playwright parity

### Task 8: 6 mat-divider dev-app routes + index tile + root.tsx CSS import + 6 Playwright parity specs

**Reference source:** existing dev-app + Playwright patterns from Progress Spinner port at `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/` and `src/qwik-cdk-parity-tests/specs/material-progress-spinner/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add divider-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Dividers" section with 6 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-divider/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-divider/vertical/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-divider/inset/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-divider/vertical-inset/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-divider/aria-labeled/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-divider/list-context/index.tsx`
- Create: `src/qwik-cdk-parity-tests/specs/material-divider/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-divider/vertical.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-divider/inset.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-divider/vertical-inset.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-divider/aria-labeled.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-divider/list-context.spec.ts`

**Interfaces:**
- Consumes: `@angular-community/qwik-material/divider` (Task 6).
- Produces: 6 dev-app routes + 6 Playwright specs asserting host tag + classes + attrs.

- [ ] **Step 1: Add the divider-prebuilt.css import to `src/qwik-cdk-dev-app/src/root.tsx`**

Read the current file. Append the divider CSS import after the progress-spinner one:

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
```

- [ ] **Step 2: Add a "Dividers" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert after the existing "Progress spinners" section:

```tsx
<section>
  <h2>Dividers</h2>
  <ul>
    <li><a href="/mat-divider/basic/">basic</a></li>
    <li><a href="/mat-divider/vertical/">vertical</a></li>
    <li><a href="/mat-divider/inset/">inset</a></li>
    <li><a href="/mat-divider/vertical-inset/">vertical-inset</a></li>
    <li><a href="/mat-divider/aria-labeled/">aria-labeled</a></li>
    <li><a href="/mat-divider/list-context/">list-context</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <p>Section 1</p>
    <MatDivider />
    <p>Section 2</p>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `vertical/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <div style={{display: 'flex', alignItems: 'stretch', height: '80px'}}>
      <span>Left</span>
      <MatDivider vertical />
      <span>Right</span>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `inset/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <p>Section 1</p>
    <MatDivider inset />
    <p>Section 2</p>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create `vertical-inset/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <div style={{display: 'flex', alignItems: 'stretch', height: '80px'}}>
      <span>Left</span>
      <MatDivider vertical inset />
      <span>Right</span>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `aria-labeled/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <p>Comments</p>
    <MatDivider aria-label="End of comments" />
    <p>Suggested actions</p>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create `list-context/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <div>Item A</div>
    <MatDivider />
    <div>Item B</div>
    <MatDivider />
    <div>Item C</div>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Confirm client + SSR builds succeed. Verify 6 mat-divider routes in the manifest:

```bash
grep -oE 'mat-divider/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `6`.

List them explicitly:

```bash
grep -oE 'mat-divider/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u
```

Expected:
```
mat-divider/aria-labeled
mat-divider/basic
mat-divider/inset
mat-divider/list-context
mat-divider/vertical
mat-divider/vertical-inset
```

- [ ] **Step 10: Create `basic.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/basic — <mat-divider> with .mat-divider + .mat-divider-horizontal classes, role="separator", aria-orientation="horizontal"', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-divider/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const divider = page.locator('mat-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveClass(/mat-divider(\s|$)/);
  await expect(divider).toHaveClass(/mat-divider-horizontal/);
  await expect(divider).not.toHaveClass(/mat-divider-vertical/);
  await expect(divider).not.toHaveClass(/mat-divider-inset/);
  await expect(divider).toHaveAttribute('role', 'separator');
  await expect(divider).toHaveAttribute('aria-orientation', 'horizontal');

  // Self-closing — no children inside the <mat-divider> element.
  await expect(divider).toHaveText('');
});
```

- [ ] **Step 11: Create `vertical.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/vertical — .mat-divider-vertical class + aria-orientation="vertical"', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-divider/vertical/`);
  await page.waitForSelector('[data-scenario-ready]');

  const divider = page.locator('mat-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveClass(/mat-divider(\s|$)/);
  await expect(divider).toHaveClass(/mat-divider-vertical/);
  await expect(divider).not.toHaveClass(/mat-divider-horizontal/);
  await expect(divider).toHaveAttribute('role', 'separator');
  await expect(divider).toHaveAttribute('aria-orientation', 'vertical');
});
```

- [ ] **Step 12: Create `inset.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/inset — .mat-divider-inset class alongside horizontal default', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-divider/inset/`);
  await page.waitForSelector('[data-scenario-ready]');

  const divider = page.locator('mat-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveClass(/mat-divider(\s|$)/);
  await expect(divider).toHaveClass(/mat-divider-horizontal/);
  await expect(divider).toHaveClass(/mat-divider-inset/);
  await expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
});
```

- [ ] **Step 13: Create `vertical-inset.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/vertical-inset — both .mat-divider-vertical AND .mat-divider-inset classes active', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-divider/vertical-inset/`);
  await page.waitForSelector('[data-scenario-ready]');

  const divider = page.locator('mat-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveClass(/mat-divider(\s|$)/);
  await expect(divider).toHaveClass(/mat-divider-vertical/);
  await expect(divider).toHaveClass(/mat-divider-inset/);
  await expect(divider).not.toHaveClass(/mat-divider-horizontal/);
  await expect(divider).toHaveAttribute('aria-orientation', 'vertical');
});
```

- [ ] **Step 14: Create `aria-labeled.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/aria-labeled — <mat-divider> carries aria-label alongside role="separator"', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-divider/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const divider = page.locator('mat-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveAttribute('role', 'separator');
  await expect(divider).toHaveAttribute('aria-label', 'End of comments');
  await expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
});
```

- [ ] **Step 15: Create `list-context.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/list-context — 2 dividers between 3 items, each with correct role', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-divider/list-context/`);
  await page.waitForSelector('[data-scenario-ready]');

  const dividers = page.locator('mat-divider');
  await expect(dividers).toHaveCount(2);

  await expect(dividers.nth(0)).toHaveAttribute('role', 'separator');
  await expect(dividers.nth(0)).toHaveClass(/mat-divider-horizontal/);
  await expect(dividers.nth(1)).toHaveAttribute('role', 'separator');
  await expect(dividers.nth(1)).toHaveClass(/mat-divider-horizontal/);
});
```

- [ ] **Step 16: Do NOT run Playwright**

Chromium install + preview server are human-managed steps. Skip execution — Task 9 documents the manual verification step.

- [ ] **Step 17: Commit**

```bash
git add \
  src/qwik-cdk-dev-app/src/root.tsx \
  src/qwik-cdk-dev-app/src/routes/index.tsx \
  src/qwik-cdk-dev-app/src/routes/mat-divider/ \
  src/qwik-cdk-parity-tests/specs/material-divider/
git commit -m "$(cat <<'EOF'
feat(multiple): mat-divider dev-app routes (6) + Playwright parity specs (6)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Finalisation

### Task 9: SYNC.md + pipeline verification

**Reference source:** `src/qwik-material/progress-spinner/SYNC.md` (existing SYNC pattern from the just-completed Progress Spinner port).

**Files:**
- Create: `src/qwik-material/divider/SYNC.md`

**Interfaces:**
- Consumes: everything from Tasks 1-8.
- Produces: `SYNC.md` documenting the divider port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/divider/SYNC.md`**

Contents:

```markdown
# qwik-material/divider sync log

Tracks the sync state between this port and `src/material/divider/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`, and
`src/qwik-material/progress-spinner/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `divider/mat-divider.tsx` | `src/material/divider/divider.ts` (MatDivider component) | ported | Directive→component$; JSX self-closing element; BooleanInput coercion omitted (Qwik JSX passes booleans directly); reads MAT_DIVIDER_CONFIG with default for SSR safety |
| `divider/divider-config.ts` | (no upstream equivalent) | new | MatDividerConfig = {} interface + MAT_DIVIDER_CONFIG context id; folded into QwikMaterialProvider.matDividerConfig for family shape parity |
| `scss/divider/divider.scss` | `src/material/divider/divider.scss` | synced | byte-identical copy — no `@use '@angular/cdk'` present, unlike badge/toolbar/dialog/progress-bar/progress-spinner ports which needed the cdk-stub rewrite. Second port after Icon to skip the rewrite. |
| `scss/divider/_divider-theme.scss` | `src/material/divider/_divider-theme.scss` | synced | byte-identical copy |
| `scss/divider/_divider-offset.scss` | `src/material/divider/_divider-offset.scss` | synced | byte-identical copy |
| `scss/divider/_m2-divider.scss` | `src/material/divider/_m2-divider.scss` | synced | byte-identical copy |
| `scss/divider/_m3-divider.scss` | `src/material/divider/_m3-divider.scss` | synced | byte-identical copy |
| `scss/divider/divider-prebuilt.scss` | (qwik-material-specific) | new | @use divider.scss + M3 :root defaults matching emitted --mat-divider-* references |

## Removed upstream files

- `divider-module.ts` → Qwik has no module concept
- `testing/` (MatDividerHarness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (§2.4)
- `divider.spec.ts` → ported to `mat-divider-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-divider>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation. Typed as `QwikIntrinsicElements['hr']` (closest semantic HTML element — an `<hr>` IS a separator in HTML). No custom-attribute widening needed.
2. **`BooleanInput` + `coerceBooleanProperty` omitted.** Qwik JSX passes booleans directly; consumer writes `<MatDivider vertical={true}>` or omits the prop. No attribute-string coercion needed.
3. **`MAT_DIVIDER_CONFIG` folded into `QwikMaterialProvider.matDividerConfig`.** 10th `useContextProvider` call. Config is currently `{}` (no fields) — kept for family shape parity + future extensibility.
4. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatDividerProps` and forwarded to `<mat-divider>`. Decorative default (`role="separator"` + `aria-orientation`) preserved; consumers may add labels.
5. **No `template: ''` explicit declaration.** Qwik's self-closing `<mat-divider />` renders an empty element naturally — matches upstream's empty template.
6. **`intrinsic-elements.d.ts` types `<mat-divider>` as `QwikIntrinsicElements['hr']`.** Semantic HTML closest match. No `& {mode?: string}`-style widening needed since divider emits no custom camelCase attributes.
7. **No `useVisibleTask$` / no lifecycle work.** Pure `(props, context) → JSX` component. No id counter, no signals, no event listeners.
8. **5 SCSS files copied byte-identical.** No `@angular/cdk` reference in any file (grep-confirmed) — no cdk-stub rewrite needed. Second port after Icon to skip the rewrite.

## Stub inventory delta

No new stubs — the divider SCSS chain does NOT reference `@angular/cdk` (unlike badge/toolbar/dialog/progress-bar/progress-spinner port SCSS which did). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/divider/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider.
```

- [ ] **Step 2: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** all 9 prebuilt CSS files emit; JS + d.ts under `dist/{dialog,button,card,toolbar,badge,icon,progress-bar,progress-spinner,divider}/`.
- **Vitest:** all specs pass across 9 entry-points.
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 3: Verify the class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/divider/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 4: Verify no SSR globals in the divider entry-point**

```bash
grep -RnE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/divider/ | grep -v '\.spec\.'
```

Expected: no output. (Divider has no `useVisibleTask$` and no browser globals — it's pure computation from props.)

- [ ] **Step 5: Verify no `isBrowser` import**

```bash
grep -RnE "from '@builder\.io/qwik/build'" src/qwik-material/divider/
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/divider/SYNC.md
git commit -m "$(cat <<'EOF'
docs(multiple): finalize qwik-material/divider SYNC.md + pipeline verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Layout

```
src/qwik-material/
  divider/
    divider-config.ts              — MatDividerConfig + MAT_DIVIDER_CONFIG (Task 3)
    divider-config.spec.ts
    mat-divider.tsx                — <MatDivider> (Task 4)
    mat-divider.spec.tsx           — smoke (Task 4)
    mat-divider-scenarios.spec.tsx — upstream scenario port (Task 7)
    intrinsic-elements.d.ts        — <mat-divider> JSX augmentation (Task 1)
    public-api.ts                  — consumer-facing re-exports (Task 6)
    index.ts                       — `export * from './public-api'` (Task 1 stub / Task 6 real)
    SYNC.md                        — deviation + stub log (Task 9)
  dialog/
    qwik-material-provider.tsx     — MODIFIED in Task 5 (adds matDividerConfig)
    qwik-material-provider-divider.spec.tsx — new spec (Task 5)
  scss/
    divider/                       — 5 upstream SCSS files (byte-identical) + divider-prebuilt.scss (Task 2)
  package.json                     — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                   — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                       — MODIFIED in Task 8 (divider-prebuilt.css import)
    routes/
      index.tsx                    — MODIFIED in Task 8 (Dividers section)
      mat-divider/                 — 6 new route files (Task 8)

src/qwik-cdk-parity-tests/
  specs/
    material-divider/              — 6 new Playwright specs (Task 8)
```

## Per-entry-point state

The `divider` entry-point becomes the ninth after `dialog` + `button` + `card` + `toolbar` + `badge` + `icon` + `progress-bar` + `progress-spinner` in the qwik-material package. All nine live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` (from earlier ports) is the only intersection, extended in Task 5.

## Sync recipe

To re-sync a specific file from upstream `src/material/divider/`:

1. Locate the upstream file's counterpart in the `divider/SYNC.md` sync table.
2. If "synced" state: `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "ported" state: manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change to the `mat-divider.tsx` file, update the corresponding `.spec.tsx`.
4. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck)
- 6 dev-app routes at `/mat-divider/*` render visibly in browser preview
- 6 Playwright specs pass locally when run against the built dev-app preview
- Every Playwright spec asserts on the `<mat-divider>` custom-element tag AT LEAST ONCE — regression that drops the tag fails loudly
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/divider/` returns nothing)
- Zero SSR-leak violations
- SYNC.md populated with all 8 deviations + stub delta
