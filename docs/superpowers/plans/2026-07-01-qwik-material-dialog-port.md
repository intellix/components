# qwik-material Dialog Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@angular-community/qwik-material` as a pnpm workspace package at `src/qwik-material/`, delivering a working Material Design Dialog (service + container + config + ref + 4 content components + provider) that consumes the existing `@angular-community/qwik-cdk` and preserves MDC visual/behavioral contract (class-based animation state machine at 150/75 ms defaults, verbatim SCSS, aria wiring).

**Architecture:** Sibling to `src/qwik-cdk/`, mirroring its build pipeline (Vite library mode, `qwikVite({csr:true})`, `"qwik"` export condition pointing at source, prebuilt CSS emitted by a closeBundle plugin). The Material dialog is a **thin wrapper** over qwik-cdk's `useDialog()`: `useMatDialog().open$` merges MatDialog defaults, wraps the consumer's body in `<MatDialogContainer>`, and delegates to `cdk.open$`. `MatDialogContainer` is composed inside `CdkDialogContainer` via JSX (no class inheritance), owns the animation state machine driven by JS timers, and provides `MAT_DIALOG_REF` + `MAT_DIALOG_CONTAINER` contexts so the four content components can wire aria-labelledby, action-count, and close-on-click without content queries. Every consumer surface is an interface + `create*` factory — zero exported classes.

**Tech Stack:** TypeScript 5+, Qwik 1.x + Qwik City, Vite library mode, Vitest + `@builder.io/qwik/testing` + happy-dom, Playwright, pnpm 11 workspaces, Sass/SCSS. Peer-depends on `@angular-community/qwik-cdk` (workspace).

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (final; do not rename).
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths in this plan are relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-07-01-qwik-material-dialog-port-design.md](../specs/2026-07-01-qwik-material-dialog-port-design.md). Read §5 (Public API), §6 (Internal architecture), §10 (open deviations catalog) before starting any port task.
- **Material source reference:** `src/material/dialog/`. Every port task names the exact source file(s) it mirrors.
- **qwik-cdk peer:** `@angular-community/qwik-cdk` at `workspace:*`. All qwik-cdk exports are consumed via that package name (e.g. `import { useDialog } from '@angular-community/qwik-cdk/dialog'`), NOT via relative paths — the `"qwik"` export condition points at source so vite bundles fine.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. E.g. `dialog-config.ts` → `mat-dialog-config.ts`. Pure-TS files keep `.ts`. Component files become `.tsx`. Files with no Qwik analogue become `<basename>.removed.md` stubs. Templates (`*.html`) collapse into their `.tsx` JSX with a `<basename>.html.removed.md` breadcrumb.
- **API parity:** preserve Material class/function/option names where possible; record every deviation in the corresponding per-entry `SYNC.md`. Consumer-facing class names (`MatDialog`, `MatDialogRef`, `MatDialogConfig`, `MatDialogContainer`, `MatDialogTitle`, etc.) stay the same but shift from `class X` to `interface X { … } + createX(…): X`.
- **No RxJS dependency.** Translate Observables per spec §10 (Signal for reactive state, `Promise` for one-shot, `QRL` callback for events supplied at open()-time via `MatDialogConfig`).
- **No exported classes** in the consumer surface. `dialog/public-api.ts` must not contain `export class` — only `export interface`, `export function create*`, `export const *_CONTEXT`, `export enum MatDialogState`, and `export * from` re-exports.
- **SSR safety:** every `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` call must be inside `useVisibleTask$` OR guarded by `typeof <global> !== 'undefined'`. **Do NOT use `isBrowser` from `@builder.io/qwik/build`** as an SSR guard — the qwikVite CSR-optimizer inlines it to `true` and DCE strips the guard (verified by qwik-cdk commit `a1e69c1f6`). Lint check added in Task 20 enforces this.
- **Commit message scope:** the upstream repo's commit-msg hook does not know `qwik-material`; use scope `multiple` (which is in the allowed list) for commits to qwik-material files.
- **Pnpm version:** the repo pins `pnpm@11.7.0`. Don't change it.
- **Node version:** the repo pins via `.nvmrc`. Don't change it.
- **No Bazel changes.** qwik-material lives outside the Bazel graph. Don't touch any `BUILD.bazel` file.
- **No upstream CI integration.** The plan stops at "qwik-material works locally".
- **Commit style:** every task ends with a commit named after the deliverable. Small, mechanical tasks may squash the "write failing test / verify fails / implement / verify passes" cycle into two commits (test+impl and commit); larger tasks use TDD strictly.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: pnpm workspace entry + qwik-material package skeleton

**Reference source:** `src/qwik-cdk/package.json`, `src/qwik-cdk/tsconfig.json`, `src/qwik-cdk/README.md`, `src/qwik-cdk/index.ts` (structural templates only — content differs).

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `src/qwik-material/package.json`
- Create: `src/qwik-material/tsconfig.json`
- Create: `src/qwik-material/README.md`
- Create: `src/qwik-material/index.ts`
- Create: `src/qwik-material/.gitignore`
- Create: `src/qwik-material/SYNC.md`
- Create: `src/qwik-material/scripts/lint-no-ssr-leaks.mjs` (copy verbatim from `src/qwik-cdk/scripts/lint-no-ssr-leaks.mjs`)

**Interfaces:**
- Consumes: nothing (repo scaffold task).
- Produces: workspace package `@angular-community/qwik-material` reachable via pnpm; empty `./` and `./dialog` entry-point stubs.

- [ ] **Step 1: Add qwik-material to pnpm workspace**

Read the current `pnpm-workspace.yaml`. Under the `packages:` list, append `src/qwik-material`. Do not reorder existing entries. Example diff:

```yaml
packages:
  - '.'
  - src/qwik-cdk
  - src/qwik-cdk-dev-app
  - src/qwik-cdk-parity-tests
  - src/qwik-material    # <-- add this line
```

- [ ] **Step 2: Create `src/qwik-material/package.json`**

```json
{
  "name": "@angular-community/qwik-material",
  "version": "0.0.0",
  "description": "Qwik port of @angular/material (starting with Dialog).",
  "type": "module",
  "license": "MIT",
  "private": true,
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint:no-ssr-leaks": "node ./scripts/lint-no-ssr-leaks.mjs"
  },
  "peerDependencies": {
    "@builder.io/qwik": "^1.5.0",
    "@angular-community/qwik-cdk": "workspace:*"
  },
  "devDependencies": {
    "@builder.io/qwik": "^1.5.0",
    "@angular-community/qwik-cdk": "workspace:*",
    "@types/node": "*",
    "happy-dom": "*",
    "sass": "*",
    "typescript": "*",
    "vite": "*",
    "vite-plugin-dts": "*",
    "vitest": "*"
  },
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
    "./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
    "./scss/*": "./scss/*"
  },
  "files": [
    "dist",
    "scss",
    "*.ts",
    "*.tsx",
    "**/*.ts",
    "**/*.tsx",
    "!**/*.spec.ts",
    "!**/*.spec.tsx",
    "!scripts"
  ]
}
```

- [ ] **Step 3: Create `src/qwik-material/tsconfig.json` (mirror qwik-cdk verbatim)**

Read `src/qwik-cdk/tsconfig.json`. Create `src/qwik-material/tsconfig.json` with identical content. Same compiler options, same `include`/`exclude`, same `verbatimModuleSyntax`.

- [ ] **Step 4: Create `src/qwik-material/README.md`**

```md
# @angular-community/qwik-material

Qwik port of Angular Material. First component: Dialog.

Consumes [@angular-community/qwik-cdk](../qwik-cdk/README.md) for overlay, dialog primitives, and a11y foundations. Ships MDC-parity SCSS and JS class-based animation state machine matching Angular Material's timing (150 ms enter, 75 ms exit).

## Layout

- `dialog/` — Material Dialog service, container, ref, config, content components, provider
- `scss/` — SCSS ported verbatim from `src/material/dialog/`

See [SYNC.md](./SYNC.md) for upstream sync state.
```

- [ ] **Step 5: Create `src/qwik-material/index.ts`**

```ts
// Top-level exports. Per-entry-point exports live in each entry's own index.ts file.
export {} as const;
```

(Empty for now; Task 15 fills in real re-exports after the dialog entry-point exists.)

- [ ] **Step 6: Create `src/qwik-material/.gitignore`**

```
dist/
node_modules/
*.tsbuildinfo
```

- [ ] **Step 7: Create `src/qwik-material/SYNC.md`**

```md
# qwik-material sync state

Repo root: this file lives at src/qwik-material/SYNC.md.

## Per-entry-point state

| Entry-point | Upstream base | Last sync commit | Notes |
|---|---|---|---|
| dialog | src/material/dialog | (unsynced — initial port) | See dialog/SYNC.md |

## Sync recipe

See `dialog/SYNC.md` for the entry-scoped sync recipe. This file rolls up which entry-points exist and where each was last synced.
```

- [ ] **Step 8: Copy the SSR-leak lint script**

```bash
cp src/qwik-cdk/scripts/lint-no-ssr-leaks.mjs src/qwik-material/scripts/lint-no-ssr-leaks.mjs
```

Then open the copy and adjust the walked directory root from `src/qwik-cdk` to `src/qwik-material` (search for hard-coded `qwik-cdk` strings; replace with `qwik-material`).

- [ ] **Step 9: Install and verify pnpm sees the workspace**

Run:
```bash
pnpm install
pnpm -C src/qwik-material typecheck
```

Expected: `pnpm install` succeeds and creates a `src/qwik-material/node_modules` symlink graph. `typecheck` succeeds with no output (empty `index.ts` type-checks fine).

- [ ] **Step 10: Commit**

```bash
git add pnpm-workspace.yaml src/qwik-material/
git commit -m "feat(multiple): scaffold @angular-community/qwik-material workspace package"
```

---

### Task 2: Vite library config + Vitest setup + smoke test

**Reference source:** `src/qwik-cdk/vite.config.ts`, `src/qwik-cdk/vitest.setup.ts`, `src/qwik-cdk/__smoke__.spec.ts`.

**Files:**
- Create: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/vitest.setup.ts`
- Create: `src/qwik-material/__smoke__.spec.ts`

**Interfaces:**
- Consumes: Task 1 package.json scripts.
- Produces: working `pnpm build` + `pnpm test` shells. Build emits `dist/index.js` (empty) plus type declarations; test runner finds and runs one smoke spec that passes.

- [ ] **Step 1: Create `src/qwik-material/vite.config.ts`**

Read `src/qwik-cdk/vite.config.ts` for the exact structure and copy it as a template. The two adjustments:
- The library `entries` array must list our dialog entry-point plus a stub for future components. For now: `const entries = ['dialog'];`.
- The `qwik-cdk-compile-sass-prebuilt` closeBundle plugin's `entries` list — for now, `[['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css']]`. The SCSS files do not exist yet — they land in Task 3. The plugin will silently no-op until then because Sass will error out reading a nonexistent file; that's fine, we skip running `build` end-to-end until Task 3.

Full file:

```ts
import {defineConfig} from 'vitest/config';
import {qwikVite} from '@builder.io/qwik/optimizer';
import dts from 'vite-plugin-dts';
import {resolve} from 'node:path';

const entries = ['dialog'];

export default defineConfig({
  plugins: [
    qwikVite({csr: true, srcDir: '.'}),
    dts({outDirs: 'dist', insertTypesEntry: true}),
    {
      name: 'qwik-material-compile-sass-prebuilt',
      apply: 'build',
      async closeBundle() {
        const sass = await import('sass');
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const sassEntries: [string, string][] = [
          ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
        ];
        for (const [src, out] of sassEntries) {
          const srcAbs = path.resolve(__dirname, src);
          try {
            const result = sass.compile(srcAbs, {style: 'expanded'});
            await fs.mkdir(path.dirname(path.resolve(__dirname, out)), {recursive: true});
            await fs.writeFile(path.resolve(__dirname, out), result.css, 'utf8');
          } catch (err: unknown) {
            const e = err as {code?: string; message?: string};
            if (e?.code === 'ENOENT' || (e?.message ?? '').includes('does not exist')) {
              console.warn(`[qwik-material] skipping ${src} — not yet present.`);
              continue;
            }
            throw err;
          }
        }
      },
    },
    {
      name: 'qwik-material-copy-scss',
      apply: 'build',
      async closeBundle() {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const src = path.resolve(__dirname, 'scss');
        const dst = path.resolve(__dirname, 'dist/scss');
        try {
          await fs.cp(src, dst, {recursive: true});
        } catch (err: unknown) {
          const e = err as {code?: string};
          if (e?.code === 'ENOENT') return;
          throw err;
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    lib: {
      formats: ['es'],
      entry: {
        index: resolve(__dirname, 'index.ts'),
        ...Object.fromEntries(
          entries.map(e => [`${e}/index`, resolve(__dirname, `${e}/index.ts`)]),
        ),
      },
    },
    rollupOptions: {
      external: [
        '@builder.io/qwik',
        '@builder.io/qwik/build',
        '@builder.io/qwik-city',
        '@angular-community/qwik-cdk',
        /^@angular-community\/qwik-cdk\/.+$/,
      ],
      output: {preserveModules: false, entryFileNames: '[name].js'},
    },
    target: 'es2022',
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['**/*.spec.ts', '**/*.spec.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

Note the two `external` additions for qwik-cdk (both the bare package and its subpath exports) — this keeps qwik-cdk out of qwik-material's bundle at build time. The `"qwik"` export condition on the consumer side still allows vite to walk the source when consumers build.

- [ ] **Step 2: Create `src/qwik-material/vitest.setup.ts`**

Read `src/qwik-cdk/vitest.setup.ts` and copy verbatim. This registers happy-dom globals and any Qwik-testing polyfills the CDK setup already found necessary.

- [ ] **Step 3: Create the smoke test at `src/qwik-material/__smoke__.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';

describe('qwik-material smoke', () => {
  it('vitest runs a test from the qwik-material workspace root', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run vitest**

```bash
pnpm -C src/qwik-material test
```

Expected:
```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/vite.config.ts src/qwik-material/vitest.setup.ts src/qwik-material/__smoke__.spec.ts
git commit -m "build(multiple): qwik-material vite lib config + vitest setup"
```

---

### Task 3: SCSS copy + prebuilt entry + Vite plumbing

**Reference source:** `src/material/dialog/dialog.scss`, `src/material/dialog/_dialog-theme.scss`, `src/material/dialog/_m2-dialog.scss`, `src/material/dialog/_m3-dialog.scss`, `src/material/dialog/_dialog-legacy-padding.scss`.

**Files:**
- Create: `src/qwik-material/scss/_index.scss`
- Create: `src/qwik-material/scss/dialog/dialog.scss` (verbatim copy)
- Create: `src/qwik-material/scss/dialog/_dialog-theme.scss` (verbatim copy)
- Create: `src/qwik-material/scss/dialog/_m2-dialog.scss` (verbatim copy)
- Create: `src/qwik-material/scss/dialog/_m3-dialog.scss` (verbatim copy)
- Create: `src/qwik-material/scss/dialog/_dialog-legacy-padding.scss` (verbatim copy)
- Create: `src/qwik-material/scss/dialog/dialog-prebuilt.scss` (new entry that `@use`s the above)
- Any `<missing-upstream-file>.scss` stubs required to satisfy `@use` paths

**Interfaces:**
- Consumes: Task 2 Vite closeBundle plugin (compiles `scss/dialog/dialog-prebuilt.scss` → `dist/dialog-prebuilt.css`).
- Produces: `dist/dialog-prebuilt.css` after `pnpm build`. The CSS contains Material Dialog's full structural + theme layers.

**Approach:** Copy the five source SCSS files verbatim. Enumerate any `@use` paths pointing outside the dialog folder (e.g. `@use '../core/tokens/...'`, `@use '../core/style/private'`); for each missing upstream path, create a **stub** file at the matching relative location under `src/qwik-material/scss/` containing the minimum symbols needed to compile. Every stub starts with a `// STUB — see SYNC.md` comment.

- [ ] **Step 1: Copy the five SCSS files verbatim**

```bash
mkdir -p src/qwik-material/scss/dialog
cp src/material/dialog/dialog.scss                 src/qwik-material/scss/dialog/dialog.scss
cp src/material/dialog/_dialog-theme.scss          src/qwik-material/scss/dialog/_dialog-theme.scss
cp src/material/dialog/_m2-dialog.scss             src/qwik-material/scss/dialog/_m2-dialog.scss
cp src/material/dialog/_m3-dialog.scss             src/qwik-material/scss/dialog/_m3-dialog.scss
cp src/material/dialog/_dialog-legacy-padding.scss src/qwik-material/scss/dialog/_dialog-legacy-padding.scss
```

- [ ] **Step 2: Enumerate `@use` paths that need stubs**

Run:
```bash
grep -h "^@use" src/qwik-material/scss/dialog/*.scss | sort -u
```

For each `@use` path that starts with `../` or references an Angular Material internal (e.g. `@use '../core/tokens/token-utils'`, `@use '../core/style/sass-utils'`, `@use '../core/theming/inspection'`), record the path. These stubs will land under `src/qwik-material/scss/core/…` matching the original relative structure.

- [ ] **Step 3: Create stubs for each missing `@use` path**

For each unresolved path, create a stub file. The stub's content is: minimum function/mixin/variable definitions needed for the dialog SCSS files to compile without errors, prefixed by a `// STUB` comment naming the upstream file.

Iterate: create a stub, run `pnpm -C src/qwik-material build`, check the Sass error, add missing symbols. Repeat until the build succeeds. This is intentionally an iterative loop — the exact stub content depends on which symbols the dialog files reference, which can only be discovered by running the compiler.

Each stub file starts with:

```scss
// STUB: this file is a compile-time stand-in for
// @angular/material/<path>. See src/qwik-material/dialog/SYNC.md for
// the stubbing rationale and remove-when-ported checklist.
```

- [ ] **Step 4: Create `src/qwik-material/scss/dialog/dialog-prebuilt.scss`**

```scss
// Prebuilt Material Dialog CSS entry.
//
// Emits: structural styles from dialog.scss + a default theme instantiation.
// Consumers import via `@angular-community/qwik-material/dialog-prebuilt.css`.
// For custom theming, consumers instead @use dialog-theme mixin from
// `@angular-community/qwik-material/scss/dialog/_dialog-theme.scss`.

@use './dialog';
```

(We ship the structural CSS only for the initial port. The theme mixin requires the full Angular Material theming DSL which is out of scope until `qwik-material/core` lands. Recorded as a deviation in Task 20.)

- [ ] **Step 5: Create `src/qwik-material/scss/_index.scss`**

```scss
@forward './dialog/dialog-prebuilt';
```

- [ ] **Step 6: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected:
- `dist/dialog-prebuilt.css` exists and is non-empty.
- Console shows `✓ built in …ms` with no Sass errors.

- [ ] **Step 7: Sanity-check the emitted CSS**

```bash
grep -c "mdc-dialog" src/qwik-material/dist/dialog-prebuilt.css
```

Expected: a number > 20 (indicates the MDC dialog rules made it through).

- [ ] **Step 8: Commit**

```bash
git add src/qwik-material/scss/
git commit -m "feat(multiple): copy Material Dialog SCSS + prebuilt CSS entry"
```

---

## Phase 2 — Foundation types

### Task 4: `MatDialogConfig` interface + supporting types

**Reference source:** `src/material/dialog/dialog-config.ts` (the parts still relevant after dropping `viewContainerRef`, `providers`, `injector`, etc. per spec §10).

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog-config.ts`
- Create: `src/qwik-material/dialog/mat-dialog-config.spec.ts`

**Interfaces:**
- Consumes: `qwik-cdk`'s `DialogConfig` (imported as type only — MatDialogConfig is a *superset shape*, not a subtype).
- Produces: `MatDialogConfig<D>`, `AutoFocusTarget`, `DialogRole`, `DialogPosition`. These types are consumed by every downstream task (ref, container, service).

- [ ] **Step 1: Write `mat-dialog-config.ts`**

```ts
import type {QRL} from '@builder.io/qwik';
import type {ScrollStrategy, OverlayContextOverride} from '@angular-community/qwik-cdk/overlay';

/** Options for where to set focus to automatically on dialog open. */
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading' | string;

/** Valid ARIA roles for a dialog element. */
export type DialogRole = 'dialog' | 'alertdialog';

/** Possible overrides for a dialog's position. */
export interface DialogPosition {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

/**
 * Configuration for opening a Material Design modal dialog with useMatDialog().
 *
 * Supersets qwik-cdk's DialogConfig with Material-specific fields
 * (enterAnimationDuration, exitAnimationDuration, position). See design spec
 * §5 for the full field catalog and §10 for deviations from Angular Material.
 */
export interface MatDialogConfig<D = unknown> {
  // --- CDK-inherited fields ---
  id?: string;
  role?: DialogRole;
  panelClass?: string | string[];
  hasBackdrop?: boolean;
  backdropClass?: string | string[];
  disableClose?: boolean;

  width?: string;
  height?: string;
  minWidth?: string | number;
  minHeight?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;

  direction?: 'ltr' | 'rtl';

  ariaDescribedBy?: string | null;
  ariaLabelledBy?: string | null;
  ariaLabel?: string | null;
  /** Whether the dialog is a modal (traps focus, dims background). Default true. */
  ariaModal?: boolean;

  autoFocus?: AutoFocusTarget | false;
  restoreFocus?: boolean | string | HTMLElement;
  closeOnNavigation?: boolean;

  data?: D | null;

  scrollStrategy?: ScrollStrategy;
  context?: OverlayContextOverride[];

  // --- QRL callbacks (Qwik replacement for RxJS streams) ---
  onBackdropClick$?: QRL<(e: MouseEvent) => void>;
  onKeydown$?: QRL<(e: KeyboardEvent) => void>;
  onOutsidePointer$?: QRL<(e: MouseEvent) => void>;

  // --- Material-specific ---
  /** Duration of the enter animation, in ms (number) or CSS time string. Default 150. */
  enterAnimationDuration?: number | string;
  /** Duration of the exit animation, in ms (number) or CSS time string. Default 75. */
  exitAnimationDuration?: number | string;
  /** Custom position override applied via matDialogRef.updatePosition(). */
  position?: DialogPosition;
}
```

- [ ] **Step 2: Write `mat-dialog-config.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import type {MatDialogConfig, AutoFocusTarget, DialogRole, DialogPosition} from './mat-dialog-config';

describe('MatDialogConfig', () => {
  it('accepts an empty config', () => {
    const c: MatDialogConfig = {};
    expect(c).toBeDefined();
  });

  it('accepts every documented field', () => {
    const c: MatDialogConfig<{message: string}> = {
      id: 'my-dialog',
      role: 'alertdialog',
      panelClass: ['klass-a', 'klass-b'],
      hasBackdrop: true,
      backdropClass: 'my-backdrop',
      disableClose: false,
      width: '400px',
      height: '300px',
      minWidth: 200,
      minHeight: '10rem',
      maxWidth: '80vw',
      maxHeight: 500,
      direction: 'ltr',
      ariaDescribedBy: 'desc',
      ariaLabelledBy: 'title',
      ariaLabel: null,
      ariaModal: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      closeOnNavigation: true,
      data: {message: 'hi'},
      enterAnimationDuration: 150,
      exitAnimationDuration: '75ms',
      position: {top: '10px', right: '20px'},
    };
    expect(c.data?.message).toBe('hi');
  });

  it('AutoFocusTarget covers the documented literal values plus arbitrary selector strings', () => {
    const a: AutoFocusTarget = 'first-tabbable';
    const b: AutoFocusTarget = 'first-heading';
    const c: AutoFocusTarget = 'dialog';
    const d: AutoFocusTarget = 'button.primary'; // arbitrary CSS selector
    expect([a, b, c, d]).toHaveLength(4);
  });

  it('DialogRole is exactly dialog|alertdialog', () => {
    const a: DialogRole = 'dialog';
    const b: DialogRole = 'alertdialog';
    expect([a, b]).toEqual(['dialog', 'alertdialog']);
  });

  it('DialogPosition accepts partial coord overrides', () => {
    const p: DialogPosition = {top: '10px'};
    expect(p.top).toBe('10px');
  });
});
```

- [ ] **Step 3: Run test**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog-config
```

Expected: 5/5 tests passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/dialog/mat-dialog-config.ts src/qwik-material/dialog/mat-dialog-config.spec.ts
git commit -m "feat(multiple): add MatDialogConfig interface + supporting types"
```

---

### Task 5: `mat-dialog-tokens.ts` — six context IDs

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog-tokens.ts`
- Create: `src/qwik-material/dialog/mat-dialog-tokens.spec.ts`

**Interfaces:**
- Consumes: `MatDialogConfig` from Task 4.
- Produces: `MAT_DIALOG_DATA`, `MAT_DIALOG_DEFAULT_OPTIONS`, `MAT_DIALOG_SCROLL_STRATEGY`, `MAT_DIALOG_REF`, `MAT_DIALOG_CONTAINER`, `MAT_ANIMATIONS_DISABLED`. All are `createContextId<T>('qwik-material/…')` results, consumed by later tasks.

- [ ] **Step 1: Write `mat-dialog-tokens.ts`**

```ts
import {createContextId, type NoSerialize, type Signal} from '@builder.io/qwik';
import type {ScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import type {MatDialogRef} from './mat-dialog-ref';

/**
 * Data injected into the dialog body component. Set by config.data at open()
 * time; the container provides it. Consumers read via
 * `const data = useContext(MAT_DIALOG_DATA) as MyShape;`.
 */
export const MAT_DIALOG_DATA = createContextId<unknown>('qwik-material/dialog-data');

/**
 * Default options merged into every open() config. Provided by
 * <QwikMaterialProvider matDialogDefaults={…}>. Optional; defaults to {}.
 */
export const MAT_DIALOG_DEFAULT_OPTIONS = createContextId<Partial<MatDialogConfig>>(
  'qwik-material/dialog-default-options',
);

/**
 * Factory that returns the default ScrollStrategy for dialogs that don't
 * specify one. Provided by <QwikMaterialProvider matDialogScrollStrategyFactory={…}>.
 * Default: createBlockScrollStrategy() from qwik-cdk.
 */
export const MAT_DIALOG_SCROLL_STRATEGY = createContextId<() => ScrollStrategy>(
  'qwik-material/dialog-scroll-strategy',
);

/**
 * The MatDialogRef for the currently rendering dialog. Provided by
 * MatDialogContainer; consumed by MatDialogClose and by the consumer's dialog
 * body if it needs to call ref.close() imperatively.
 */
export const MAT_DIALOG_REF = createContextId<NoSerialize<MatDialogRef>>(
  'qwik-material/dialog-ref',
);

/**
 * Internal API surface the container provides so its own descendants
 * (MatDialogTitle, MatDialogActions) can register ids / action counts.
 */
export interface MatDialogContainerApi {
  registerTitleId$: import('@builder.io/qwik').QRL<(id: string) => void>;
  unregisterTitleId$: import('@builder.io/qwik').QRL<(id: string) => void>;
  incrementActionSectionCount$: import('@builder.io/qwik').QRL<() => void>;
  decrementActionSectionCount$: import('@builder.io/qwik').QRL<() => void>;
}
export const MAT_DIALOG_CONTAINER = createContextId<MatDialogContainerApi>(
  'qwik-material/dialog-container-api',
);

/**
 * Boolean Signal that disables all animations when true. Provided by
 * <QwikMaterialProvider animationsDisabled={…}>. Optional; the container
 * falls back to a frozen `{value: false}` shim when absent.
 */
export const MAT_ANIMATIONS_DISABLED = createContextId<Signal<boolean>>(
  'qwik-material/animations-disabled',
);
```

- [ ] **Step 2: Write `mat-dialog-tokens.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import {
  MAT_DIALOG_DATA,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
  MAT_DIALOG_REF,
  MAT_DIALOG_CONTAINER,
  MAT_ANIMATIONS_DISABLED,
} from './mat-dialog-tokens';

describe('mat-dialog-tokens', () => {
  it('all six context IDs are distinct objects', () => {
    const ids = [
      MAT_DIALOG_DATA,
      MAT_DIALOG_DEFAULT_OPTIONS,
      MAT_DIALOG_SCROLL_STRATEGY,
      MAT_DIALOG_REF,
      MAT_DIALOG_CONTAINER,
      MAT_ANIMATIONS_DISABLED,
    ];
    expect(new Set(ids).size).toBe(6);
  });

  it('context IDs carry the qwik-material/ namespace prefix', () => {
    // ContextId exposes `.id` as its string identifier under Qwik's runtime.
    // (The property name is stable in the current Qwik release we depend on.)
    const asAny = (x: unknown) => x as {id: string};
    expect(asAny(MAT_DIALOG_DATA).id).toBe('qwik-material/dialog-data');
    expect(asAny(MAT_DIALOG_DEFAULT_OPTIONS).id).toBe('qwik-material/dialog-default-options');
    expect(asAny(MAT_DIALOG_SCROLL_STRATEGY).id).toBe('qwik-material/dialog-scroll-strategy');
    expect(asAny(MAT_DIALOG_REF).id).toBe('qwik-material/dialog-ref');
    expect(asAny(MAT_DIALOG_CONTAINER).id).toBe('qwik-material/dialog-container-api');
    expect(asAny(MAT_ANIMATIONS_DISABLED).id).toBe('qwik-material/animations-disabled');
  });
});
```

- [ ] **Step 3: Run test**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog-tokens
```

Expected: 2/2 passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/dialog/mat-dialog-tokens.ts src/qwik-material/dialog/mat-dialog-tokens.spec.ts
git commit -m "feat(multiple): add MatDialog context tokens"
```

---

### Task 6: `parseCssTime` + `useAnimationsDisabled` helpers

**Files:**
- Create: `src/qwik-material/dialog/parse-css-time.ts`
- Create: `src/qwik-material/dialog/parse-css-time.spec.ts`
- Create: `src/qwik-material/dialog/use-animations-disabled.ts`
- Create: `src/qwik-material/dialog/use-animations-disabled.spec.ts`

**Interfaces:**
- Consumes: `MAT_ANIMATIONS_DISABLED` from Task 5.
- Produces: `parseCssTime(v): number | null` — turns `150 | '150ms' | '0.15s' | undefined` into a number of ms. `useAnimationsDisabled(): Signal<boolean>` — a small hook the container reads.

- [ ] **Step 1: Write `parse-css-time.ts`**

```ts
/**
 * Parses a CSS time value into milliseconds.
 *
 * Accepts:
 *   - `number` (assumed ms)
 *   - `<n>ms` — e.g. '150ms'
 *   - `<n>s`  — e.g. '0.15s'
 *   - `<n>` (bare number-string) — assumed ms for parity with Angular's coerceNumberProperty
 *
 * Returns `null` for undefined/null/unparseable input so callers can fall back
 * to their own defaults.
 */
export function parseCssTime(v: number | string | undefined | null): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = v.trim().match(/^(\d+(?:\.\d+)?)(ms|s)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  return m[2] === 's' ? n * 1000 : n;
}
```

- [ ] **Step 2: Write `parse-css-time.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import {parseCssTime} from './parse-css-time';

describe('parseCssTime', () => {
  it('returns null for undefined/null', () => {
    expect(parseCssTime(undefined)).toBe(null);
    expect(parseCssTime(null)).toBe(null);
  });
  it('passes through finite numbers as ms', () => {
    expect(parseCssTime(150)).toBe(150);
    expect(parseCssTime(0)).toBe(0);
  });
  it('returns null for NaN or Infinity', () => {
    expect(parseCssTime(NaN)).toBe(null);
    expect(parseCssTime(Infinity)).toBe(null);
  });
  it('parses ms strings', () => {
    expect(parseCssTime('150ms')).toBe(150);
    expect(parseCssTime('0ms')).toBe(0);
    expect(parseCssTime('75.5ms')).toBe(75.5);
  });
  it('parses s strings and converts to ms', () => {
    expect(parseCssTime('0.15s')).toBeCloseTo(150);
    expect(parseCssTime('1s')).toBe(1000);
  });
  it('parses bare number strings as ms', () => {
    expect(parseCssTime('150')).toBe(150);
  });
  it('rejects garbage', () => {
    expect(parseCssTime('abc')).toBe(null);
    expect(parseCssTime('150px')).toBe(null);
    expect(parseCssTime('')).toBe(null);
  });
});
```

- [ ] **Step 3: Write `use-animations-disabled.ts`**

```ts
import {useContext, type Signal} from '@builder.io/qwik';
import {MAT_ANIMATIONS_DISABLED} from './mat-dialog-tokens';

/**
 * A frozen no-animations-disabled default. Consumers who don't mount
 * <QwikMaterialProvider> get this shim; the container reads .value
 * (never mutates), so the frozen shape is fine.
 */
const _ANIMATIONS_ENABLED_DEFAULT: Signal<boolean> = Object.freeze({value: false}) as Signal<boolean>;

/**
 * Reads the MAT_ANIMATIONS_DISABLED context, falling back to the frozen
 * default when no provider is present.
 */
export function useAnimationsDisabled(): Signal<boolean> {
  return useContext(MAT_ANIMATIONS_DISABLED, _ANIMATIONS_ENABLED_DEFAULT);
}
```

- [ ] **Step 4: Write `use-animations-disabled.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
// Import ensures the module loads without hook-order errors at module-init;
// exercising useContext requires a component render harness which is out of
// scope for the unit spec. The hook is verified end-to-end via
// MatDialogContainer's spec in Task 8.

import {useAnimationsDisabled} from './use-animations-disabled';

describe('useAnimationsDisabled', () => {
  it('is a callable function', () => {
    expect(typeof useAnimationsDisabled).toBe('function');
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm -C src/qwik-material test dialog/parse-css-time dialog/use-animations-disabled
```

Expected: 8/8 passing.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/dialog/parse-css-time.ts src/qwik-material/dialog/parse-css-time.spec.ts src/qwik-material/dialog/use-animations-disabled.ts src/qwik-material/dialog/use-animations-disabled.spec.ts
git commit -m "feat(multiple): add parseCssTime + useAnimationsDisabled helpers"
```

---

### Task 7: `mat-dialog-ref.ts` — factory + state enum + internal symbols

**Reference source:** `src/material/dialog/dialog-ref.ts`.

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog-ref.ts`
- Create: `src/qwik-material/dialog/mat-dialog-ref.spec.ts`

**Interfaces:**
- Consumes: `MatDialogConfig` (Task 4), `DialogPosition` (Task 4), qwik-cdk's `DialogRef` (as the underlying handle).
- Produces:
  - `enum MatDialogState { OPEN, CLOSING, CLOSED }`
  - `interface MatDialogRef<R, C>`
  - `createMatDialogRef(deps): MatDialogRef<R, C>` — factory taking caller-provided signals for `state` and `componentInstance` plus the cdk ref and config.
  - Internal symbols `MARK_OPENED` / `MARK_CLOSED` exported so the container can resolve the internal promises.

- [ ] **Step 1: Write `mat-dialog-ref.ts`**

```ts
import type {Signal} from '@builder.io/qwik';
import type {DialogRef as CdkDialogRef} from '@angular-community/qwik-cdk/dialog';
import type {FocusOrigin} from '@angular-community/qwik-cdk/a11y';
import type {MatDialogConfig, DialogPosition} from './mat-dialog-config';

/** Possible states of the lifecycle of a Material dialog. */
export enum MatDialogState {
  OPEN,
  CLOSING,
  CLOSED,
}

/**
 * Internal symbol the MatDialogContainer uses to signal "enter animation
 * complete → resolve afterOpened". Not part of the consumer API.
 */
export const MARK_OPENED = Symbol('qwik-material/dialog-ref/mark-opened');

/**
 * Internal symbol the MatDialogContainer uses to signal "exit animation
 * complete → resolve afterClosed and transition state to CLOSED". Not part
 * of the consumer API.
 */
export const MARK_CLOSED = Symbol('qwik-material/dialog-ref/mark-closed');

/**
 * Consumer-facing handle returned by useMatDialog().open$().
 *
 * Design shape:
 * - Reactive state (isOpen, componentInstance, state) exposed as Signals.
 * - One-shot events (afterOpened / beforeClosed / afterClosed) exposed as
 *   Promises. beforeClosed resolves when close() is called; afterClosed
 *   resolves after the exit animation completes.
 * - Mutations (updatePosition, updateSize, addPanelClass, removePanelClass)
 *   return `this` for chaining, matching Angular MatDialogRef.
 */
export interface MatDialogRef<R = unknown, C = unknown> {
  readonly id: string;
  readonly config: MatDialogConfig;
  readonly componentInstance: Signal<C | null>;
  readonly state: Signal<MatDialogState>;

  /** Resolves once the enter animation completes. */
  readonly afterOpened: Promise<void>;
  /** Resolves once the exit animation completes; carries the close result. */
  readonly afterClosed: Promise<R | undefined>;
  /** Resolves the moment close() is called, before the exit animation. */
  readonly beforeClosed: Promise<R | undefined>;

  close(result?: R, options?: {focusOrigin?: FocusOrigin}): void;
  updatePosition(position?: DialogPosition): MatDialogRef<R, C>;
  updateSize(width?: string, height?: string): MatDialogRef<R, C>;
  addPanelClass(classes: string | string[]): MatDialogRef<R, C>;
  removePanelClass(classes: string | string[]): MatDialogRef<R, C>;

  /**
   * @internal Container calls this to resolve `afterOpened` when the enter
   * animation ends. Not part of the consumer API.
   */
  [MARK_OPENED](): void;
  /**
   * @internal Container calls this to resolve `afterClosed` and transition
   * state to CLOSED when the exit animation ends. Not part of the consumer API.
   */
  [MARK_CLOSED](): void;
}

/**
 * Pure factory used internally by useMatDialog().open$. Not intended for
 * direct consumer use — but exported for the vitest harness.
 *
 * The caller (useMatDialog) supplies:
 * - `cdkRef`: the wrapping cdk DialogRef, used to dispose the overlay on close.
 * - `config`: the merged MatDialogConfig.
 * - `state`: a Signal<MatDialogState> the caller initialises to OPEN.
 * - `componentInstance`: a Signal<C | null> the caller initialises to null.
 *
 * The factory itself does NOT call any Qwik hook (useSignal, useContext, …).
 * It's a plain function that captures closures and returns a plain object.
 */
export function createMatDialogRef<R = unknown, C = unknown>(deps: {
  cdkRef: {dispose(): void; updatePosition(): void; updateSize(opts: {width?: string | number; height?: string | number}): void; addPanelClass(cls: string | string[]): void; removePanelClass(cls: string | string[]): void};
  config: MatDialogConfig;
  state: Signal<MatDialogState>;
  componentInstance: Signal<C | null>;
}): MatDialogRef<R, C> {
  // Promise resolvers captured from Promise constructor executors.
  let resolveOpened!: () => void;
  let resolveBeforeClosed!: (r: R | undefined) => void;
  let resolveClosed!: (r: R | undefined) => void;

  const afterOpened = new Promise<void>(r => {
    resolveOpened = r;
  });
  const beforeClosed = new Promise<R | undefined>(r => {
    resolveBeforeClosed = r;
  });
  const afterClosed = new Promise<R | undefined>(r => {
    resolveClosed = r;
  });

  // Stash the last-seen close result so [MARK_CLOSED]() knows what to resolve with.
  let pendingResult: R | undefined = undefined;

  // If the caller pre-set state to CLOSED (SSR no-op), resolve everything
  // immediately so awaiters never hang.
  if (deps.state.value === MatDialogState.CLOSED) {
    resolveOpened();
    resolveBeforeClosed(undefined);
    resolveClosed(undefined);
  }

  const ref: MatDialogRef<R, C> = {
    id: deps.config.id!,
    config: deps.config,
    state: deps.state,
    componentInstance: deps.componentInstance,
    afterOpened,
    beforeClosed,
    afterClosed,

    close(result, _options) {
      if (deps.state.value !== MatDialogState.OPEN) return;
      pendingResult = result;
      (deps.state as {value: MatDialogState}).value = MatDialogState.CLOSING;
      resolveBeforeClosed(result);
      // The container's exit-animation task observes state === CLOSING, waits
      // exitAnimationDuration ms, then calls ref[MARK_CLOSED]().
    },

    updatePosition(_position) {
      // Position deltas are applied to the underlying overlay's position
      // strategy via cdkRef.updatePosition. The MatDialogConfig.position
      // struct is honoured by the container's position-strategy config at
      // open() time; updates after open re-run the strategy.
      deps.cdkRef.updatePosition();
      return ref;
    },

    updateSize(width, height) {
      deps.cdkRef.updateSize({width, height});
      return ref;
    },

    addPanelClass(classes) {
      deps.cdkRef.addPanelClass(classes);
      return ref;
    },

    removePanelClass(classes) {
      deps.cdkRef.removePanelClass(classes);
      return ref;
    },

    [MARK_OPENED]() {
      resolveOpened();
    },

    [MARK_CLOSED]() {
      (deps.state as {value: MatDialogState}).value = MatDialogState.CLOSED;
      deps.cdkRef.dispose();
      resolveClosed(pendingResult);
    },
  };
  return ref;
}
```

- [ ] **Step 2: Write `mat-dialog-ref.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import type {Signal} from '@builder.io/qwik';
import {createMatDialogRef, MatDialogState, MARK_OPENED, MARK_CLOSED} from './mat-dialog-ref';
import type {MatDialogRef} from './mat-dialog-ref';

function makeSignal<T>(v: T): Signal<T> {
  return {value: v} as Signal<T>;
}

function makeCdkRefStub() {
  const calls: string[] = [];
  return {
    dispose: () => calls.push('dispose'),
    updatePosition: () => calls.push('updatePosition'),
    updateSize: (_opts: any) => calls.push('updateSize'),
    addPanelClass: (_c: any) => calls.push('addPanelClass'),
    removePanelClass: (_c: any) => calls.push('removePanelClass'),
    calls,
  };
}

describe('createMatDialogRef', () => {
  it('exposes id from config', () => {
    const ref = createMatDialogRef({
      cdkRef: makeCdkRefStub(),
      config: {id: 'my-dialog'},
      state: makeSignal(MatDialogState.OPEN),
      componentInstance: makeSignal(null),
    });
    expect(ref.id).toBe('my-dialog');
  });

  it('close(result) transitions state to CLOSING and resolves beforeClosed', async () => {
    const state = makeSignal(MatDialogState.OPEN);
    const ref = createMatDialogRef<string>({
      cdkRef: makeCdkRefStub(),
      config: {id: 'x'},
      state,
      componentInstance: makeSignal(null),
    });
    ref.close('ok');
    expect(state.value).toBe(MatDialogState.CLOSING);
    await expect(ref.beforeClosed).resolves.toBe('ok');
  });

  it('[MARK_CLOSED] transitions state to CLOSED and resolves afterClosed with the close result', async () => {
    const state = makeSignal(MatDialogState.OPEN);
    const cdk = makeCdkRefStub();
    const ref = createMatDialogRef<string>({
      cdkRef: cdk,
      config: {id: 'x'},
      state,
      componentInstance: makeSignal(null),
    });
    ref.close('bye');
    ref[MARK_CLOSED]();
    await expect(ref.afterClosed).resolves.toBe('bye');
    expect(state.value).toBe(MatDialogState.CLOSED);
    expect(cdk.calls).toContain('dispose');
  });

  it('[MARK_OPENED] resolves afterOpened', async () => {
    const ref = createMatDialogRef({
      cdkRef: makeCdkRefStub(),
      config: {id: 'x'},
      state: makeSignal(MatDialogState.OPEN),
      componentInstance: makeSignal(null),
    });
    ref[MARK_OPENED]();
    await expect(ref.afterOpened).resolves.toBeUndefined();
  });

  it('close() called twice is idempotent', () => {
    const state = makeSignal(MatDialogState.OPEN);
    const cdk = makeCdkRefStub();
    const ref = createMatDialogRef<string>({
      cdkRef: cdk,
      config: {id: 'x'},
      state,
      componentInstance: makeSignal(null),
    });
    ref.close('first');
    ref.close('second');
    // Second call is a no-op — state must still be CLOSING, not re-transitioned.
    expect(state.value).toBe(MatDialogState.CLOSING);
    // Only one beforeClosed resolution happens; harder to assert directly but the
    // idempotent guard on state prevents re-firing pendingResult.
  });

  it('mutations delegate to cdkRef and return this', () => {
    const cdk = makeCdkRefStub();
    const ref = createMatDialogRef({
      cdkRef: cdk,
      config: {id: 'x'},
      state: makeSignal(MatDialogState.OPEN),
      componentInstance: makeSignal(null),
    });
    expect(ref.updatePosition()).toBe(ref);
    expect(ref.updateSize('400px', '300px')).toBe(ref);
    expect(ref.addPanelClass('a')).toBe(ref);
    expect(ref.removePanelClass(['b'])).toBe(ref);
    expect(cdk.calls).toEqual(['updatePosition', 'updateSize', 'addPanelClass', 'removePanelClass']);
  });

  it('SSR no-op (state pre-set to CLOSED) resolves all three promises immediately', async () => {
    const ref = createMatDialogRef<string>({
      cdkRef: makeCdkRefStub(),
      config: {id: 'ssr'},
      state: makeSignal(MatDialogState.CLOSED),
      componentInstance: makeSignal(null),
    });
    await expect(ref.afterOpened).resolves.toBeUndefined();
    await expect(ref.beforeClosed).resolves.toBeUndefined();
    await expect(ref.afterClosed).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog-ref
```

Expected: 7/7 passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/dialog/mat-dialog-ref.ts src/qwik-material/dialog/mat-dialog-ref.spec.ts
git commit -m "feat(multiple): add MatDialogRef factory + state enum + internal symbols"
```

---

## Phase 3 — Container

### Task 8: `MatDialogContainer` component

**Reference source:** `src/material/dialog/dialog-container.ts` + `dialog-container.html`.

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog-container.tsx`
- Create: `src/qwik-material/dialog/mat-dialog-container.spec.tsx`
- Create: `src/qwik-material/dialog/dialog-container.html.removed.md`

**Interfaces:**
- Consumes: `MatDialogConfig` (T4), `MAT_DIALOG_REF` / `MAT_DIALOG_CONTAINER` / `MAT_DIALOG_DATA` tokens (T5), `MatDialogRef` + `MatDialogState` + `MARK_OPENED` + `MARK_CLOSED` (T7), `parseCssTime` + `useAnimationsDisabled` (T6).
- Produces: `<MatDialogContainer config matDialogRef data>` component. Provides `MAT_DIALOG_REF`, `MAT_DIALOG_CONTAINER`, and `MAT_DIALOG_DATA` contexts down-tree.

- [ ] **Step 1: Create the `.html.removed.md` breadcrumb**

```md
# Folded: dialog-container.html
The Angular template merged into `mat-dialog-container.tsx`'s JSX. The
`<ng-template cdkPortalOutlet />` slot becomes `<Slot />` because Qwik's
component projection replaces the CDK portal indirection at the Material
layer (the qwik-cdk overlay outlet is one level up in the tree).
```

- [ ] **Step 2: Write `mat-dialog-container.tsx`**

```tsx
import {
  $,
  component$,
  Slot,
  useContextProvider,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
  type NoSerialize,
  type Signal,
  type QRL,
} from '@builder.io/qwik';
import type {MatDialogConfig} from './mat-dialog-config';
import {
  MAT_DIALOG_CONTAINER,
  MAT_DIALOG_DATA,
  MAT_DIALOG_REF,
  type MatDialogContainerApi,
} from './mat-dialog-tokens';
import {
  MARK_CLOSED,
  MARK_OPENED,
  MatDialogState,
  type MatDialogRef,
} from './mat-dialog-ref';
import {parseCssTime} from './parse-css-time';
import {useAnimationsDisabled} from './use-animations-disabled';

/** MDC class prefixes. Toggled by the container's animation state machine. */
const OPENING_CLASS = 'mdc-dialog--opening';
const OPEN_CLASS = 'mdc-dialog--open';
const CLOSING_CLASS = 'mdc-dialog--closing';

/** Default durations matching Angular MatDialog exactly. */
const DEFAULT_ENTER_MS = 150;
const DEFAULT_EXIT_MS = 75;

export interface MatDialogContainerProps {
  /** Merged MatDialogConfig for this dialog. Passed as a plain object (spread — never a class instance) so Qwik can serialise props cleanly. */
  config: Partial<MatDialogConfig>;
  /** The consumer-facing MatDialogRef for this dialog. Wrapped in NoSerialize because it holds Promise resolvers. */
  matDialogRef: NoSerialize<MatDialogRef> | undefined;
}

export const MatDialogContainer = component$<MatDialogContainerProps>(
  ({config, matDialogRef}) => {
    // Local state machine controls MDC class toggling.
    const phase = useSignal<'opening' | 'open' | 'closing' | 'closed'>('opening');
    const animationsDisabled = useAnimationsDisabled();

    const enterMs = parseCssTime(config.enterAnimationDuration) ?? DEFAULT_ENTER_MS;
    const exitMs = parseCssTime(config.exitAnimationDuration) ?? DEFAULT_EXIT_MS;

    // Titles register their auto-generated (or user-set) id here so the
    // container's host element can set aria-labelledby to the first entry.
    const titleIds = useStore<{list: readonly string[]}>({list: []});
    const actionSectionCount = useSignal(0);

    // Provide the internal container API for descendant content components.
    const containerApi: MatDialogContainerApi = {
      registerTitleId$: $((id: string) => {
        titleIds.list = [...titleIds.list, id];
      }),
      unregisterTitleId$: $((id: string) => {
        titleIds.list = titleIds.list.filter(x => x !== id);
      }),
      incrementActionSectionCount$: $(() => {
        actionSectionCount.value = actionSectionCount.value + 1;
      }),
      decrementActionSectionCount$: $(() => {
        actionSectionCount.value = Math.max(0, actionSectionCount.value - 1);
      }),
    };
    useContextProvider(MAT_DIALOG_CONTAINER, containerApi);

    // Provide the ref and data for descendants.
    if (matDialogRef) {
      useContextProvider(MAT_DIALOG_REF, matDialogRef);
    }
    useContextProvider(MAT_DIALOG_DATA, config.data);

    // Enter animation: opening → open after enterMs. Skip the timer if
    // animations are disabled.
    useVisibleTask$(({cleanup}) => {
      if (animationsDisabled.value) {
        phase.value = 'open';
        matDialogRef?.[MARK_OPENED]();
        return;
      }
      const t = setTimeout(() => {
        phase.value = 'open';
        matDialogRef?.[MARK_OPENED]();
      }, enterMs);
      cleanup(() => clearTimeout(t));
    });

    // Exit animation: track matDialogRef.state; when it transitions to CLOSING,
    // toggle the closing class, wait exitMs (or 0 if animations disabled), then
    // call [MARK_CLOSED] on the ref to resolve afterClosed and dispose the overlay.
    useTask$(({track, cleanup}) => {
      const s = track(() => matDialogRef?.state.value);
      if (s !== MatDialogState.CLOSING) return;
      phase.value = 'closing';
      const t = setTimeout(
        () => {
          phase.value = 'closed';
          matDialogRef?.[MARK_CLOSED]();
        },
        animationsDisabled.value ? 0 : exitMs,
      );
      cleanup(() => clearTimeout(t));
    });

    const ariaLabelledBy = config.ariaLabel ? null : (titleIds.list[0] ?? null);

    const cls = [
      'mat-mdc-dialog-container',
      'mdc-dialog',
      phase.value === 'opening' && OPENING_CLASS,
      phase.value === 'open' && OPEN_CLASS,
      phase.value === 'closing' && CLOSING_CLASS,
      animationsDisabled.value && '_mat-animation-noopable',
      actionSectionCount.value > 0 && 'mat-mdc-dialog-container-with-actions',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        class={cls}
        tabIndex={-1}
        role={config.role ?? 'dialog'}
        aria-modal={(config.ariaModal ?? true) ? 'true' : 'false'}
        aria-label={config.ariaLabel ?? undefined}
        aria-labelledby={ariaLabelledBy ?? undefined}
        aria-describedby={config.ariaDescribedBy ?? undefined}
        id={config.id ?? undefined}
      >
        <div class="mat-mdc-dialog-inner-container mdc-dialog__container">
          <div class="mat-mdc-dialog-surface mdc-dialog__surface">
            <Slot />
          </div>
        </div>
      </div>
    );
  },
);
```

- [ ] **Step 3: Write `mat-dialog-container.spec.tsx` (module-import smoke)**

The container renders inside CdkDialogContainer which triggers the known-hanging happy-dom + Qwik-optimizer path (see qwik-cdk `overlay-container-outlet.spec.tsx`, deferred). Keep the container spec as a module-import shape check; behavioural verification lives in the dev-app + Playwright parity tests.

```tsx
import {describe, it, expect} from 'vitest';
import {MatDialogContainer} from './mat-dialog-container';

describe('MatDialogContainer', () => {
  it('is a callable component$', () => {
    expect(typeof MatDialogContainer).toBe('function');
  });
});
```

- [ ] **Step 4: Run tests + typecheck**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog-container
pnpm -C src/qwik-material typecheck
```

Expected: 1/1 spec passes; typecheck emits no errors.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/dialog/mat-dialog-container.tsx src/qwik-material/dialog/mat-dialog-container.spec.tsx src/qwik-material/dialog/dialog-container.html.removed.md
git commit -m "feat(multiple): add MatDialogContainer with animation state machine and aria wiring"
```

---

## Phase 4 — Content components

### Task 9: `<MatDialogTitle>`

**Reference source:** `src/material/dialog/dialog-content-directives.ts` (the `MatDialogTitle` class + `MatDialogLayoutSection` shared behavior).

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog-title.tsx`
- Create: `src/qwik-material/dialog/mat-dialog-title.spec.tsx`

**Interfaces:**
- Consumes: `MAT_DIALOG_CONTAINER` (T5).
- Produces: `<MatDialogTitle id?>` — Qwik component. On mount registers its id with the container so `aria-labelledby` picks it up; on unmount unregisters.

- [ ] **Step 1: Write `mat-dialog-title.tsx`**

```tsx
import {component$, Slot, useContext, useSignal, useVisibleTask$} from '@builder.io/qwik';
import {MAT_DIALOG_CONTAINER} from './mat-dialog-tokens';

let _idSeq = 0;
function nextTitleId(): string {
  return `mat-mdc-dialog-title-${_idSeq++}`;
}

export interface MatDialogTitleProps {
  /** Optional id; when omitted, a stable per-mount id is generated. */
  id?: string;
}

export const MatDialogTitle = component$<MatDialogTitleProps>(props => {
  const container = useContext(MAT_DIALOG_CONTAINER, undefined);
  const idSignal = useSignal<string>(props.id ?? nextTitleId());

  useVisibleTask$(({cleanup}) => {
    const id = idSignal.value;
    container?.registerTitleId$(id);
    cleanup(() => container?.unregisterTitleId$(id));
  });

  return (
    <h2 id={idSignal.value} class="mat-mdc-dialog-title mdc-dialog__title">
      <Slot />
    </h2>
  );
});
```

- [ ] **Step 2: Write `mat-dialog-title.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatDialogTitle} from './mat-dialog-title';

describe('MatDialogTitle', () => {
  it('is a callable component$', () => {
    expect(typeof MatDialogTitle).toBe('function');
  });
});
```

- [ ] **Step 3: Run test**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog-title
```

Expected: 1/1 passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/dialog/mat-dialog-title.tsx src/qwik-material/dialog/mat-dialog-title.spec.tsx
git commit -m "feat(multiple): add <MatDialogTitle>"
```

---

### Task 10: `<MatDialogContent>`

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog-content.tsx`
- Create: `src/qwik-material/dialog/mat-dialog-content.spec.tsx`

**Interfaces:**
- Consumes: none.
- Produces: `<MatDialogContent>` — pure styling wrapper.

- [ ] **Step 1: Write `mat-dialog-content.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';

export const MatDialogContent = component$(() => (
  <div class="mat-mdc-dialog-content mdc-dialog__content">
    <Slot />
  </div>
));
```

- [ ] **Step 2: Write `mat-dialog-content.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatDialogContent} from './mat-dialog-content';

describe('MatDialogContent', () => {
  it('is a callable component$', () => {
    expect(typeof MatDialogContent).toBe('function');
  });
});
```

- [ ] **Step 3: Run test + commit**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog-content
git add src/qwik-material/dialog/mat-dialog-content.tsx src/qwik-material/dialog/mat-dialog-content.spec.tsx
git commit -m "feat(multiple): add <MatDialogContent>"
```

---

### Task 11: `<MatDialogActions>`

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog-actions.tsx`
- Create: `src/qwik-material/dialog/mat-dialog-actions.spec.tsx`

**Interfaces:**
- Consumes: `MAT_DIALOG_CONTAINER` (T5).
- Produces: `<MatDialogActions align?>` — Qwik component with `align: 'start' | 'center' | 'end'`. On mount increments container action count; on unmount decrements. Container's `actionSectionCount > 0` toggles the `mat-mdc-dialog-container-with-actions` class.

- [ ] **Step 1: Write `mat-dialog-actions.tsx`**

```tsx
import {component$, Slot, useContext, useVisibleTask$} from '@builder.io/qwik';
import {MAT_DIALOG_CONTAINER} from './mat-dialog-tokens';

export interface MatDialogActionsProps {
  align?: 'start' | 'center' | 'end';
}

export const MatDialogActions = component$<MatDialogActionsProps>(props => {
  const container = useContext(MAT_DIALOG_CONTAINER, undefined);

  useVisibleTask$(({cleanup}) => {
    container?.incrementActionSectionCount$();
    cleanup(() => container?.decrementActionSectionCount$());
  });

  const alignClass = props.align ? `mat-mdc-dialog-actions-align-${props.align}` : '';
  const cls = ['mat-mdc-dialog-actions', 'mdc-dialog__actions', alignClass]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={cls}>
      <Slot />
    </div>
  );
});
```

- [ ] **Step 2: Write `mat-dialog-actions.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatDialogActions} from './mat-dialog-actions';

describe('MatDialogActions', () => {
  it('is a callable component$', () => {
    expect(typeof MatDialogActions).toBe('function');
  });
});
```

- [ ] **Step 3: Run test + commit**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog-actions
git add src/qwik-material/dialog/mat-dialog-actions.tsx src/qwik-material/dialog/mat-dialog-actions.spec.tsx
git commit -m "feat(multiple): add <MatDialogActions align?>"
```

---

### Task 12: `<MatDialogClose>`

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog-close.tsx`
- Create: `src/qwik-material/dialog/mat-dialog-close.spec.tsx`

**Interfaces:**
- Consumes: `MAT_DIALOG_REF` (T5), `MatDialogRef.close` (T7).
- Produces: `<MatDialogClose result?>` — button that reads the ref via context and calls `ref.close(result)` on click.

- [ ] **Step 1: Write `mat-dialog-close.tsx`**

```tsx
import {$, component$, Slot, useContext} from '@builder.io/qwik';
import {MAT_DIALOG_REF} from './mat-dialog-tokens';

export interface MatDialogCloseProps {
  /** Value forwarded to matDialogRef.close(). Consumers read it via ref.afterClosed. */
  result?: unknown;
  /** aria-label for the button. */
  ariaLabel?: string;
  /** Passthrough disabled state. */
  disabled?: boolean;
}

export const MatDialogClose = component$<MatDialogCloseProps>(props => {
  const ref = useContext(MAT_DIALOG_REF, undefined);

  const onClick$ = $(() => {
    ref?.close(props.result as any);
  });

  return (
    <button
      type="button"
      class="mat-mdc-dialog-close"
      aria-label={props.ariaLabel ?? 'Close dialog'}
      disabled={props.disabled}
      onClick$={onClick$}
    >
      <Slot />
    </button>
  );
});
```

- [ ] **Step 2: Write `mat-dialog-close.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatDialogClose} from './mat-dialog-close';

describe('MatDialogClose', () => {
  it('is a callable component$', () => {
    expect(typeof MatDialogClose).toBe('function');
  });
});
```

- [ ] **Step 3: Run test + commit**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog-close
git add src/qwik-material/dialog/mat-dialog-close.tsx src/qwik-material/dialog/mat-dialog-close.spec.tsx
git commit -m "feat(multiple): add <MatDialogClose result?>"
```

---

## Phase 5 — Provider + service

### Task 13: `<QwikMaterialProvider>` component

**Files:**
- Create: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider.spec.tsx`

**Interfaces:**
- Consumes: qwik-cdk's `createBlockScrollStrategy`; the three Material context tokens from T5.
- Produces: `<QwikMaterialProvider>` — provides `MAT_DIALOG_DEFAULT_OPTIONS`, `MAT_DIALOG_SCROLL_STRATEGY`, `MAT_ANIMATIONS_DISABLED` with implicit defaults. Nests inside `<QwikCdkRoot>`.

- [ ] **Step 1: Write `qwik-material-provider.tsx`**

```tsx
import {component$, Slot, useContextProvider, useSignal} from '@builder.io/qwik';
import type {ScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import {createBlockScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import {
  MAT_ANIMATIONS_DISABLED,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
} from './mat-dialog-tokens';

export interface QwikMaterialProviderProps {
  /** Defaults merged into every MatDialog open() config. */
  matDialogDefaults?: Partial<MatDialogConfig>;
  /** Factory returning the default ScrollStrategy for MatDialog. Defaults to createBlockScrollStrategy(). */
  matDialogScrollStrategyFactory?: () => ScrollStrategy;
  /** Disables all Material animations globally when true. */
  animationsDisabled?: boolean;
}

export const QwikMaterialProvider = component$<QwikMaterialProviderProps>(props => {
  const animationsDisabled = useSignal(props.animationsDisabled ?? false);

  useContextProvider(MAT_DIALOG_DEFAULT_OPTIONS, props.matDialogDefaults ?? {});
  useContextProvider(
    MAT_DIALOG_SCROLL_STRATEGY,
    props.matDialogScrollStrategyFactory ?? (() => createBlockScrollStrategy()),
  );
  useContextProvider(MAT_ANIMATIONS_DISABLED, animationsDisabled);

  return <Slot />;
});
```

- [ ] **Step 2: Write `qwik-material-provider.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider} from './qwik-material-provider';

describe('QwikMaterialProvider', () => {
  it('is a callable component$', () => {
    expect(typeof QwikMaterialProvider).toBe('function');
  });
});
```

- [ ] **Step 3: Run test + commit**

```bash
pnpm -C src/qwik-material test dialog/qwik-material-provider
git add src/qwik-material/dialog/qwik-material-provider.tsx src/qwik-material/dialog/qwik-material-provider.spec.tsx
git commit -m "feat(multiple): add <QwikMaterialProvider>"
```

---

### Task 14: `useMatDialog()` + `createMatDialogService()` + internal wrapper

**Reference source:** `src/material/dialog/dialog.ts`.

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog.ts`
- Create: `src/qwik-material/dialog/mat-dialog.spec.ts`
- Create: `src/qwik-material/dialog/dialog-module.removed.md`

**Interfaces:**
- Consumes: `MatDialogConfig` (T4), `MAT_DIALOG_DEFAULT_OPTIONS` + `MAT_DIALOG_SCROLL_STRATEGY` (T5), `createMatDialogRef` + `MatDialogState` (T7), `MatDialogContainer` (T8), qwik-cdk's `useDialog` + `DialogConfig` types.
- Produces:
  - `interface MatDialog { open$, close$, closeAll$, getDialogById$, openDialogs }`
  - `useMatDialog(): MatDialog` — the consumer hook.
  - `createMatDialogService(deps): MatDialogService` — pure factory used by both the hook and vitest.

- [ ] **Step 1: Create the `.removed.md` breadcrumb**

```md
# Not ported: dialog-module.ts
NgModules do not exist in Qwik. The consumer surface is the
`useMatDialog()` hook (see `mat-dialog.ts`). The default-options,
scroll-strategy, and animations-disabled contexts are wired via
`<QwikMaterialProvider>` (see `qwik-material-provider.tsx`).
```

- [ ] **Step 2: Write `mat-dialog.ts`**

```ts
import {
  $,
  component$,
  noSerialize,
  useContext,
  useContextProvider,
  useSignal,
  useStore,
  type Component,
  type NoSerialize,
  type QRL,
  type Signal,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {useDialog} from '@angular-community/qwik-cdk/dialog';
import type {DialogConfig as CdkDialogConfig} from '@angular-community/qwik-cdk/dialog';
import type {MatDialogConfig} from './mat-dialog-config';
import {
  createMatDialogRef,
  MatDialogState,
  type MatDialogRef,
} from './mat-dialog-ref';
import {MatDialogContainer} from './mat-dialog-container';
import {
  MAT_DIALOG_DATA,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
} from './mat-dialog-tokens';

/**
 * Internal wrapper component that MatDialog opens via the cdk overlay. It
 * receives the merged config, the consumer's body component, and the
 * per-dialog MatDialogRef (NoSerialize-wrapped) as plain-object props.
 * Consumers never construct this directly.
 */
const MatDialogWrapper = component$<{
  config: Partial<MatDialogConfig>;
  ContentComponent: Component<any>;
  contentProps: Record<string, unknown>;
  matDialogRef: NoSerialize<MatDialogRef> | undefined;
}>(({config, ContentComponent, contentProps, matDialogRef}) => {
  return (
    <MatDialogContainer config={config} matDialogRef={matDialogRef}>
      <ContentComponent {...(contentProps as any)} />
    </MatDialogContainer>
  );
});

/**
 * Consumer-facing MatDialog service, matching the shape of qwik-cdk's Dialog
 * but with the Material-flavoured MatDialogRef return type and merging of
 * defaults from the MAT_DIALOG_DEFAULT_OPTIONS context.
 */
export interface MatDialog {
  open$: QRL<
    <C, D = unknown, R = unknown>(
      component: Component<any>,
      config?: MatDialogConfig<D>,
    ) => NoSerialize<MatDialogRef<R, C>> | null
  >;
  close$: QRL<(id: string, result?: unknown) => void>;
  closeAll$: QRL<() => void>;
  getDialogById$: QRL<(id: string) => NoSerialize<MatDialogRef> | undefined>;
  readonly openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
}

export function useMatDialog(): MatDialog {
  const cdk = useDialog();
  const defaults = useContext(MAT_DIALOG_DEFAULT_OPTIONS, {} as Partial<MatDialogConfig>);
  const scrollStrategyFactory = useContext(MAT_DIALOG_SCROLL_STRATEGY, undefined);

  // openDialogs is a derived signal — a live map from qwik-cdk's openDialogs
  // to the wrapping MatDialogRefs we've minted. Stored in a useStore keyed
  // by dialog id.
  const matRefsById = useStore<Record<string, NoSerialize<MatDialogRef>>>({});
  const openDialogs = useSignal<readonly NoSerialize<MatDialogRef>[]>([]);

  // `cdk.open$` is a QRL — calls return `Promise<NoSerialize<DialogRef>|null>`.
  // Our own `open$` returns a QRL too, so `await` is fine inside the body.
  //
  // Ordering challenge: MatDialogWrapper renders as soon as cdk.open$ pushes
  // it into the overlay registry, which happens INSIDE the awaited call. At
  // wrapper-render time we don't yet have the cdk ref (still in-flight from
  // cdk.open$), but the wrapper needs the matDialogRef to provide via context
  // for its descendants (MatDialogClose etc.).
  //
  // Solution: mint the matRef BEFORE calling cdk.open$, using a `cdkShim`
  // whose methods delegate to a `.real` slot filled in AFTER cdk.open$
  // resolves. The wrapper reads a stable matRef; close() from a
  // MatDialogClose click before the shim is populated is a no-op (the
  // window where this matters is a single microtask on real hardware).
  const open$ = $(
    async <C, D, R>(
      component: Component<any>,
      config?: MatDialogConfig<D>,
    ): Promise<NoSerialize<MatDialogRef<R, C>> | null> => {
      const merged: MatDialogConfig<D> = Object.assign(
        {} as MatDialogConfig<D>,
        defaults,
        config ?? {},
      );

      if (!merged.scrollStrategy && scrollStrategyFactory) {
        merged.scrollStrategy = scrollStrategyFactory();
      }

      // SSR no-op: return a pre-CLOSED ref that resolves all three promises
      // immediately so awaiters never hang on the server.
      if (!isBrowser) {
        const state = {value: MatDialogState.CLOSED} as Signal<MatDialogState>;
        const componentInstance = {value: null} as Signal<C | null>;
        merged.id = merged.id ?? 'mat-dialog-ssr-noop';
        const fakeCdkRef = {
          dispose() {},
          updatePosition() {},
          updateSize(_o: any) {},
          addPanelClass(_c: any) {},
          removePanelClass(_c: any) {},
        };
        const ref = createMatDialogRef<R, C>({
          cdkRef: fakeCdkRef,
          config: merged,
          state,
          componentInstance,
        });
        return noSerialize(ref);
      }

      // Pre-mint state signals and the cdkShim so the matRef can exist BEFORE
      // cdk.open$ is called.
      const state = {value: MatDialogState.OPEN} as Signal<MatDialogState>;
      const componentInstance = {value: null} as Signal<C | null>;
      interface CdkShim {
        real: null | {
          dispose(): void;
          updatePosition(): void;
          updateSize(o: {width?: string | number; height?: string | number}): void;
          addPanelClass(c: string | string[]): void;
          removePanelClass(c: string | string[]): void;
        };
        dispose(): void;
        updatePosition(): void;
        updateSize(o: {width?: string | number; height?: string | number}): void;
        addPanelClass(c: string | string[]): void;
        removePanelClass(c: string | string[]): void;
      }
      const cdkShim: CdkShim = {
        real: null,
        dispose() {
          this.real?.dispose();
        },
        updatePosition() {
          this.real?.updatePosition();
        },
        updateSize(o) {
          this.real?.updateSize(o);
        },
        addPanelClass(c) {
          this.real?.addPanelClass(c);
        },
        removePanelClass(c) {
          this.real?.removePanelClass(c);
        },
      };
      const matRef = createMatDialogRef<R, C>({
        cdkRef: cdkShim,
        config: merged,
        state,
        componentInstance,
      });
      const wrapped = noSerialize(matRef)!;

      // Build the CdkDialogConfig from the MatDialogConfig. The CDK layer
      // knows nothing about MDC animation durations or DialogPosition; those
      // are Material-only concerns handled by MatDialogContainer.
      const cdkConfig: CdkDialogConfig = {
        id: merged.id,
        role: merged.role,
        panelClass: merged.panelClass,
        hasBackdrop: merged.hasBackdrop ?? true,
        backdropClass: merged.backdropClass,
        disableClose: merged.disableClose,
        width: merged.width,
        height: merged.height,
        minWidth: merged.minWidth,
        minHeight: merged.minHeight,
        maxWidth: merged.maxWidth,
        maxHeight: merged.maxHeight,
        direction: merged.direction,
        ariaDescribedBy: merged.ariaDescribedBy,
        ariaLabelledBy: merged.ariaLabelledBy,
        ariaLabel: merged.ariaLabel,
        ariaModal: merged.ariaModal ?? true,
        autoFocus: merged.autoFocus,
        restoreFocus: merged.restoreFocus,
        closeOnNavigation: merged.closeOnNavigation,
        data: merged.data,
        scrollStrategy: merged.scrollStrategy,
        context: merged.context,
        onBackdropClick$: merged.onBackdropClick$,
        onKeydown$: merged.onKeydown$,
        onOutsidePointer$: merged.onOutsidePointer$,
      };

      const cdkRef = await cdk.open$(
        MatDialogWrapper as any,
        {
          config: {...merged},
          ContentComponent: component,
          contentProps: {},
          matDialogRef: wrapped,
        } as any,
        cdkConfig as any,
      );

      if (!cdkRef) return null;

      // Point the shim at the real cdk ref. Any close() calls that arrived
      // during the microtask window between open$ start and now (extremely
      // rare — the wrapper hasn't rendered its close button yet) are lost;
      // documented as a Task 20 SYNC.md deviation.
      cdkShim.real = cdkRef as any;

      // Track in matRefsById + openDialogs signal.
      matRefsById[matRef.id] = wrapped;
      openDialogs.value = [...openDialogs.value, wrapped];

      // Wire cleanup: when the matRef's afterClosed resolves, remove from tracking.
      matRef.afterClosed.then(() => {
        delete matRefsById[matRef.id];
        openDialogs.value = openDialogs.value.filter(r => r?.id !== matRef.id);
      });

      return wrapped;
    },
  );

  const close$ = $((id: string, result?: unknown) => {
    const ref = matRefsById[id];
    if (ref) ref.close(result as any);
  });

  const closeAll$ = $(() => {
    for (const r of openDialogs.value) r?.close();
  });

  const getDialogById$ = $((id: string): NoSerialize<MatDialogRef> | undefined => {
    return matRefsById[id];
  });

  return {open$, close$, closeAll$, getDialogById$, openDialogs};
}

/**
 * Pure factory used by vitest to test the merge logic and delegation shape
 * without going through Qwik hooks. Consumers should use useMatDialog().
 *
 * The vitest harness supplies its own `cdk` (a fake with an `open` method),
 * `defaults`, and `scrollStrategyFactory`; the factory returns the same
 * MatDialog shape.
 */
export interface CreateMatDialogServiceDeps {
  cdk: {
    open<C, D, R>(
      component: Component<any>,
      props: any,
      config?: CdkDialogConfig,
    ): {
      dispose(): void;
      updatePosition(): void;
      updateSize(opts: {width?: string | number; height?: string | number}): void;
      addPanelClass(c: string | string[]): void;
      removePanelClass(c: string | string[]): void;
    } | null;
  };
  defaults: Partial<MatDialogConfig>;
  scrollStrategyFactory?: () => import('@angular-community/qwik-cdk/overlay').ScrollStrategy;
  openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
  matRefsById: Record<string, NoSerialize<MatDialogRef>>;
}

export interface MatDialogService {
  open<C, D, R>(component: Component<any>, config?: MatDialogConfig<D>): MatDialogRef<R, C> | null;
  close(id: string, result?: unknown): void;
  closeAll(): void;
  getDialogById<R>(id: string): MatDialogRef<R> | undefined;
}

export function createMatDialogService(deps: CreateMatDialogServiceDeps): MatDialogService {
  return {
    open<C, D, R>(component, config): MatDialogRef<R, C> | null {
      const merged: MatDialogConfig<D> = Object.assign(
        {} as MatDialogConfig<D>,
        deps.defaults,
        config ?? {},
      );
      if (!merged.scrollStrategy && deps.scrollStrategyFactory) {
        merged.scrollStrategy = deps.scrollStrategyFactory();
      }

      const cdkRef = deps.cdk.open<C, D, R>(
        MatDialogWrapper,
        {
          config: {...merged},
          ContentComponent: component,
          contentProps: {},
          matDialogRef: undefined,
        },
        {} as CdkDialogConfig,
      );
      if (!cdkRef) return null;

      const state = {value: MatDialogState.OPEN} as Signal<MatDialogState>;
      const componentInstance = {value: null} as Signal<C | null>;
      const matRef = createMatDialogRef<R, C>({
        cdkRef,
        config: merged,
        state,
        componentInstance,
      });

      deps.matRefsById[matRef.id] = noSerialize(matRef)!;
      deps.openDialogs.value = [...deps.openDialogs.value, noSerialize(matRef)!];
      matRef.afterClosed.then(() => {
        delete deps.matRefsById[matRef.id];
        deps.openDialogs.value = deps.openDialogs.value.filter(r => r?.id !== matRef.id);
      });

      return matRef;
    },
    close(id, result) {
      deps.matRefsById[id]?.close(result as any);
    },
    closeAll() {
      for (const r of deps.openDialogs.value) r?.close();
    },
    getDialogById<R>(id: string): MatDialogRef<R> | undefined {
      return deps.matRefsById[id] as MatDialogRef<R> | undefined;
    },
  };
}
```

- [ ] **Step 3: Write `mat-dialog.spec.ts`**

Focus the vitest port on the pure factory `createMatDialogService`, which is
the piece we can drive without Qwik hooks.

```ts
import {describe, it, expect, beforeEach} from 'vitest';
import {component$, jsx, type NoSerialize, type Signal} from '@builder.io/qwik';
import {createMatDialogService, type MatDialogService} from './mat-dialog';
import type {MatDialogRef} from './mat-dialog-ref';
import {MatDialogState, MARK_CLOSED} from './mat-dialog-ref';

const StubBody = component$<{msg?: string}>(() => jsx('div', {}, 'stub'));

function makeStubCdk() {
  const disposed: string[] = [];
  return {
    disposed,
    open<C, D, R>(_c: any, _props: any, _cfg: any) {
      let idSeq = 0;
      const id = `stub-cdk-${idSeq++}`;
      return {
        id,
        dispose() {
          disposed.push(id);
        },
        updatePosition() {},
        updateSize(_o: any) {},
        addPanelClass(_c: any) {},
        removePanelClass(_c: any) {},
      };
    },
  };
}

function makeService(defaults: Partial<any> = {}): {
  service: MatDialogService;
  openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
  matRefsById: Record<string, NoSerialize<MatDialogRef>>;
  cdk: ReturnType<typeof makeStubCdk>;
} {
  const openDialogs = {value: [] as readonly NoSerialize<MatDialogRef>[]} as Signal<
    readonly NoSerialize<MatDialogRef>[]
  >;
  const matRefsById: Record<string, NoSerialize<MatDialogRef>> = {};
  const cdk = makeStubCdk();
  const service = createMatDialogService({
    cdk,
    defaults,
    openDialogs,
    matRefsById,
  });
  return {service, openDialogs, matRefsById, cdk};
}

describe('createMatDialogService', () => {
  it('open() returns a MatDialogRef with an id', () => {
    const {service} = makeService({id: 'from-defaults'});
    const ref = service.open(StubBody);
    expect(ref).not.toBeNull();
    expect(ref!.id).toBe('from-defaults');
  });

  it('open() pushes into openDialogs signal', () => {
    const {service, openDialogs} = makeService({id: 'x'});
    service.open(StubBody);
    expect(openDialogs.value.length).toBe(1);
  });

  it('close(id) closes the correct dialog', async () => {
    const {service, openDialogs} = makeService();
    const refA = service.open(StubBody, {id: 'a'})!;
    const refB = service.open(StubBody, {id: 'b'})!;
    service.close('a');
    refA[MARK_CLOSED](); // simulate the container's animation-end callback
    await refA.afterClosed;
    expect(openDialogs.value.map(r => r?.id)).toEqual(['b']);
    expect(refB.state.value).toBe(MatDialogState.OPEN);
  });

  it('closeAll() closes every open dialog', async () => {
    const {service} = makeService();
    const refA = service.open(StubBody, {id: 'a'})!;
    const refB = service.open(StubBody, {id: 'b'})!;
    service.closeAll();
    expect(refA.state.value).toBe(MatDialogState.CLOSING);
    expect(refB.state.value).toBe(MatDialogState.CLOSING);
  });

  it('getDialogById() returns the ref by id or undefined', () => {
    const {service} = makeService();
    const ref = service.open(StubBody, {id: 'find-me'})!;
    expect(service.getDialogById('find-me')).toBe(ref);
    expect(service.getDialogById('not-there')).toBeUndefined();
  });

  it('config passed to open() overrides defaults', () => {
    const {service} = makeService({id: 'from-defaults', hasBackdrop: false});
    const ref = service.open(StubBody, {id: 'from-open', hasBackdrop: true})!;
    expect(ref.id).toBe('from-open');
    expect(ref.config.hasBackdrop).toBe(true);
  });

  it('close(result) resolves afterClosed with the result after MARK_CLOSED', async () => {
    const {service} = makeService();
    const ref = service.open<any, unknown, string>(StubBody, {id: 'x'})!;
    ref.close('closed-result');
    ref[MARK_CLOSED]();
    await expect(ref.afterClosed).resolves.toBe('closed-result');
  });
});
```

- [ ] **Step 4: Run tests + typecheck**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog
pnpm -C src/qwik-material typecheck
```

Expected: 7/7 tests pass, no typecheck errors.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/dialog/mat-dialog.ts src/qwik-material/dialog/mat-dialog.spec.ts src/qwik-material/dialog/dialog-module.removed.md
git commit -m "feat(multiple): add useMatDialog hook + createMatDialogService factory"
```

---

## Phase 6 — Public API + build validation

### Task 15: `public-api.ts` + `index.ts` + build verification

**Files:**
- Create: `src/qwik-material/dialog/public-api.ts`
- Create: `src/qwik-material/dialog/index.ts`
- Modify: `src/qwik-material/index.ts` (replace the empty stub with real re-exports)
- Create: `src/qwik-material/dialog/SYNC.md`

**Interfaces:**
- Consumes: everything from Tasks 4-14.
- Produces: the public consumer surface. `import { useMatDialog, MatDialogContainer, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, QwikMaterialProvider, MatDialogState } from '@angular-community/qwik-material/dialog';`

- [ ] **Step 1: Write `src/qwik-material/dialog/public-api.ts`**

```ts
export type {MatDialogConfig, AutoFocusTarget, DialogRole, DialogPosition} from './mat-dialog-config';
export type {MatDialogRef} from './mat-dialog-ref';
export {createMatDialogRef, MatDialogState, MARK_OPENED, MARK_CLOSED} from './mat-dialog-ref';
export type {MatDialog, MatDialogService, CreateMatDialogServiceDeps} from './mat-dialog';
export {useMatDialog, createMatDialogService} from './mat-dialog';
export {MatDialogContainer} from './mat-dialog-container';
export type {MatDialogContainerProps} from './mat-dialog-container';
export {MatDialogTitle} from './mat-dialog-title';
export type {MatDialogTitleProps} from './mat-dialog-title';
export {MatDialogContent} from './mat-dialog-content';
export {MatDialogActions} from './mat-dialog-actions';
export type {MatDialogActionsProps} from './mat-dialog-actions';
export {MatDialogClose} from './mat-dialog-close';
export type {MatDialogCloseProps} from './mat-dialog-close';
export {QwikMaterialProvider} from './qwik-material-provider';
export type {QwikMaterialProviderProps} from './qwik-material-provider';
export {parseCssTime} from './parse-css-time';
export {useAnimationsDisabled} from './use-animations-disabled';
export {
  MAT_DIALOG_DATA,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
  MAT_DIALOG_REF,
  MAT_DIALOG_CONTAINER,
  MAT_ANIMATIONS_DISABLED,
} from './mat-dialog-tokens';
export type {MatDialogContainerApi} from './mat-dialog-tokens';
```

- [ ] **Step 2: Write `src/qwik-material/dialog/index.ts`**

```ts
export * from './public-api';
```

- [ ] **Step 3: Replace `src/qwik-material/index.ts`**

```ts
// Top-level convenience re-exports of the QwikMaterialProvider and useMatDialog
// so simple apps can do `import { useMatDialog } from '@angular-community/qwik-material'`.
// Full API lives at the per-entry-point exports (e.g. `/dialog`).
export {useMatDialog, QwikMaterialProvider} from './dialog/public-api';
export type {MatDialog, MatDialogConfig, MatDialogRef} from './dialog/public-api';
```

- [ ] **Step 4: Write `src/qwik-material/dialog/SYNC.md`**

```md
# Sync log: mat-dialog

Last synced from angular/components commit: <unsynced — initial port>

Synced files (mapped from src/material/dialog/):
- mat-dialog-config.ts ← dialog-config.ts (initial port, spec-driven)
- mat-dialog-ref.ts ← dialog-ref.ts (initial port, spec-driven)
- mat-dialog-container.tsx ← dialog-container.ts + dialog-container.html (initial port, spec-driven)
- mat-dialog.ts ← dialog.ts (initial port, spec-driven)
- mat-dialog-title.tsx ← dialog-content-directives.ts (MatDialogTitle portion)
- mat-dialog-content.tsx ← dialog-content-directives.ts (MatDialogContent portion)
- mat-dialog-actions.tsx ← dialog-content-directives.ts (MatDialogActions portion)
- mat-dialog-close.tsx ← dialog-content-directives.ts (MatDialogClose portion)

Intentionally not ported:
- dialog-module.ts (NgModules don't exist in Qwik)
- dialog-container.html (folded into mat-dialog-container.tsx JSX)
- dialog.zone.spec.ts (NgZone-specific change-detection test — no Qwik analogue)
- testing/dialog-harness.ts + dialog-opener.ts (harness deferred; separate project)

Open deviations (from spec §10):
- MatDialog.open(templateRef, …) removed (no TemplateRef in Qwik).
- MatDialogConfig.viewContainerRef / injector / componentFactoryResolver removed.
- MatDialogConfig.providers → MatDialogConfig.context (OverlayContextOverride[]).
- MatDialogRef.afterOpened(): Observable → afterOpened: Promise<void>.
- MatDialogRef.afterClosed(): Observable → afterClosed: Promise<R>.
- MatDialogRef.beforeClosed(): Observable → beforeClosed: Promise<R>.
- MatDialogRef.backdropClick(): Observable → MatDialogConfig.onBackdropClick$: QRL.
- MatDialogRef.keydownEvents(): Observable → MatDialogConfig.onKeydown$: QRL.
- MatDialog.afterOpened: Subject removed (derive from openDialogs signal).
- MatDialog.afterAllClosed: Observable removed (derive from openDialogs.value.length === 0).
- MatDialog.ngOnDestroy removed.
- MatDialogContainer._animationStateChanged: EventEmitter removed (internal event).
- MatDialogRef.componentRef: ComponentRef<T> removed.
- MatDialogRef.componentInstance: T → componentInstance: Signal<T | null>.
- NgModule MatDialogModule removed.
- Content directives are Qwik components, not directives.
- Angular Material core's _animationsDisabled() replaced by useAnimationsDisabled().
- MatDialogContainer extends CdkDialogContainer → JSX composition.
- MatDialogHarness deferred.
- SCSS theming mixin (mat.dialog-theme) not exposed until qwik-material/core lands. Only structural + prebuilt CSS ships.

Scenario port log (mat-dialog.spec.ts):
- Port lands in Task 16. This file will be updated with per-`it` status after that task.
Total: <populated in Task 16>
```

- [ ] **Step 5: Typecheck + build**

```bash
pnpm -C src/qwik-material typecheck
pnpm -C src/qwik-material build
```

Expected: typecheck emits no errors; build emits `dist/index.js`, `dist/dialog/index.js`, `dist/dialog-prebuilt.css`.

- [ ] **Step 6: Verify the `no exported classes` rule**

```bash
grep -nE "^export class" src/qwik-material/dialog/public-api.ts src/qwik-material/index.ts src/qwik-material/dialog/index.ts
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-material/dialog/public-api.ts src/qwik-material/dialog/index.ts src/qwik-material/index.ts src/qwik-material/dialog/SYNC.md
git commit -m "feat(multiple): expose qwik-material Dialog public API"
```

---

## Phase 7 — Scenario tests

### Task 16: Vitest scenario port from `dialog.spec.ts`

**Reference source:** `src/material/dialog/dialog.spec.ts` (2534 LOC, ~120 `it(...)` blocks).

**Files:**
- Create: `src/qwik-material/dialog/mat-dialog-scenarios.spec.ts`
- Modify: `src/qwik-material/dialog/SYNC.md` (fill in scenario port log)

**Interfaces:**
- Consumes: `createMatDialogService` (T14).
- Produces: vitest coverage of every scenario the pure factory can express. DOM-render scenarios become `it.skip(name, () => { /* Reason */ })` blocks; Angular-only scenarios become `it.skip` with reasons.

**Approach:** Walk `src/material/dialog/dialog.spec.ts` top to bottom. For each `it(...)`, decide bucket:
- **ported** — write the equivalent vitest test against `createMatDialogService`.
- **skipped-DOM** — `it.skip('… (DOM-render — deferred to Playwright)', () => {})` and add a `Reason:` comment. Later Task 19 (or a follow-up) adds the corresponding Playwright spec.
- **skipped-Angular-only** — `it.skip('… (Angular-only: <what>)', () => {})` and add a `Reason:` comment. Never revisited.

- [ ] **Step 1: Bootstrap the spec file harness**

Copy the header + `makeService` helper from Task 14's `mat-dialog.spec.ts`. Structure the file with `describe('MatDialog scenarios')` blocks matching the Angular spec's `describe` hierarchy.

- [ ] **Step 2: Walk `dialog.spec.ts` sequentially**

For each Angular `it(...)`:

- Read the test body. Ask: does it need a live DOM to observe results (querying elements, checking computed styles, checking that focus lands on a specific element, checking aria attributes on rendered nodes)? If yes → skipped-DOM.
- Does it use Angular-only concepts (`inject(…)`, `TestBed`, `ViewContainerRef`, `Injector.create`, `TemplateRef`, `flush()`, `tick()`, NgZone, ComponentPortal)? If yes → skipped-Angular-only.
- Otherwise → port to a vitest test driving `createMatDialogService`.

**Examples of expected ported tests** (based on scanning the Angular spec):
- "should open a dialog with a component" — port; assert `service.open(StubBody)` returns a non-null ref.
- "should close a dialog and get back a result" — port; assert `close('foo')` + `MARK_CLOSED` resolves `afterClosed` with `'foo'`.
- "should apply the configured role" — port; assert `ref.config.role === 'alertdialog'`.
- "should apply the specified panelClass" — port; assert `ref.config.panelClass === 'my-panel'`.
- "should use user-provided id" — port; assert `ref.id === 'user-id'`.
- "should auto-generate an id if unset" — port; assert `ref.id.length > 0` and different refs get different ids.
- "should close all open dialogs" — port; open 3, call `closeAll()`, assert all transition to CLOSING.
- "should return openDialogs" — port; open 2, assert `openDialogs.value.length === 2`.

**Examples of expected skipped-DOM tests:**
- "should focus the first tabbable element by default" — DOM-render.
- "should close when clicking the backdrop" — DOM-render.
- "should close on Escape by default" — DOM-render.
- "should apply the width and height from config" — DOM-render.
- "should apply aria-label" — DOM-render.

**Examples of expected skipped-Angular-only tests:**
- "should use the injector from the viewContainerRef" — Angular DI.
- "should use the injector passed in the config" — Angular DI.
- "should open a dialog with a template" — TemplateRef.
- "should trigger change detection" — Angular change detection.

- [ ] **Step 3: Run vitest**

```bash
pnpm -C src/qwik-material test dialog/mat-dialog-scenarios
```

Expected: every ported test passes; skipped tests count as skipped (do not fail).

- [ ] **Step 4: Update `dialog/SYNC.md` with scenario stats**

Replace the "Scenario port log" section with real numbers, e.g.:

```md
Scenario port log (mat-dialog-scenarios.spec.ts):
- Ported (service-level): 42
- Skipped (DOM-render — Playwright-covered): 58
- Skipped (Angular-only: DI/TemplateRef/NgZone/ChangeDetection): 20
Total: 120
```

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/dialog/mat-dialog-scenarios.spec.ts src/qwik-material/dialog/SYNC.md
git commit -m "test(multiple): port mat-dialog scenarios from Angular spec"
```

---

## Phase 8 — Dev-app

### Task 17: Dev-app scenario template + first 6 routes

**Reference source:** `src/qwik-cdk-dev-app/src/scenarios/_template.tsx` and `src/qwik-cdk-dev-app/src/routes/dialog/*/index.tsx`.

**Files:**
- Create: `src/qwik-cdk-dev-app/src/scenarios/_mat-template.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/aria-label/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/aria-labelledby/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/aria-describedby/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/role-alertdialog/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/disable-close/index.tsx`
- Modify: `src/qwik-cdk-dev-app/package.json` (add `@angular-community/qwik-material` to deps)

**Interfaces:**
- Consumes: `useMatDialog`, `QwikMaterialProvider`, the four content components.
- Produces: browser-visible routes at `http://localhost:4173/mat-dialog/{basic,aria-label,…}`.

- [ ] **Step 1: Add qwik-material to the dev-app package**

Modify `src/qwik-cdk-dev-app/package.json`:

```json
"dependencies": {
  "@angular-community/qwik-cdk": "workspace:*",
  "@angular-community/qwik-material": "workspace:*"
}
```

Run `pnpm install` at the repo root to link the workspace.

- [ ] **Step 2: Create `src/qwik-cdk-dev-app/src/scenarios/_mat-template.tsx`**

```tsx
import {component$, useVisibleTask$} from '@builder.io/qwik';
import type {Component} from '@builder.io/qwik';
import {useContext} from '@builder.io/qwik';
import {useMatDialog, MAT_DIALOG_DATA} from '@angular-community/qwik-material/dialog';
import type {MatDialogConfig} from '@angular-community/qwik-material/dialog';

export const MatScenarioBody = component$(() => (
  <div class="mat-scenario-body">Material scenario body</div>
));

export const MatDataBody = component$(() => {
  const data = useContext(MAT_DIALOG_DATA) as {msg: string};
  return <div class="mat-scenario-body">{data.msg}</div>;
});

export interface MatAutoOpenProps<D = unknown> {
  Body?: Component<any>;
  config?: MatDialogConfig<D>;
}

export const MatAutoOpen = component$<MatAutoOpenProps>(props => {
  const dialog = useMatDialog();
  useVisibleTask$(async () => {
    await dialog.open$(props.Body ?? MatScenarioBody, props.config as any);
  });
  return <main data-scenario-ready>ready</main>;
});
```

- [ ] **Step 3: Create the six routes**

Each route file follows the same pattern — small variations in the config passed to `MatAutoOpen`. Sample for `/basic`:

```tsx
// src/qwik-cdk-dev-app/src/routes/mat-dialog/basic/index.tsx
import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatAutoOpen} from '../../../scenarios/_mat-template';

export default component$(() => (
  <QwikMaterialProvider>
    <MatAutoOpen config={{hasBackdrop: true}} />
  </QwikMaterialProvider>
));
```

Vary the config across the six routes:
- `basic`: `{hasBackdrop: true}`
- `aria-label`: `{hasBackdrop: true, ariaLabel: 'Settings dialog'}`
- `aria-labelledby`: uses `MatDialogTitle` in the body so aria-labelledby resolves via container registration (pass a body that renders `<MatDialogTitle>Custom title</MatDialogTitle><p>Body</p>` — build a `LabelledBody` component in the route file).
- `aria-describedby`: `{hasBackdrop: true, ariaDescribedBy: 'my-desc'}` with body rendering `<p id="my-desc">Description</p>`.
- `role-alertdialog`: `{hasBackdrop: true, role: 'alertdialog'}`.
- `disable-close`: `{hasBackdrop: true, disableClose: true}`.

- [ ] **Step 4: Rebuild the dev-app and manually smoke test**

```bash
pkill -9 -f vite 2>/dev/null; sleep 1
pnpm -C src/qwik-cdk-dev-app build
pnpm -C src/qwik-cdk-dev-app preview &
sleep 4
curl -s -o /dev/null -w "GET / : HTTP %{http_code}\n" http://localhost:4173/mat-dialog/basic
```

Expected: HTTP 200 for `/mat-dialog/basic`. Manually visit each of the six URLs in a browser and verify the Material Dialog appears with MDC styling, opens with the enter animation, and closes on backdrop / Escape.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-cdk-dev-app/src/scenarios/_mat-template.tsx src/qwik-cdk-dev-app/src/routes/mat-dialog/ src/qwik-cdk-dev-app/package.json
git commit -m "feat(multiple): dev-app mat-dialog template + first 6 scenario routes"
```

---

### Task 18: Remaining 6 dev-app routes

**Files:**
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/close-on-backdrop/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/close-on-escape/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/panel-class/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/has-actions/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/restore-focus/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-dialog/close-with-result/index.tsx`

**Interfaces:**
- Consumes: same as Task 17.
- Produces: six more `/mat-dialog/*` routes.

- [ ] **Step 1: Create the six route files**

Each is structurally the same as Task 17 routes. Bodies and configs:

- **close-on-backdrop**: default config; smoke test confirms clicking the CDK backdrop closes the Material dialog. Body renders `<p>Click outside to close</p>`.
- **close-on-escape**: default config; body renders `<p>Press Escape to close</p>`.
- **panel-class**: `{panelClass: ['my-panel-a', 'my-panel-b']}`. Body renders `<p>Panel classes applied</p>`. Test manually that `.my-panel-a` and `.my-panel-b` land on the cdk-overlay-pane.
- **has-actions**: body is a component rendering `<MatDialogContent>Are you sure?</MatDialogContent><MatDialogActions align="end"><MatDialogClose result="no">No</MatDialogClose><MatDialogClose result="yes">Yes</MatDialogClose></MatDialogActions>`. Test that clicking Yes/No closes and the container gains `mat-mdc-dialog-container-with-actions`.
- **restore-focus**: page has a trigger button that opens the dialog on click (not on visible-task); after closing, focus should return to the trigger. Body has `<button>Focus me</button>` + `<MatDialogClose>Close</MatDialogClose>`.
- **close-with-result**: page opens the dialog on click, `dialog.open$(Body, {…})` returns a ref, then `await ref.afterClosed` and renders the result in the page.

- [ ] **Step 2: Rebuild and manually verify each route**

```bash
pkill -9 -f vite 2>/dev/null; sleep 1
pnpm -C src/qwik-cdk-dev-app build
pnpm -C src/qwik-cdk-dev-app preview &
sleep 4
for r in close-on-backdrop close-on-escape panel-class has-actions restore-focus close-with-result; do
  curl -s -o /dev/null -w "GET /mat-dialog/$r : HTTP %{http_code}\n" "http://localhost:4173/mat-dialog/$r"
done
```

Expected: HTTP 200 or 301 for each. Manually visit each in the browser and verify the described behavior.

- [ ] **Step 3: Commit**

```bash
git add src/qwik-cdk-dev-app/src/routes/mat-dialog/
git commit -m "feat(multiple): dev-app mat-dialog remaining 6 scenario routes"
```

---

## Phase 9 — Playwright parity

### Task 19: Playwright parity — material-dialog scenarios

**Reference source:** `src/qwik-cdk-parity-tests/` package structure + how it drives the qwik-cdk-dev-app.

**Files:**
- Create: `src/qwik-cdk-parity-tests/material-dialog/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/material-dialog/aria.spec.ts`
- Create: `src/qwik-cdk-parity-tests/material-dialog/animation.spec.ts`
- Create: `src/qwik-cdk-parity-tests/material-dialog/backdrop-and-escape.spec.ts`
- Create: `src/qwik-cdk-parity-tests/material-dialog/restore-focus.spec.ts`
- Create: `src/qwik-cdk-parity-tests/material-dialog/close-with-result.spec.ts`
- Modify: `src/qwik-cdk-parity-tests/playwright.config.ts` (if the config enumerates specs — add the new folder to the pattern).

**Interfaces:**
- Consumes: the dev-app routes from Tasks 17-18.
- Produces: six Playwright specs covering the DOM-observation scenarios skipped in Task 16.

- [ ] **Step 1: Draft `basic.spec.ts` as the template**

```ts
// src/qwik-cdk-parity-tests/material-dialog/basic.spec.ts
import {test, expect} from '@playwright/test';

test.describe('Material Dialog — basic', () => {
  test('opens with the MDC container class', async ({page}) => {
    await page.goto('/mat-dialog/basic');
    await expect(page.locator('.mat-mdc-dialog-container')).toBeVisible();
  });

  test('applies mdc-dialog--open once the enter animation completes', async ({page}) => {
    await page.goto('/mat-dialog/basic');
    // Enter animation is 150 ms; wait for the open class to land.
    await expect(page.locator('.mdc-dialog--open')).toBeVisible({timeout: 500});
  });

  test('has aria-modal=true and role=dialog by default', async ({page}) => {
    await page.goto('/mat-dialog/basic');
    const container = page.locator('.mat-mdc-dialog-container');
    await expect(container).toHaveAttribute('aria-modal', 'true');
    await expect(container).toHaveAttribute('role', 'dialog');
  });
});
```

- [ ] **Step 2: Write the remaining 5 spec files**

Each follows the same shape — navigate to a dev-app route, assert on selectors + attributes. Key assertions per spec:

- **aria.spec.ts**: aria-label sets host attribute; aria-labelledby is derived from a rendered `MatDialogTitle`; aria-describedby comes through unchanged; role=alertdialog when set.
- **animation.spec.ts**: `mdc-dialog--opening` visible briefly, then `mdc-dialog--open`; on close, `mdc-dialog--closing` visible, then container detached from the DOM.
- **backdrop-and-escape.spec.ts**: on `/close-on-backdrop`, click the `.cdk-overlay-backdrop` → container detaches; on `/close-on-escape`, press Escape → container detaches; on `/disable-close`, both should not detach.
- **restore-focus.spec.ts**: click the trigger on `/restore-focus`, verify focus is inside the dialog; close via `MatDialogClose`; verify focus returns to the trigger.
- **close-with-result.spec.ts**: on `/close-with-result`, click the trigger; click the button that calls `close('result-a')`; verify the page renders `"result: result-a"` somewhere.

- [ ] **Step 3: Run the Playwright specs**

```bash
pnpm -C src/qwik-cdk-dev-app build && pnpm -C src/qwik-cdk-dev-app preview &
sleep 4
pnpm -C src/qwik-cdk-parity-tests test material-dialog
```

Expected: all 6 specs pass (or skip cleanly if the local machine has no Chromium — parity tests are optional per Task 20).

- [ ] **Step 4: Commit**

```bash
git add src/qwik-cdk-parity-tests/material-dialog/ src/qwik-cdk-parity-tests/playwright.config.ts
git commit -m "test(multiple): Playwright parity specs for MatDialog"
```

---

## Phase 10 — Finalization

### Task 20: SSR-leak lint + root pnpm script + SYNC finalization

**Files:**
- Modify: root `package.json` (add `test:qwik-material` script)
- Modify: `src/qwik-material/SYNC.md` (record final class-count and deviations)

**Interfaces:**
- Consumes: everything.
- Produces: green top-level `pnpm test:qwik-material` command; final SYNC.md with the "no exported classes" statement recorded.

- [ ] **Step 1: Run the SSR-leak lint**

```bash
pnpm -C src/qwik-material lint:no-ssr-leaks
```

Expected: `No SSR leaks.` If leaks are found, fix them at the source (`document.` / `window.` / `getComputedStyle(` / `requestAnimationFrame(` must be inside `useVisibleTask$` or guarded by `typeof document !== 'undefined'`).

- [ ] **Step 2: Add root pnpm script**

Modify the root `package.json` — under `scripts`, add:

```json
"test:qwik-material": "pnpm -C src/qwik-material build && pnpm -C src/qwik-material test && pnpm -C src/qwik-material lint:no-ssr-leaks && pnpm -C src/qwik-material typecheck"
```

- [ ] **Step 3: Run the pipeline**

```bash
pnpm test:qwik-material
```

Expected: build succeeds; vitest reports the ported scenarios green + skipped ones skipped; lint reports "No SSR leaks."; typecheck emits no errors.

- [ ] **Step 4: Final SYNC.md update**

Append to `src/qwik-material/dialog/SYNC.md`:

```md
## Class count

Consumer-facing public API surface: **0 exported classes**. All types are
`interface`s; all constructors are `create*` factories. `MatDialogState` is
an `enum` (not a class). Verified by:

    grep -nE "^export class" src/qwik-material/dialog/public-api.ts src/qwik-material/index.ts src/qwik-material/dialog/index.ts

## Pipeline

Run `pnpm test:qwik-material` from the repo root to verify the package.
```

- [ ] **Step 5: Commit**

```bash
git add package.json src/qwik-material/dialog/SYNC.md
git commit -m "chore(multiple): finalize qwik-material Dialog port with test:qwik-material root script"
```

---

## Success criteria (final self-check)

Before marking the plan complete, verify each item from the spec's §Success criteria:

1. ✅ `pnpm -C src/qwik-material build` succeeds and emits `dist/dialog-prebuilt.css` (Task 3, 15).
2. ✅ `pnpm -C src/qwik-material test` runs green (Tasks 4-16).
3. ✅ `pnpm -C src/qwik-material typecheck` clean (Task 15).
4. ✅ `pnpm -C src/qwik-material lint:no-ssr-leaks` reports "No SSR leaks." (Task 20).
5. ✅ Dev-app renders 12 scenarios (Tasks 17, 18).
6. ✅ Browser smoke test on `/mat-dialog/basic` confirms open/close animations, focus trap, backdrop/Escape/close-button close (Task 17 Step 4 + Task 18 Step 2 manual verifications).
7. ✅ `src/qwik-material/dialog/SYNC.md` catalogs deviations (Tasks 15, 20).
8. ✅ No exported classes (Task 15 Step 6, Task 20 Step 4).
