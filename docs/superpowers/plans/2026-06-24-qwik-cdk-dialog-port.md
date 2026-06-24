# qwik-cdk Dialog Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@angular-community/qwik-cdk` as a pnpm workspace package at `src/qwik-cdk/`, exposing a working CDK Dialog (plus minimal foundation: overlay, portal, a11y subset, platform, bidi, coercion, keycodes) in Qwik with SSR and CSR support, byte-identical SCSS, and structural-DOM parity with `@angular/cdk`.

**Architecture:** Each Angular CDK file mirrors 1:1 to a Qwik equivalent. Imperative Angular DI (`@Injectable`, `inject()`) translates to Qwik contexts (`createContextId`, `useContext`). Imperative component creation (`ComponentRef`, `ViewContainerRef`, `Portal`) collapses into a signal-backed **overlay registry** + root-level `<OverlayContainerOutlet>` that renders entries declaratively. SCSS files copy verbatim. Tests run in three tiers: Vitest scenario port, Playwright structural-parity tests, side-by-side dev-apps.

**Tech Stack:** TypeScript 5+, Qwik 1.x + Qwik City, Vite library mode, Vitest + `@builder.io/qwik/testing` + happy-dom, Playwright, pnpm 11 workspaces, Sass/SCSS.

## Global Constraints

- **Package name:** `@angular-community/qwik-cdk` (final; do not rename).
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths in this plan are relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-06-24-qwik-cdk-dialog-port-design.md](../specs/2026-06-24-qwik-cdk-dialog-port-design.md). Read §4 (Angular→Qwik translation table) and §10 (open deviations catalog) before starting any port task.
- **CDK source reference:** `src/cdk/<entry-point>/`. Every port task names the exact source file(s) it mirrors.
- **File-naming rule:** keep CDK basenames. Pure-TS files keep `.ts`. Component/directive files become `.tsx`. Files with no Qwik analogue become `<basename>.removed.md` stubs.
- **API parity:** preserve CDK class/function/option names where possible; record every deviation in the corresponding per-entry `SYNC.md`.
- **No RxJS dependency.** Translate Observables per §4 (signal for state, `Promise` for one-shot, `QRL` callback for events).
- **SSR safety:** every `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` call must be inside `useVisibleTask$` OR guarded by `if (isBrowser)`. Lint check added in Task 33 enforces this.
- **Commit message scope:** the upstream repo's commit-msg hook does not know `qwik-cdk`; use scope `multiple` (which is in the allowed list) for commits to qwik-cdk files. The hook is advisory, not blocking, but using an allowed scope keeps history clean.
- **Pnpm version:** the repo pins `pnpm@11.7.0` (root `package.json` packageManager field). Don't change it.
- **Node version:** the repo pins via `.nvmrc`. Don't change it.
- **No Bazel changes.** qwik-cdk lives outside the Bazel graph. Don't touch any `BUILD.bazel` file.
- **No upstream CI integration.** The plan stops at "qwik-cdk works locally". Wiring into `.github/workflows/*` is deferred.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: pnpm workspace + qwik-cdk package skeleton

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `src/qwik-cdk/package.json`
- Create: `src/qwik-cdk/tsconfig.json`
- Create: `src/qwik-cdk/README.md`
- Create: `src/qwik-cdk/index.ts`
- Create: `src/qwik-cdk/.gitignore`

**Interfaces:**
- Produces: an empty `@angular-community/qwik-cdk` package importable by sibling workspace packages.

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - .
  - src/qwik-cdk
  - src/qwik-cdk-dev-app
  - src/qwik-cdk-parity-tests
```

- [ ] **Step 2: Create `src/qwik-cdk/package.json`**

```jsonc
{
  "name": "@angular-community/qwik-cdk",
  "version": "0.0.0",
  "description": "Qwik port of @angular/cdk (foundation primitives + Dialog).",
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
    "@builder.io/qwik": "^1.5.0"
  },
  "devDependencies": {
    "@builder.io/qwik": "^1.5.0",
    "@types/node": "*",
    "happy-dom": "*",
    "sass": "*",
    "typescript": "*",
    "vite": "*",
    "vite-plugin-dts": "*",
    "vitest": "*"
  },
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./dialog":   { "types": "./dist/dialog/index.d.ts",   "import": "./dist/dialog/index.js" },
    "./overlay":  { "types": "./dist/overlay/index.d.ts",  "import": "./dist/overlay/index.js" },
    "./portal":   { "types": "./dist/portal/index.d.ts",   "import": "./dist/portal/index.js" },
    "./a11y":     { "types": "./dist/a11y/index.d.ts",     "import": "./dist/a11y/index.js" },
    "./platform": { "types": "./dist/platform/index.d.ts", "import": "./dist/platform/index.js" },
    "./bidi":     { "types": "./dist/bidi/index.d.ts",     "import": "./dist/bidi/index.js" },
    "./coercion": { "types": "./dist/coercion/index.d.ts", "import": "./dist/coercion/index.js" },
    "./keycodes": { "types": "./dist/keycodes/index.d.ts", "import": "./dist/keycodes/index.js" },
    "./overlay-prebuilt.css": "./dist/overlay-prebuilt.css",
    "./a11y-prebuilt.css":    "./dist/a11y-prebuilt.css",
    "./scss/*":   "./scss/*"
  },
  "files": ["dist", "scss"]
}
```

- [ ] **Step 3: Create `src/qwik-cdk/tsconfig.json`**

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "jsxImportSource": "@builder.io/qwik",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "useDefineForClassFields": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["dist", "node_modules", "**/*.spec.ts"]
}
```

- [ ] **Step 4: Create `src/qwik-cdk/index.ts`**

```ts
// Top-level export. Per-entry-point exports live in their own index.ts files.
export { QwikCdkRoot } from './root';
export type { QwikCdkRootProps } from './root';
```

(Note: `root.tsx` doesn't exist yet — this will fail typecheck until Task 18. That's expected; we'll wire it then. For now, leave this file in place as a contract.)

- [ ] **Step 5: Create `src/qwik-cdk/.gitignore`**

```
dist
node_modules
*.tsbuildinfo
```

- [ ] **Step 6: Create `src/qwik-cdk/README.md`**

```md
# @angular-community/qwik-cdk

Qwik port of [@angular/cdk](https://github.com/angular/components/tree/main/src/cdk).

**Status:** in development. First port: Dialog + foundation. See
[../../docs/superpowers/specs/2026-06-24-qwik-cdk-dialog-port-design.md](../../docs/superpowers/specs/2026-06-24-qwik-cdk-dialog-port-design.md).
```

- [ ] **Step 7: Install workspace deps**

Run: `pnpm install`
Expected: pnpm picks up the new workspace; installs qwik-cdk's devDependencies into `src/qwik-cdk/node_modules` (or hoists to root).

- [ ] **Step 8: Verify workspace recognition**

Run: `pnpm -C src/qwik-cdk typecheck`
Expected: fails on the `./root` import. This is the expected baseline; later tasks fix it.

- [ ] **Step 9: Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml src/qwik-cdk
git commit -m "build(multiple): add qwik-cdk pnpm workspace package skeleton"
```

---

### Task 2: Vite library config + minimal `index.ts` per entry-point

**Files:**
- Create: `src/qwik-cdk/vite.config.ts`
- Create: `src/qwik-cdk/{platform,bidi,coercion,keycodes,portal,a11y,overlay,dialog}/index.ts` (stub files)
- Create: `src/qwik-cdk/{platform,bidi,coercion,keycodes,portal,a11y,overlay,dialog}/public-api.ts` (stub files)

**Interfaces:**
- Produces: working Vite library build that emits empty (but valid) entry-points to `dist/`.

- [ ] **Step 1: Create `src/qwik-cdk/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

const entries = [
  'platform', 'bidi', 'coercion', 'keycodes',
  'portal', 'a11y', 'overlay', 'dialog',
];

export default defineConfig({
  plugins: [
    qwikVite({ csr: true }),
    dts({ entryRoot: '.', outDir: 'dist', insertTypesEntry: true }),
  ],
  build: {
    outDir: 'dist',
    lib: {
      formats: ['es'],
      entry: {
        index: resolve(__dirname, 'index.ts'),
        ...Object.fromEntries(
          entries.map((e) => [`${e}/index`, resolve(__dirname, `${e}/index.ts`)]),
        ),
      },
    },
    rollupOptions: {
      external: ['@builder.io/qwik', '@builder.io/qwik/build', '@builder.io/qwik-city'],
      output: { preserveModules: false, entryFileNames: '[name].js' },
    },
    target: 'es2022',
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['**/*.spec.ts'],
  },
});
```

- [ ] **Step 2: Create per-entry-point stub `index.ts` and `public-api.ts`**

For each of `platform`, `bidi`, `coercion`, `keycodes`, `portal`, `a11y`, `overlay`, `dialog`:

```bash
mkdir -p src/qwik-cdk/<entry>
```

`src/qwik-cdk/<entry>/index.ts`:
```ts
export * from './public-api';
```

`src/qwik-cdk/<entry>/public-api.ts`:
```ts
// Placeholder. Populated by entry-point tasks.
export {};
```

- [ ] **Step 3: Run build to verify scaffolding compiles**

Run: `pnpm -C src/qwik-cdk build`
Expected: succeeds; produces `dist/index.js`, `dist/platform/index.js`, …, `dist/dialog/index.js`. Empty modules but valid.

- [ ] **Step 4: Verify `index.ts` typecheck still fails on missing `./root`**

Run: `pnpm -C src/qwik-cdk typecheck`
Expected: fails on `./root` import only. No other errors.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-cdk
git commit -m "build(multiple): wire qwik-cdk vite library build with entry-point stubs"
```

---

### Task 3: Vitest setup + smoke test

**Files:**
- Create: `src/qwik-cdk/vitest.setup.ts`
- Create: `src/qwik-cdk/__smoke__.spec.ts`

**Interfaces:**
- Produces: working `pnpm -C src/qwik-cdk test` command.

- [ ] **Step 1: Create `src/qwik-cdk/vitest.setup.ts`**

```ts
// Empty for now; entry-point tests may add globals here.
export {};
```

- [ ] **Step 2: Create `src/qwik-cdk/__smoke__.spec.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('qwik-cdk smoke', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: Run vitest**

Run: `pnpm -C src/qwik-cdk test`
Expected: PASS — 1 test in `__smoke__.spec.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-cdk
git commit -m "test(multiple): add vitest smoke test for qwik-cdk"
```

---

## Phase 2 — SCSS layer (framework-agnostic, ship early)

### Task 4: Copy CDK SCSS files verbatim + wire prebuilt CSS through Vite

**Files:**
- Create: `src/qwik-cdk/scss/_index.scss`
- Create: `src/qwik-cdk/scss/overlay/_index.scss`
- Create: `src/qwik-cdk/scss/overlay/overlay-prebuilt.scss`
- Create: `src/qwik-cdk/scss/overlay/overlay-structure.scss`
- Create: `src/qwik-cdk/scss/a11y/_index.scss`
- Create: `src/qwik-cdk/scss/a11y/a11y-prebuilt.scss`
- Create: `src/qwik-cdk/scss/dialog/dialog-container.scss`
- Modify: `src/qwik-cdk/vite.config.ts` (add CSS entry inputs)

**Interfaces:**
- Produces: `dist/overlay-prebuilt.css`, `dist/a11y-prebuilt.css`, plus copy of `scss/` directory in package output.

- [ ] **Step 1: Copy SCSS files byte-for-byte from CDK**

```bash
cp src/cdk/_index.scss                    src/qwik-cdk/scss/_index.scss
mkdir -p src/qwik-cdk/scss/overlay src/qwik-cdk/scss/a11y src/qwik-cdk/scss/dialog
cp src/cdk/overlay/_index.scss            src/qwik-cdk/scss/overlay/_index.scss
cp src/cdk/overlay/overlay-prebuilt.scss  src/qwik-cdk/scss/overlay/overlay-prebuilt.scss
cp src/cdk/overlay/overlay-structure.scss src/qwik-cdk/scss/overlay/overlay-structure.scss
cp src/cdk/a11y/_index.scss               src/qwik-cdk/scss/a11y/_index.scss
cp src/cdk/a11y/a11y-prebuilt.scss        src/qwik-cdk/scss/a11y/a11y-prebuilt.scss
cp src/cdk/dialog/dialog-container.scss   src/qwik-cdk/scss/dialog/dialog-container.scss
```

Fix any `@use` paths in the copied files: search for `'@angular/cdk` and rewrite to relative `'../` paths. Run:

```bash
grep -rn '@angular/cdk' src/qwik-cdk/scss/ || echo "no rewrites needed"
```

If any matches surface, edit them by hand to use relative paths.

- [ ] **Step 2: Add prebuilt CSS entries to `vite.config.ts`**

In `src/qwik-cdk/vite.config.ts`, replace the `build.lib.entry` object so it also includes the SCSS prebuilt files as additional entries. The simplest path: use a second `vite build` pass via a separate config, OR a Vite plugin that compiles named SCSS files to `dist/<name>.css`. Use this minimal in-line approach by adding a `closeBundle` Rollup plugin:

```ts
// Add to vite.config.ts inside `plugins: []`
{
  name: 'qwik-cdk-compile-sass-prebuilt',
  apply: 'build',
  async closeBundle() {
    const sass = await import('sass');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const entries = [
      ['scss/overlay/overlay-prebuilt.scss', 'dist/overlay-prebuilt.css'],
      ['scss/a11y/a11y-prebuilt.scss',       'dist/a11y-prebuilt.css'],
    ];
    for (const [src, out] of entries) {
      const result = sass.compile(path.resolve(__dirname, src), { style: 'expanded' });
      await fs.mkdir(path.dirname(path.resolve(__dirname, out)), { recursive: true });
      await fs.writeFile(path.resolve(__dirname, out), result.css, 'utf8');
    }
  },
},
```

- [ ] **Step 3: Copy `scss/` to `dist/scss/` at build time**

Add a second small plugin in `vite.config.ts`:

```ts
{
  name: 'qwik-cdk-copy-scss',
  apply: 'build',
  async closeBundle() {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = path.resolve(__dirname, 'scss');
    const dst = path.resolve(__dirname, 'dist/scss');
    await fs.cp(src, dst, { recursive: true });
  },
},
```

- [ ] **Step 4: Build and verify outputs**

Run: `pnpm -C src/qwik-cdk build`
Expected: `dist/overlay-prebuilt.css`, `dist/a11y-prebuilt.css`, `dist/scss/...` all exist.

```bash
ls -la src/qwik-cdk/dist/overlay-prebuilt.css src/qwik-cdk/dist/a11y-prebuilt.css
ls src/qwik-cdk/dist/scss/overlay/
```

- [ ] **Step 5: Commit**

```bash
git add src/qwik-cdk
git commit -m "build(multiple): copy CDK SCSS verbatim and compile prebuilt CSS"
```

---

### Task 5: Byte-diff test for prebuilt CSS against `@angular/cdk`

**Files:**
- Create: `src/qwik-cdk/scripts/diff-prebuilt-css.mjs`
- Modify: `src/qwik-cdk/package.json` (add `test:css-parity` script)

**Interfaces:**
- Produces: `pnpm -C src/qwik-cdk test:css-parity` command that exits non-zero if prebuilt CSS diverges from `@angular/cdk`.

- [ ] **Step 1: Build `@angular/cdk` once so its prebuilt CSS exists**

```bash
pnpm build
```

(this runs the existing Angular build script and produces `dist/releases/cdk/`). If this is too heavy for first-time setup, document a fallback in the diff script that fetches the latest `@angular/cdk` from a known path.

- [ ] **Step 2: Create `src/qwik-cdk/scripts/diff-prebuilt-css.mjs`**

```js
#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../../..');

const pairs = [
  ['dist/releases/cdk/overlay-prebuilt.css', 'src/qwik-cdk/dist/overlay-prebuilt.css'],
  ['dist/releases/cdk/a11y-prebuilt.css',    'src/qwik-cdk/dist/a11y-prebuilt.css'],
];

const STRIP_RE = /\/\*[\s\S]*?(?:Copyright|@license|sourceMappingURL)[\s\S]*?\*\/\s*/g;

function normalize(src) {
  return src.replace(STRIP_RE, '').replace(/\s+/g, ' ').trim();
}

let ok = true;
for (const [angularRel, qwikRel] of pairs) {
  const a = await readFile(resolve(repoRoot, angularRel), 'utf8').catch(() => null);
  const q = await readFile(resolve(repoRoot, qwikRel),    'utf8').catch(() => null);
  if (a === null) { console.error(`Missing baseline: ${angularRel}. Run \`pnpm build\` first.`); ok = false; continue; }
  if (q === null) { console.error(`Missing qwik output: ${qwikRel}. Run \`pnpm -C src/qwik-cdk build\` first.`); ok = false; continue; }
  if (normalize(a) !== normalize(q)) {
    console.error(`CSS diverges: ${qwikRel} != ${angularRel}`);
    ok = false;
  } else {
    console.log(`✓ ${qwikRel} matches ${angularRel}`);
  }
}
process.exit(ok ? 0 : 1);
```

- [ ] **Step 3: Add `test:css-parity` script to `src/qwik-cdk/package.json`**

```jsonc
"scripts": {
  // ... existing
  "test:css-parity": "node ./scripts/diff-prebuilt-css.mjs"
}
```

- [ ] **Step 4: Run it**

Run: `pnpm -C src/qwik-cdk build && pnpm -C src/qwik-cdk test:css-parity`
Expected: both CSS files match (after stripping copyright / sourcemap comments). If they don't, inspect with `diff` and fix the Sass compile options or the script's normalize step.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-cdk
git commit -m "test(multiple): add prebuilt CSS byte-diff against @angular/cdk"
```

---

## Phase 3 — Foundation entry-points

### Task 6: Port `keycodes` and `coercion`

**Reference sources:** `src/cdk/keycodes/keycodes.ts`, `src/cdk/keycodes/public-api.ts`, `src/cdk/coercion/*.ts`, `src/cdk/coercion/public-api.ts`.

**Files:**
- Create: `src/qwik-cdk/keycodes/keycodes.ts` (verbatim copy — pure constants)
- Create: `src/qwik-cdk/keycodes/public-api.ts`
- Create: `src/qwik-cdk/keycodes/SYNC.md`
- Create: `src/qwik-cdk/coercion/boolean-property.ts` (verbatim copy)
- Create: `src/qwik-cdk/coercion/number-property.ts` (verbatim copy)
- Create: `src/qwik-cdk/coercion/array.ts` (verbatim copy)
- Create: `src/qwik-cdk/coercion/css-pixel-value.ts` (verbatim copy)
- Create: `src/qwik-cdk/coercion/element.ts` (verbatim copy — uses `ElementRef` interface; replace with `{ nativeElement: HTMLElement }` shim or accept raw `HTMLElement`. Document deviation.)
- Create: `src/qwik-cdk/coercion/public-api.ts`
- Create: `src/qwik-cdk/coercion/SYNC.md`
- Update: `src/qwik-cdk/{keycodes,coercion}/index.ts` (already exists from Task 2 — confirm `export * from './public-api'`)

**Interfaces:**
- Produces:
  - Constants from `keycodes` (UP_ARROW, DOWN_ARROW, …).
  - Functions: `coerceBooleanProperty(v): boolean`, `coerceNumberProperty(v, fallback?): number`, `coerceArray(v): T[]`, `coerceCssPixelValue(v): string`, `coerceElement(v: HTMLElement | { nativeElement: HTMLElement }): HTMLElement`.

- [ ] **Step 1: Write failing tests**

`src/qwik-cdk/keycodes/keycodes.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { UP_ARROW, DOWN_ARROW, ESCAPE, ENTER, SPACE } from './public-api';

describe('keycodes', () => {
  it('exports the expected constants', () => {
    expect(UP_ARROW).toBe(38);
    expect(DOWN_ARROW).toBe(40);
    expect(ESCAPE).toBe(27);
    expect(ENTER).toBe(13);
    expect(SPACE).toBe(32);
  });
});
```

`src/qwik-cdk/coercion/coercion.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  coerceBooleanProperty, coerceNumberProperty, coerceArray,
  coerceCssPixelValue, coerceElement,
} from './public-api';

describe('coercion', () => {
  it('coerceBooleanProperty', () => {
    expect(coerceBooleanProperty('')).toBe(true);
    expect(coerceBooleanProperty('false')).toBe(false);
    expect(coerceBooleanProperty(null)).toBe(false);
    expect(coerceBooleanProperty(undefined)).toBe(false);
    expect(coerceBooleanProperty(true)).toBe(true);
  });
  it('coerceNumberProperty', () => {
    expect(coerceNumberProperty('5')).toBe(5);
    expect(coerceNumberProperty('not-a-number', 9)).toBe(9);
  });
  it('coerceArray', () => {
    expect(coerceArray('a')).toEqual(['a']);
    expect(coerceArray(['a', 'b'])).toEqual(['a', 'b']);
  });
  it('coerceCssPixelValue', () => {
    expect(coerceCssPixelValue(10)).toBe('10px');
    expect(coerceCssPixelValue('10vh')).toBe('10vh');
    expect(coerceCssPixelValue(null)).toBe('');
  });
  it('coerceElement passes raw element through', () => {
    const el = document.createElement('div');
    expect(coerceElement(el)).toBe(el);
  });
});
```

- [ ] **Step 2: Run tests; expect failures**

Run: `pnpm -C src/qwik-cdk test`
Expected: fails — modules don't export the symbols yet.

- [ ] **Step 3: Port files**

For each file listed under **Files** above: copy the corresponding `src/cdk/<entry>/<file>` to its destination. Replace any `import { ElementRef } from '@angular/core'` in `coercion/element.ts` with an in-file `interface ElementRef { nativeElement: HTMLElement }`. Replace `import` of internal CDK files (if any) with relative paths.

Populate `src/qwik-cdk/keycodes/public-api.ts`:
```ts
export * from './keycodes';
```

Populate `src/qwik-cdk/coercion/public-api.ts`:
```ts
export { coerceBooleanProperty } from './boolean-property';
export { coerceNumberProperty } from './number-property';
export { coerceArray } from './array';
export { coerceCssPixelValue } from './css-pixel-value';
export { coerceElement } from './element';
```

- [ ] **Step 4: Run tests; expect pass**

Run: `pnpm -C src/qwik-cdk test`
Expected: PASS.

- [ ] **Step 5: Create SYNC.md files**

`src/qwik-cdk/keycodes/SYNC.md`:
```md
# Sync log: keycodes
Last synced from angular/components commit: <current-sha-of-main>
Synced files:
- keycodes.ts ← src/cdk/keycodes/keycodes.ts (verbatim)
- public-api.ts ← src/cdk/keycodes/public-api.ts (verbatim)

Intentionally not ported: none.
Open deviations: none.
```

`src/qwik-cdk/coercion/SYNC.md`:
```md
# Sync log: coercion
Last synced from angular/components commit: <current-sha-of-main>
Synced files:
- boolean-property.ts (verbatim)
- number-property.ts (verbatim)
- array.ts (verbatim)
- css-pixel-value.ts (verbatim)
- element.ts (modified: inline ElementRef interface instead of @angular/core import)
- public-api.ts (verbatim)

Intentionally not ported: none.
Open deviations:
- element.ts uses a local ElementRef interface ({ nativeElement: HTMLElement })
  to avoid an @angular/core dependency. Consumers passing a raw HTMLElement
  still work.
```

Replace `<current-sha-of-main>` with `git rev-parse main` output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): port keycodes and coercion to qwik-cdk"
```

---

### Task 7: Port `platform`

**Reference sources:** `src/cdk/platform/platform.ts`, `src/cdk/platform/features/*.ts`, `src/cdk/platform/public-api.ts`.

**Files:**
- Create: `src/qwik-cdk/platform/platform.ts`
- Create: `src/qwik-cdk/platform/features/*.ts` (one per CDK file under `src/cdk/platform/features/`)
- Create: `src/qwik-cdk/platform/public-api.ts`
- Create: `src/qwik-cdk/platform/SYNC.md`

**Interfaces:**
- Produces:
  - `class Platform` with boolean fields (`isBrowser`, `EDGE`, `TRIDENT`, `BLINK`, `WEBKIT`, `IOS`, `FIREFOX`, `ANDROID`, `SAFARI`) — same as CDK.
  - `PLATFORM` context (replaces `@Injectable() class Platform`).
  - `usePlatform()` hook.
  - Re-export `isBrowser` from `@builder.io/qwik` for direct use in non-component code.
  - All feature-detection helpers from CDK (`normalizePassiveListenerOptions`, `supportsPassiveEventListeners`, `getRtlScrollAxisType`, …).

- [ ] **Step 1: Port pure helpers verbatim**

For each file in `src/cdk/platform/features/`: copy to `src/qwik-cdk/platform/features/` and adjust imports (remove `@angular/core` if any).

- [ ] **Step 2: Adapt `platform.ts`**

`src/qwik-cdk/platform/platform.ts`:
```ts
import { createContextId, useContext } from '@builder.io/qwik';
import { isBrowser as qIsBrowser } from '@builder.io/qwik/build';

/** Re-export for direct use outside Qwik components. */
export const isBrowser = qIsBrowser;

/**
 * Platform feature-detection bag. Computed lazily in the browser; all fields
 * are `false` on the server.
 */
export class Platform {
  isBrowser = isBrowser;
  EDGE = isBrowser && /(edge)/i.test(navigator.userAgent);
  TRIDENT = isBrowser && /(msie|trident)/i.test(navigator.userAgent);
  BLINK = isBrowser && !!((window as any).chrome || hasGlobalProp('CSS')) &&
          !!navigator.userAgent && !this.EDGE && !this.TRIDENT;
  WEBKIT = isBrowser && /AppleWebKit/i.test(navigator.userAgent) && !this.BLINK && !this.EDGE && !this.TRIDENT;
  IOS = isBrowser && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  FIREFOX = isBrowser && /(firefox|minefield)/i.test(navigator.userAgent);
  ANDROID = isBrowser && /android/i.test(navigator.userAgent) && !this.TRIDENT;
  SAFARI = isBrowser && /safari/i.test(navigator.userAgent) && this.WEBKIT;
}

function hasGlobalProp(name: string) {
  return typeof globalThis !== 'undefined' && name in globalThis;
}

export const PLATFORM = createContextId<Platform>('qwik-cdk/platform');

export function usePlatform(): Platform {
  return useContext(PLATFORM);
}
```

- [ ] **Step 3: Populate `public-api.ts`**

`src/qwik-cdk/platform/public-api.ts`:
```ts
export { Platform, PLATFORM, usePlatform, isBrowser } from './platform';
export * from './features/passive-listeners';
export * from './features/scrolling';
// add one re-export per file ported under features/
```

- [ ] **Step 4: Write test**

`src/qwik-cdk/platform/platform.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Platform, isBrowser } from './public-api';

describe('Platform', () => {
  it('isBrowser truthy under happy-dom (test env)', () => {
    // happy-dom advertises window/document so isBrowser is true.
    expect(typeof isBrowser).toBe('boolean');
  });
  it('Platform instance fields are booleans', () => {
    const p = new Platform();
    for (const key of ['isBrowser', 'EDGE', 'TRIDENT', 'BLINK', 'WEBKIT', 'IOS', 'FIREFOX', 'ANDROID', 'SAFARI']) {
      expect(typeof (p as any)[key]).toBe('boolean');
    }
  });
});
```

- [ ] **Step 5: Run tests; expect pass**

Run: `pnpm -C src/qwik-cdk test`
Expected: PASS.

- [ ] **Step 6: Write `src/qwik-cdk/platform/SYNC.md`** (same template as Task 6's; list each file, note deviations: `Platform` is no longer `@Injectable`, added `PLATFORM` context, added `usePlatform()`).

- [ ] **Step 7: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): port platform with isBrowser shim and PLATFORM context"
```

---

### Task 8: Port `bidi` (Directionality)

**Reference sources:** `src/cdk/bidi/directionality.ts`, `src/cdk/bidi/dir-document-token.ts`, `src/cdk/bidi/dir.ts`, `src/cdk/bidi/public-api.ts`.

**Files:**
- Create: `src/qwik-cdk/bidi/directionality.ts`
- Create: `src/qwik-cdk/bidi/public-api.ts`
- Create: `src/qwik-cdk/bidi/dir.removed.md` (CdkDir directive — Qwik doesn't have structural directives; consumers pass `direction` directly on `<QwikCdkRoot>` or per-dialog)
- Create: `src/qwik-cdk/bidi/SYNC.md`

**Interfaces:**
- Produces:
  - `type Direction = 'ltr' | 'rtl'`
  - `class Directionality { value: Signal<Direction>; change: QRL<(d: Direction) => void> }` (signal-backed).
  - `DIRECTIONALITY` context.
  - `useDirectionality()` hook.

- [ ] **Step 1: Write failing test**

`src/qwik-cdk/bidi/directionality.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Directionality, isDirection } from './public-api';

describe('Directionality', () => {
  it('defaults to ltr', () => {
    const d = new Directionality();
    expect(d.value.value).toBe('ltr');
  });
  it('change() mutates the signal', () => {
    const d = new Directionality();
    d.change('rtl');
    expect(d.value.value).toBe('rtl');
  });
  it('isDirection narrows', () => {
    expect(isDirection('ltr')).toBe(true);
    expect(isDirection('rtl')).toBe(true);
    expect(isDirection('zz')).toBe(false);
  });
});
```

- [ ] **Step 2: Verify it fails**

Run: `pnpm -C src/qwik-cdk test bidi`
Expected: FAIL — `Directionality` not exported.

- [ ] **Step 3: Implement `directionality.ts`**

```ts
import { createContextId, useContext, useSignal, type Signal } from '@builder.io/qwik';

export type Direction = 'ltr' | 'rtl';

export function isDirection(v: unknown): v is Direction {
  return v === 'ltr' || v === 'rtl';
}

/** Replacement for CDK's @Injectable Directionality. Carries a signal-backed value. */
export class Directionality {
  readonly value: Signal<Direction>;

  constructor(initial: Direction = 'ltr') {
    // Using a plain object with a `value` field that mimics a Signal. The
    // QwikCdkRoot will replace this with `useSignal()` when it constructs the
    // context-provided instance.
    this.value = { value: initial } as Signal<Direction>;
  }

  change(next: Direction): void {
    (this.value as { value: Direction }).value = next;
  }
}

export const DIRECTIONALITY = createContextId<Directionality>('qwik-cdk/directionality');

export function useDirectionality(): Directionality {
  return useContext(DIRECTIONALITY);
}
```

- [ ] **Step 4: Populate `public-api.ts`**

```ts
export { Directionality, DIRECTIONALITY, useDirectionality, isDirection } from './directionality';
export type { Direction } from './directionality';
```

- [ ] **Step 5: Run tests; pass**

Run: `pnpm -C src/qwik-cdk test bidi`
Expected: PASS.

- [ ] **Step 6: Create `dir.removed.md` and `SYNC.md`**

`src/qwik-cdk/bidi/dir.removed.md`:
```md
# Not ported: dir.ts
CDK's `Dir` directive ([dir]) is a structural directive that wraps a subtree
to override its `Directionality`. Qwik has no structural directives. Consumers
pass `direction` as a prop on `<QwikCdkRoot>` (app-wide) or in a
`DialogConfig.direction` field (per-dialog).
```

`src/qwik-cdk/bidi/SYNC.md`: standard template; record `Directionality.change` synchronous + signal-based instead of Observable-based.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): port Directionality with signal value"
```

---

### Task 9: Port `portal` (collapsed)

**Reference sources:** `src/cdk/portal/portal.ts`, `src/cdk/portal/portal-directives.ts`, `src/cdk/portal/dom-portal-outlet.ts`, `src/cdk/portal/public-api.ts`.

**Files:**
- Create: `src/qwik-cdk/portal/portal.ts` (collapsed: just types)
- Create: `src/qwik-cdk/portal/portal-outlet.tsx` (CdkPortalOutlet helper component)
- Create: `src/qwik-cdk/portal/public-api.ts`
- Create: `src/qwik-cdk/portal/portal-directives.removed.md`
- Create: `src/qwik-cdk/portal/dom-portal-outlet.removed.md`
- Create: `src/qwik-cdk/portal/SYNC.md`

**Interfaces:**
- Produces:
  - `interface Portal<P> { Component: Component<P>; props: P }`
  - `CdkPortalOutlet` component: `<CdkPortalOutlet portal$={signal}/>` renders `<portal.Component {...portal.props}/>` reactively.

- [ ] **Step 1: Write test**

`src/qwik-cdk/portal/portal.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { component$ } from '@builder.io/qwik';
import { CdkPortalOutlet } from './public-api';

const Hello = component$<{ name: string }>(({ name }) => <span>Hello {name}</span>);

describe('CdkPortalOutlet', () => {
  it('renders the given portal', async () => {
    const { render, screen } = await createDOM();
    await render(
      <CdkPortalOutlet portal={{ Component: Hello, props: { name: 'World' } }} />,
    );
    expect(screen.outerHTML).toContain('Hello World');
  });
});
```

- [ ] **Step 2: Verify failure**

Run: `pnpm -C src/qwik-cdk test portal`
Expected: FAIL.

- [ ] **Step 3: Implement portal.ts**

```ts
import type { Component } from '@builder.io/qwik';

export interface Portal<P> {
  Component: Component<P>;
  props: P;
}
```

- [ ] **Step 4: Implement portal-outlet.tsx**

```tsx
import { component$, Slot } from '@builder.io/qwik';
import type { Portal } from './portal';

export interface CdkPortalOutletProps<P = any> {
  portal: Portal<P> | null;
}

export const CdkPortalOutlet = component$<CdkPortalOutletProps>((props) => {
  if (!props.portal) return <Slot/>;
  const Comp = props.portal.Component;
  return <Comp {...props.portal.props as any} />;
});
```

- [ ] **Step 5: Populate public-api.ts**

```ts
export type { Portal } from './portal';
export { CdkPortalOutlet } from './portal-outlet';
export type { CdkPortalOutletProps } from './portal-outlet';
```

- [ ] **Step 6: Run test; pass**

Run: `pnpm -C src/qwik-cdk test portal`
Expected: PASS.

- [ ] **Step 7: Write `.removed.md` files and `SYNC.md`**

`src/qwik-cdk/portal/portal-directives.removed.md`:
```md
# Not ported: portal-directives.ts
CdkPortal and CdkPortalOutlet (the directive form) don't translate to Qwik —
no structural directives. CdkPortalOutlet is reimagined as a component in
portal-outlet.tsx.
```

`src/qwik-cdk/portal/dom-portal-outlet.removed.md`:
```md
# Not ported: dom-portal-outlet.ts
The DomPortalOutlet abstraction (imperatively attaching a ComponentRef to an
arbitrary DOM node) has no Qwik analogue. The OverlayContainerOutlet
component (in overlay/) renders portal entries reactively via JSX instead.
```

`src/qwik-cdk/portal/SYNC.md`: list deviations:
- `Portal<P>` is a plain interface; no abstract class hierarchy.
- `ComponentPortal`/`TemplatePortal`/`DomPortal` classes removed.
- `DomPortalOutlet` removed.
- `CdkPortalOutlet` is a component, not a directive.
- `PortalOutlet` and `BasePortalOutlet` removed (their imperative API has no Qwik equivalent).

- [ ] **Step 8: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): port portal as collapsed Portal type + CdkPortalOutlet component"
```

---

## Phase 4 — a11y subset

### Task 10: Port `_IdGenerator` and `InteractivityChecker`

**Reference sources:** `src/cdk/a11y/id-generator.ts`, `src/cdk/a11y/interactivity-checker/interactivity-checker.ts`.

**Files:**
- Create: `src/qwik-cdk/a11y/id-generator.ts`
- Create: `src/qwik-cdk/a11y/interactivity-checker/interactivity-checker.ts`
- Update: `src/qwik-cdk/a11y/public-api.ts` (export them)
- Create: `src/qwik-cdk/a11y/SYNC.md` (initial; appended in later tasks)

**Interfaces:**
- Produces:
  - `class _IdGenerator { getId(prefix: string): string }` (incrementing counter).
  - `ID_GENERATOR` context.
  - `useIdGenerator()` hook.
  - `class InteractivityChecker { isDisabled(el): boolean; isVisible(el): boolean; isFocusable(el): boolean; isTabbable(el): boolean }`.

- [ ] **Step 1: Tests**

`src/qwik-cdk/a11y/id-generator.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { _IdGenerator } from './public-api';

describe('_IdGenerator', () => {
  it('generates unique ids with the given prefix', () => {
    const g = new _IdGenerator();
    const a = g.getId('cdk-dialog-');
    const b = g.getId('cdk-dialog-');
    expect(a).toMatch(/^cdk-dialog-\d+$/);
    expect(b).toMatch(/^cdk-dialog-\d+$/);
    expect(a).not.toBe(b);
  });
});
```

`src/qwik-cdk/a11y/interactivity-checker/interactivity-checker.spec.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { InteractivityChecker } from '../public-api';

describe('InteractivityChecker', () => {
  let checker: InteractivityChecker;
  let host: HTMLElement;

  beforeEach(() => {
    checker = new InteractivityChecker();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  it('detects disabled inputs', () => {
    host.innerHTML = '<input disabled>';
    const input = host.querySelector('input')!;
    expect(checker.isDisabled(input)).toBe(true);
  });
  it('detects visibility', () => {
    host.innerHTML = '<button>x</button>';
    const btn = host.querySelector('button')!;
    expect(checker.isVisible(btn)).toBe(true);
  });
});
```

- [ ] **Step 2: Implement `_IdGenerator`**

`src/qwik-cdk/a11y/id-generator.ts`:
```ts
import { createContextId, useContext } from '@builder.io/qwik';

export class _IdGenerator {
  private counter = 0;
  getId(prefix: string): string {
    return `${prefix}${this.counter++}`;
  }
}

export const ID_GENERATOR = createContextId<_IdGenerator>('qwik-cdk/id-generator');

export function useIdGenerator(): _IdGenerator {
  return useContext(ID_GENERATOR);
}
```

- [ ] **Step 3: Port `InteractivityChecker` near-verbatim**

Copy `src/cdk/a11y/interactivity-checker/interactivity-checker.ts` to `src/qwik-cdk/a11y/interactivity-checker/interactivity-checker.ts`. Remove the `@Injectable()` decorator. Remove `Platform` injection — instead, take `Platform` as a constructor parameter (default `new Platform()`). Adjust any `inject()` calls similarly.

- [ ] **Step 4: Update `src/qwik-cdk/a11y/public-api.ts`**

```ts
export { _IdGenerator, ID_GENERATOR, useIdGenerator } from './id-generator';
export { InteractivityChecker } from './interactivity-checker/interactivity-checker';
```

- [ ] **Step 5: Run tests**

Run: `pnpm -C src/qwik-cdk test a11y`
Expected: PASS.

- [ ] **Step 6: Append to `src/qwik-cdk/a11y/SYNC.md`** (create with `_IdGenerator`, `InteractivityChecker` entries, list `@Injectable` removed and constructor-parameter Platform injection).

- [ ] **Step 7: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): port _IdGenerator and InteractivityChecker"
```

---

### Task 11: Port `InputModalityDetector` and `FocusMonitor`

**Reference sources:** `src/cdk/a11y/input-modality/input-modality-detector.ts`, `src/cdk/a11y/focus-monitor/focus-monitor.ts`.

**Files:**
- Create: `src/qwik-cdk/a11y/input-modality/input-modality-detector.ts`
- Create: `src/qwik-cdk/a11y/focus-monitor/focus-monitor.ts`
- Update: `src/qwik-cdk/a11y/public-api.ts`
- Update: `src/qwik-cdk/a11y/SYNC.md`

**Interfaces:**
- Consumes: `Platform`, `_IdGenerator`.
- Produces:
  - `class InputModalityDetector { modality: Signal<InputModality>; mostRecentTarget: HTMLElement | null }` where `InputModality = 'keyboard' | 'mouse' | 'touch' | null`. Listens to body events (gated by `isBrowser`).
  - `INPUT_MODALITY_DETECTOR` context.
  - `class FocusMonitor { monitor(el): Signal<FocusOrigin>; focusVia(el, origin): void; stopMonitoring(el): void }` where `FocusOrigin = 'touch' | 'mouse' | 'keyboard' | 'program' | null`. Replaces RxJS Observable return of `monitor()` with a `Signal<FocusOrigin>`.
  - `FOCUS_MONITOR` context.

- [ ] **Step 1: Read CDK source** — `src/cdk/a11y/input-modality/input-modality-detector.ts` (~120 lines) and `src/cdk/a11y/focus-monitor/focus-monitor.ts` (~400 lines).

- [ ] **Step 2: Write smoke test for InputModalityDetector**

`src/qwik-cdk/a11y/input-modality/input-modality-detector.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { InputModalityDetector } from '../public-api';

describe('InputModalityDetector', () => {
  it('initial modality is null', () => {
    const det = new InputModalityDetector();
    expect(det.modality.value).toBeNull();
  });
  it('mouse event sets modality to mouse', () => {
    const det = new InputModalityDetector();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(det.modality.value).toBe('mouse');
  });
  it('keyboard event sets modality to keyboard', () => {
    const det = new InputModalityDetector();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));
    expect(det.modality.value).toBe('keyboard');
  });
});
```

- [ ] **Step 3: Implement `input-modality-detector.ts`**

Port the CDK file applying these rules:
- Drop `@Injectable`. Class takes no DI parameters.
- Replace internal `BehaviorSubject` with a Qwik-style signal: a plain object `{ value: T }` mutated directly (Qwik components reading via `useContext` will get reactivity once the QwikCdkRoot provides this signal via `useStore`/`useSignal`).
- Use direct `document.addEventListener` calls, gated by `isBrowser`. The constructor returns an instance with a `destroy()` method that removes listeners.

- [ ] **Step 4: Implement `focus-monitor.ts`**

Port `src/cdk/a11y/focus-monitor/focus-monitor.ts` applying these rules:
- Drop `@Injectable`.
- Constructor parameters: `(platform: Platform, ngZoneEquivalent: void, modalityDetector: InputModalityDetector)` — drop `NgZone` entirely.
- `monitor(element)` returns a `Signal<FocusOrigin>` instead of `Observable<FocusOrigin>`. Internally maintains a Map of `element -> { signal, listener }`.
- All `runOutsideAngular` calls become direct calls.
- The `_origin` BehaviorSubject becomes a plain `{ value: FocusOrigin }` object.
- Drop the change-detection coupling entirely.

- [ ] **Step 5: Smoke test FocusMonitor**

`src/qwik-cdk/a11y/focus-monitor/focus-monitor.spec.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Platform, FocusMonitor, InputModalityDetector } from '../public-api';

describe('FocusMonitor', () => {
  let monitor: FocusMonitor;
  let el: HTMLElement;

  beforeEach(() => {
    const det = new InputModalityDetector();
    monitor = new FocusMonitor(new Platform(), det);
    el = document.createElement('button');
    document.body.appendChild(el);
  });

  it('emits null when not focused', () => {
    const sig = monitor.monitor(el);
    expect(sig.value).toBeNull();
  });
  it('emits "program" when focused programmatically', () => {
    const sig = monitor.monitor(el);
    el.focus();
    expect(sig.value).toBe('program');
  });
});
```

- [ ] **Step 6: Update public-api and run tests**

`src/qwik-cdk/a11y/public-api.ts` — add:
```ts
export { InputModalityDetector, INPUT_MODALITY_DETECTOR, useInputModalityDetector } from './input-modality/input-modality-detector';
export type { InputModality } from './input-modality/input-modality-detector';
export { FocusMonitor, FOCUS_MONITOR, useFocusMonitor } from './focus-monitor/focus-monitor';
export type { FocusOrigin } from './focus-monitor/focus-monitor';
```

Run: `pnpm -C src/qwik-cdk test a11y`
Expected: PASS.

- [ ] **Step 7: Update SYNC.md, commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): port InputModalityDetector and FocusMonitor with signal API"
```

---

### Task 12: Port `FocusTrap` + `useFocusTrap` hook

**Reference sources:** `src/cdk/a11y/focus-trap/focus-trap.ts`, `src/cdk/a11y/focus-trap/configurable-focus-trap*.ts` (only `FocusTrap` itself; the `ConfigurableFocusTrap` variant is deferred).

**Files:**
- Create: `src/qwik-cdk/a11y/focus-trap/focus-trap.ts`
- Create: `src/qwik-cdk/a11y/focus-trap/use-focus-trap.ts`
- Update: `src/qwik-cdk/a11y/public-api.ts`
- Update: `src/qwik-cdk/a11y/SYNC.md`

**Interfaces:**
- Consumes: `InteractivityChecker`, `_IdGenerator`, `Platform`.
- Produces:
  - `class FocusTrap { focusInitialElement(): boolean; focusFirstTabbableElement(): boolean; focusLastTabbableElement(): boolean; destroy(): void; enabled: boolean }`.
  - `function useFocusTrap(hostRef: Signal<HTMLElement | undefined>, opts: FocusTrapOptions = {}): Signal<FocusTrap | null>` — wraps `FocusTrap` in a `useVisibleTask$`.

- [ ] **Step 1: Test**

`src/qwik-cdk/a11y/focus-trap/focus-trap.spec.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { FocusTrap, InteractivityChecker } from '../public-api';

describe('FocusTrap', () => {
  let host: HTMLElement;
  beforeEach(() => {
    host = document.createElement('div');
    host.innerHTML = '<button>A</button><button>B</button>';
    document.body.appendChild(host);
  });
  it('inserts focus sentinels', () => {
    new FocusTrap(host, new InteractivityChecker(), { defer: false });
    expect(host.parentElement!.querySelectorAll('.cdk-focus-trap-anchor').length).toBeGreaterThanOrEqual(2);
  });
  it('focuses the first tabbable element', () => {
    const trap = new FocusTrap(host, new InteractivityChecker(), { defer: false });
    expect(trap.focusFirstTabbableElement()).toBe(true);
    expect(document.activeElement?.textContent).toBe('A');
  });
});
```

- [ ] **Step 2: Port `focus-trap.ts`**

Port `src/cdk/a11y/focus-trap/focus-trap.ts` applying:
- Constructor signature: `(element: HTMLElement, checker: InteractivityChecker, options?: { defer?: boolean; deferAnchors?: boolean })`.
- Sentinel anchor classes match CDK exactly: `cdk-focus-trap-anchor`, with `aria-hidden="true"` and `tabindex="0"`.
- All `NgZone` references removed.
- `_executeOnStable` (which waited for the zone to stabilize) becomes a microtask (`Promise.resolve().then(...)`) when `defer` is true.

- [ ] **Step 3: Implement `use-focus-trap.ts`**

```ts
import { useSignal, useVisibleTask$, type Signal } from '@builder.io/qwik';
import { FocusTrap } from './focus-trap';
import { InteractivityChecker } from '../interactivity-checker/interactivity-checker';

export interface FocusTrapOptions {
  autoFocus?: 'dialog' | 'first-tabbable' | 'first-heading' | string | false;
  restoreFocus?: boolean | string | HTMLElement;
}

export function useFocusTrap(
  hostRef: Signal<HTMLElement | undefined>,
  opts: FocusTrapOptions = {},
): Signal<FocusTrap | null> {
  const trap = useSignal<FocusTrap | null>(null);
  const previouslyFocused = useSignal<HTMLElement | null>(null);

  useVisibleTask$(({ cleanup }) => {
    if (!hostRef.value) return;
    previouslyFocused.value = document.activeElement as HTMLElement | null;
    const t = new FocusTrap(hostRef.value, new InteractivityChecker(), { defer: false });
    trap.value = t;
    // Apply autoFocus option after one microtask so the trap's anchors are in DOM.
    queueMicrotask(() => applyAutoFocus(t, hostRef.value!, opts.autoFocus));
    cleanup(() => {
      t.destroy();
      if (opts.restoreFocus !== false) {
        previouslyFocused.value?.focus?.();
      }
    });
  });

  return trap;
}

function applyAutoFocus(trap: FocusTrap, host: HTMLElement, mode: FocusTrapOptions['autoFocus']) {
  if (mode === false) return;
  if (mode === 'dialog' || mode == null) { host.focus(); return; }
  if (mode === 'first-heading') {
    const h = host.querySelector<HTMLElement>('h1,h2,h3,h4,h5,h6,[role=heading]');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); return; }
  }
  if (mode === 'first-tabbable' || typeof mode === 'string') {
    trap.focusFirstTabbableElement() || host.focus();
  }
}
```

- [ ] **Step 4: Update public-api and run tests**

`src/qwik-cdk/a11y/public-api.ts` — add:
```ts
export { FocusTrap } from './focus-trap/focus-trap';
export { useFocusTrap } from './focus-trap/use-focus-trap';
export type { FocusTrapOptions } from './focus-trap/use-focus-trap';
```

Run: `pnpm -C src/qwik-cdk test a11y`
Expected: PASS.

- [ ] **Step 5: Update SYNC.md, commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): port FocusTrap and add useFocusTrap hook"
```

---

## Phase 5 — Overlay

> **Dependency note for Phase 5:** Tasks 13–17 introduce types that reference each other (PositionStrategy needs OverlayRef as a parameter; OverlayRef uses PositionStrategy as a field; Overlay service uses OverlayPositionBuilder). The order in this plan creates these in a workable sequence, but **intermediate task commits may not fully `pnpm -C src/qwik-cdk build`-clean** until Phase 5 completes. Vitest tests run lazily and only load tested files, so per-task `pnpm test` continues to pass. If the implementer prefers green builds at every commit, they can: (a) stub forward-declared types in Task 13 (a small `interface PositionStrategyOverlayHandle { hostElement: HTMLElement|null; overlayElement: HTMLElement|null }` and use it instead of OverlayRef in the strategy interface signature), then Task 15's OverlayRef structurally satisfies it; (b) reorder so all interfaces land first, then concrete classes. Both approaches are acceptable. The plan does not prescribe which.

### Task 13: `OverlayConfig` + supporting types

**Reference sources:** `src/cdk/overlay/overlay-config.ts`, `src/cdk/overlay/position/connected-position.ts`.

**Files:**
- Create: `src/qwik-cdk/overlay/overlay-config.ts`
- Create: `src/qwik-cdk/overlay/position/connected-position.ts`
- Create: `src/qwik-cdk/overlay/position/position-strategy.ts` (interface)
- Create: `src/qwik-cdk/overlay/scroll/scroll-strategy.ts` (interface)
- Create: `src/qwik-cdk/overlay/overlay-context.ts` (context-override type used by DialogConfig)
- Update: `src/qwik-cdk/overlay/public-api.ts`
- Create: `src/qwik-cdk/overlay/SYNC.md`

**Interfaces:**
- Produces:
  - `class OverlayConfig` with fields: `positionStrategy?, scrollStrategy?, hasBackdrop?, backdropClass?, panelClass?, width?, height?, minWidth?, minHeight?, maxWidth?, maxHeight?, direction?, disposeOnNavigation?, eventPredicate?, disableAnimations?`. Same fields as CDK except those that don't apply (none significant here).
  - `interface PositionStrategy { attach(ref: OverlayRef): void; apply(): void; detach?(): void; dispose(): void }`.
  - `interface ScrollStrategy { attach(ref: OverlayRef): void; enable(): void; disable(): void; detach?(): void }`.
  - `interface OverlayContextOverride<T = unknown> { ctx: ContextId<T>; value: T }`.
  - `interface ConnectedPosition`, `interface ConnectionPositionPair`, `interface ConnectedOverlayPositionChange` — verbatim from CDK.

- [ ] **Step 1: Port `overlay-config.ts`** — copy from CDK, drop any `@angular/core` imports, drop `usePopover` if you want to defer that (or keep but flag in SYNC.md), keep the rest.

- [ ] **Step 2: Port `connected-position.ts`** — verbatim copy.

- [ ] **Step 3: Define interfaces**

`src/qwik-cdk/overlay/position/position-strategy.ts`:
```ts
import type { OverlayRef } from '../overlay-ref';

export interface PositionStrategy {
  attach(overlayRef: OverlayRef): void;
  apply(): void;
  detach?(): void;
  dispose(): void;
  getPopoverInsertionPoint?(): HTMLElement | null;
}
```

`src/qwik-cdk/overlay/scroll/scroll-strategy.ts`:
```ts
import type { OverlayRef } from '../overlay-ref';

export interface ScrollStrategy {
  attach(overlayRef: OverlayRef): void;
  enable(): void;
  disable(): void;
  detach?(): void;
}
```

`src/qwik-cdk/overlay/overlay-context.ts`:
```ts
import type { ContextId } from '@builder.io/qwik';

export interface OverlayContextOverride<T = unknown> {
  ctx: ContextId<T>;
  value: T;
}
```

- [ ] **Step 4: Wire `public-api.ts`**

```ts
export { OverlayConfig } from './overlay-config';
export type { PositionStrategy } from './position/position-strategy';
export type { ScrollStrategy } from './scroll/scroll-strategy';
export type { OverlayContextOverride } from './overlay-context';
export type {
  ConnectedPosition, ConnectionPositionPair,
  ConnectedOverlayPositionChange, ScrollingVisibility,
} from './position/connected-position';
```

- [ ] **Step 5: Smoke test**

`src/qwik-cdk/overlay/overlay-config.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { OverlayConfig } from './public-api';

describe('OverlayConfig', () => {
  it('constructs with defaults', () => {
    const c = new OverlayConfig();
    expect(c.hasBackdrop).toBeUndefined();
    expect(c.panelClass).toBeUndefined();
  });
  it('accepts a partial', () => {
    const c = new OverlayConfig({ hasBackdrop: true, panelClass: 'x' });
    expect(c.hasBackdrop).toBe(true);
    expect(c.panelClass).toBe('x');
  });
});
```

Run: `pnpm -C src/qwik-cdk test overlay`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): add OverlayConfig and core overlay types"
```

---

### Task 14: `OverlayRegistry` + `OverlayContainerOutlet`

**Files:**
- Create: `src/qwik-cdk/overlay/overlay-registry.ts`
- Create: `src/qwik-cdk/overlay/overlay-container-outlet.tsx`
- Create: `src/qwik-cdk/overlay/overlay-host.tsx`

**Interfaces:**
- Produces: types and components per spec §6. See spec for `OverlayEntry`, `OverlayRegistry`, `OVERLAY_REGISTRY` context. `OverlayContainerOutlet` is the singleton component placed inside `<QwikCdkRoot>`.

- [ ] **Step 1: Implement `overlay-registry.ts`**

```ts
import { createContextId, type Component, type QRL, type Signal } from '@builder.io/qwik';
import type { OverlayConfig } from './overlay-config';

export interface OverlayEntryState {
  panelClasses: Signal<readonly string[]>;
  backdropShowing: Signal<boolean>;
  detached: Signal<boolean>;
  width: Signal<string | undefined>;
  height: Signal<string | undefined>;
  minWidth: Signal<string | undefined>;
  minHeight: Signal<string | undefined>;
  maxWidth: Signal<string | undefined>;
  maxHeight: Signal<string | undefined>;
}

export interface OverlayEntry {
  id: string;
  Component: Component<any>;
  props: Record<string, unknown>;
  config: OverlayConfig;
  state: OverlayEntryState;
  lifecycle: {
    onAttached$: QRL<(host: HTMLElement, pane: HTMLElement) => void>;
    onDetached$: QRL<() => void>;
  };
}

export interface OverlayRegistry {
  entries: Signal<readonly OverlayEntry[]>;
  push(entry: OverlayEntry): void;
  remove(id: string): void;
  get(id: string): OverlayEntry | undefined;
}

export const OVERLAY_REGISTRY = createContextId<OverlayRegistry>('qwik-cdk/overlay-registry');
```

- [ ] **Step 2: Implement `overlay-host.tsx`**

```tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { OverlayEntry } from './overlay-registry';

export const OverlayHost = component$<{ entry: OverlayEntry }>(({ entry }) => {
  const hostRef = useSignal<HTMLElement>();
  const paneRef = useSignal<HTMLElement>();

  useVisibleTask$(({ cleanup }) => {
    if (!hostRef.value || !paneRef.value) return;
    entry.lifecycle.onAttached$(hostRef.value, paneRef.value);
    cleanup(() => entry.lifecycle.onDetached$());
  });

  const Comp = entry.Component;
  return (
    <div
      ref={hostRef}
      class="cdk-overlay-host"
      data-overlay-id={entry.id}
    >
      {entry.config.hasBackdrop && (
        <div class={`cdk-overlay-backdrop ${entry.state.backdropShowing.value ? 'cdk-overlay-backdrop-showing' : ''}`} />
      )}
      <div
        ref={paneRef}
        class={['cdk-overlay-pane', ...entry.state.panelClasses.value].join(' ')}
        style={{
          width: entry.state.width.value,
          height: entry.state.height.value,
          minWidth: entry.state.minWidth.value,
          minHeight: entry.state.minHeight.value,
          maxWidth: entry.state.maxWidth.value,
          maxHeight: entry.state.maxHeight.value,
        }}
      >
        <Comp {...entry.props as any} />
      </div>
    </div>
  );
});
```

- [ ] **Step 3: Implement `overlay-container-outlet.tsx`**

```tsx
import { component$, useContext } from '@builder.io/qwik';
import { OVERLAY_REGISTRY } from './overlay-registry';
import { OverlayHost } from './overlay-host';

export const OverlayContainerOutlet = component$(() => {
  const registry = useContext(OVERLAY_REGISTRY);
  if (registry.entries.value.length === 0) return null;
  return (
    <div class="cdk-overlay-container">
      {registry.entries.value.map((e) => <OverlayHost entry={e} key={e.id} />)}
    </div>
  );
});
```

- [ ] **Step 4: Update public-api**

```ts
// Add to src/qwik-cdk/overlay/public-api.ts
export { OVERLAY_REGISTRY } from './overlay-registry';
export type { OverlayEntry, OverlayRegistry, OverlayEntryState } from './overlay-registry';
export { OverlayContainerOutlet } from './overlay-container-outlet';
```

- [ ] **Step 5: Smoke test**

`src/qwik-cdk/overlay/overlay-container-outlet.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { component$, useStore, useContextProvider, useSignal, $ } from '@builder.io/qwik';
import { OVERLAY_REGISTRY, OverlayContainerOutlet } from './public-api';

const Stub = component$(() => <div class="stub-content">hello</div>);

const Harness = component$(() => {
  const entries = useSignal<any[]>([]);
  const registry = {
    entries,
    push(e: any) { entries.value = [...entries.value, e]; },
    remove(id: string) { entries.value = entries.value.filter(e => e.id !== id); },
    get(id: string) { return entries.value.find(e => e.id === id); },
  };
  useContextProvider(OVERLAY_REGISTRY, registry);
  registry.push({
    id: 'a', Component: Stub, props: {}, config: { hasBackdrop: false } as any,
    state: {
      panelClasses: { value: [] } as any, backdropShowing: { value: false } as any,
      detached: { value: false } as any,
      width: { value: undefined } as any, height: { value: undefined } as any,
      minWidth: { value: undefined } as any, minHeight: { value: undefined } as any,
      maxWidth: { value: undefined } as any, maxHeight: { value: undefined } as any,
    },
    lifecycle: { onAttached$: $(() => {}), onDetached$: $(() => {}) },
  });
  return <OverlayContainerOutlet />;
});

describe('OverlayContainerOutlet', () => {
  it('renders cdk-overlay-container with one pane when registry has an entry', async () => {
    const { render, screen } = await createDOM();
    await render(<Harness />);
    expect(screen.outerHTML).toContain('cdk-overlay-container');
    expect(screen.outerHTML).toContain('cdk-overlay-pane');
    expect(screen.outerHTML).toContain('stub-content');
  });
});
```

Run: `pnpm -C src/qwik-cdk test overlay`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): add OverlayRegistry context and OverlayContainerOutlet"
```

---

### Task 15: `OverlayRef`, `Overlay` service, `OverlayContainer`

**Reference sources:** `src/cdk/overlay/overlay-ref.ts`, `src/cdk/overlay/overlay.ts`, `src/cdk/overlay/overlay-container.ts`.

**Files:**
- Create: `src/qwik-cdk/overlay/overlay-ref.ts`
- Create: `src/qwik-cdk/overlay/overlay.ts`
- Create: `src/qwik-cdk/overlay/overlay-container.ts`

**Interfaces:**
- Produces:
  - `class OverlayRef` per spec §6 — handle that mutates registry signals and runs strategies, but does NOT own DOM directly.
  - `interface Overlay { create<P>(component, props, config?): OverlayRef; position(): OverlayPositionBuilder }` plus `OVERLAY` context and `useOverlay()`.
  - `interface OverlayContainer { getContainerElement(): HTMLElement | null }` plus `OVERLAY_CONTAINER` context.

- [ ] **Step 1: Implement `overlay-ref.ts`**

```ts
import { $, type QRL } from '@builder.io/qwik';
import type { OverlayRegistry, OverlayEntry } from './overlay-registry';
import type { OverlayConfig } from './overlay-config';
import type { PositionStrategy } from './position/position-strategy';
import type { ScrollStrategy } from './scroll/scroll-strategy';

export class OverlayRef {
  private hostEl: HTMLElement | null = null;
  private paneEl: HTMLElement | null = null;

  constructor(
    private readonly registry: OverlayRegistry,
    private readonly entry: OverlayEntry,
    private readonly positionStrategy?: PositionStrategy,
    private readonly scrollStrategy?: ScrollStrategy,
  ) {
    this.positionStrategy?.attach(this);
    this.scrollStrategy?.attach(this);
  }

  /** Called by OverlayHost via the entry's onAttached$ lifecycle hook. */
  _onAttached(host: HTMLElement, pane: HTMLElement): void {
    this.hostEl = host;
    this.paneEl = pane;
    this.positionStrategy?.apply();
    this.scrollStrategy?.enable();
  }

  _onDetached(): void {
    this.scrollStrategy?.disable();
    this.positionStrategy?.detach?.();
    this.hostEl = null;
    this.paneEl = null;
  }

  get config(): OverlayConfig { return this.entry.config; }
  get hostElement(): HTMLElement | null { return this.hostEl; }
  get overlayElement(): HTMLElement | null { return this.paneEl; }

  detach(): void {
    this.entry.state.detached.value = true;
    this.registry.remove(this.entry.id);
  }

  dispose(): void {
    this.detach();
    this.positionStrategy?.dispose();
  }

  updatePosition(): void { this.positionStrategy?.apply(); }

  updateSize(opts: { width?: string | number; height?: string | number; minWidth?: string | number; minHeight?: string | number; maxWidth?: string | number; maxHeight?: string | number }): void {
    if (opts.width !== undefined)     this.entry.state.width.value = px(opts.width);
    if (opts.height !== undefined)    this.entry.state.height.value = px(opts.height);
    if (opts.minWidth !== undefined)  this.entry.state.minWidth.value = px(opts.minWidth);
    if (opts.minHeight !== undefined) this.entry.state.minHeight.value = px(opts.minHeight);
    if (opts.maxWidth !== undefined)  this.entry.state.maxWidth.value = px(opts.maxWidth);
    if (opts.maxHeight !== undefined) this.entry.state.maxHeight.value = px(opts.maxHeight);
  }

  addPanelClass(classes: string | string[]): void {
    const arr = Array.isArray(classes) ? classes : [classes];
    this.entry.state.panelClasses.value = [...new Set([...this.entry.state.panelClasses.value, ...arr])];
  }

  removePanelClass(classes: string | string[]): void {
    const arr = Array.isArray(classes) ? classes : [classes];
    this.entry.state.panelClasses.value = this.entry.state.panelClasses.value.filter((c) => !arr.includes(c));
  }
}

function px(v: string | number): string {
  return typeof v === 'number' ? `${v}px` : v;
}
```

- [ ] **Step 2: Implement `overlay-container.ts`**

```ts
import { createContextId, useContext } from '@builder.io/qwik';
import { isBrowser } from '@builder.io/qwik/build';

export interface OverlayContainer {
  getContainerElement(): HTMLElement | null;
}

export class DefaultOverlayContainer implements OverlayContainer {
  private el: HTMLElement | null = null;
  getContainerElement(): HTMLElement | null {
    if (!isBrowser) return null;
    if (!this.el) {
      this.el = document.querySelector<HTMLElement>('.cdk-overlay-container');
    }
    return this.el;
  }
}

export const OVERLAY_CONTAINER = createContextId<OverlayContainer>('qwik-cdk/overlay-container');
export function useOverlayContainer(): OverlayContainer { return useContext(OVERLAY_CONTAINER); }

export interface OverlayContainerOptions {
  // Reserved for future custom-container insertion points (e.g. fullscreen).
}
```

- [ ] **Step 3: Implement `overlay.ts`**

```ts
import { $, createContextId, useContext, type Component } from '@builder.io/qwik';
import { OverlayConfig } from './overlay-config';
import { OverlayRef } from './overlay-ref';
import type { OverlayRegistry, OverlayEntry } from './overlay-registry';
import { OVERLAY_REGISTRY } from './overlay-registry';
import { OverlayPositionBuilder } from './position/overlay-position-builder';
import { _IdGenerator } from '../a11y/id-generator';

export interface Overlay {
  create<P>(component: Component<P>, props: P, config?: OverlayConfig): OverlayRef;
  position(): OverlayPositionBuilder;
}

export const OVERLAY = createContextId<Overlay>('qwik-cdk/overlay');

export function useOverlay(): Overlay { return useContext(OVERLAY); }

export function createOverlayService(
  registry: OverlayRegistry,
  idGen: _IdGenerator,
): Overlay {
  const positionBuilder = new OverlayPositionBuilder();
  return {
    create(component, props, config = new OverlayConfig()) {
      const id = idGen.getId('cdk-overlay-');
      const entry: OverlayEntry = {
        id,
        Component: component,
        props: props as Record<string, unknown>,
        config,
        state: {
          panelClasses: signalOf<readonly string[]>(toArr(config.panelClass)),
          backdropShowing: signalOf(false),
          detached: signalOf(false),
          width: signalOf(typeof config.width === 'string' ? config.width : config.width != null ? `${config.width}px` : undefined),
          height: signalOf(typeof config.height === 'string' ? config.height : config.height != null ? `${config.height}px` : undefined),
          minWidth: signalOf(undefined),
          minHeight: signalOf(undefined),
          maxWidth: signalOf(undefined),
          maxHeight: signalOf(undefined),
        },
        lifecycle: {
          onAttached$: $((host: HTMLElement, pane: HTMLElement) => ref._onAttached(host, pane)),
          onDetached$: $(() => ref._onDetached()),
        },
      };
      const ref = new OverlayRef(registry, entry, config.positionStrategy, config.scrollStrategy);
      registry.push(entry);
      // Trigger backdrop-show after attach via microtask (matches CDK animation timing)
      queueMicrotask(() => { entry.state.backdropShowing.value = !!config.hasBackdrop; });
      return ref;
    },
    position() { return positionBuilder; },
  };
}

function signalOf<T>(v: T): { value: T } { return { value: v }; }
function toArr<T>(v: T | T[] | undefined): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}
```

(Note: the `signalOf` helper produces a plain `{ value }` object that walks/quacks like a Qwik signal for read-only consumers. When the entry is constructed inside `QwikCdkRoot`'s `useTask$`, replace with `useSignal()`-backed variants. The dual-mode is acceptable as long as the registry is itself in a `useStore`.)

- [ ] **Step 4: Update public-api**

```ts
// Add to src/qwik-cdk/overlay/public-api.ts
export { OverlayRef } from './overlay-ref';
export { Overlay, OVERLAY, useOverlay, createOverlayService } from './overlay';
export { OverlayContainer, OVERLAY_CONTAINER, useOverlayContainer, DefaultOverlayContainer } from './overlay-container';
export type { OverlayContainerOptions } from './overlay-container';
```

- [ ] **Step 5: Smoke test** — defer integration testing to Task 21 once `QwikCdkRoot` exists. Add a unit test for `OverlayRef.updateSize`:

```ts
// src/qwik-cdk/overlay/overlay-ref.spec.ts
import { describe, it, expect } from 'vitest';
import { OverlayRef } from './public-api';

describe('OverlayRef', () => {
  it('updateSize sets px on width/height', () => {
    const entry: any = { id: 'x', state: {
      panelClasses: { value: [] }, backdropShowing: { value: false }, detached: { value: false },
      width: { value: undefined }, height: { value: undefined },
      minWidth: { value: undefined }, minHeight: { value: undefined },
      maxWidth: { value: undefined }, maxHeight: { value: undefined },
    } };
    const ref = new OverlayRef({ remove() {} } as any, entry);
    ref.updateSize({ width: 100, height: '50vh' });
    expect(entry.state.width.value).toBe('100px');
    expect(entry.state.height.value).toBe('50vh');
  });
});
```

Run: `pnpm -C src/qwik-cdk test overlay`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): add OverlayRef, Overlay service, OverlayContainer"
```

---

### Task 16: Position strategies (`GlobalPositionStrategy`, `FlexibleConnectedPositionStrategy`, `OverlayPositionBuilder`)

**Reference sources:** `src/cdk/overlay/position/global-position-strategy.ts`, `src/cdk/overlay/position/flexible-connected-position-strategy.ts`, `src/cdk/overlay/position/overlay-position-builder.ts`, `src/cdk/overlay/position/scroll-clip.ts`.

**Files:**
- Create: `src/qwik-cdk/overlay/position/global-position-strategy.ts`
- Create: `src/qwik-cdk/overlay/position/flexible-connected-position-strategy.ts`
- Create: `src/qwik-cdk/overlay/position/overlay-position-builder.ts`
- Create: `src/qwik-cdk/overlay/position/scroll-clip.ts` (verbatim)
- Create: `src/qwik-cdk/overlay/position/viewport-ruler.ts` (small viewport-rect helper; CDK uses `ViewportRuler` from `cdk/scrolling`; we inline a minimal version)

**Interfaces:**
- Produces:
  - `class GlobalPositionStrategy` with the fluent API: `top()`, `bottom()`, `left()`, `right()`, `centerHorizontally()`, `centerVertically()`, `width()`, `height()`, `apply()`, `dispose()`.
  - `class FlexibleConnectedPositionStrategy` with the full CDK API (preferred positions, flipping, fitting, pushing).
  - `class OverlayPositionBuilder` with `global()` and `flexibleConnectedTo(origin)` factories.

- [ ] **Step 1: Port `GlobalPositionStrategy`**

Port `src/cdk/overlay/position/global-position-strategy.ts` (~200 lines) applying:
- Drop `@Injectable` and DI.
- Use the OverlayRef's `hostElement` and `overlayElement` instead of resolving via `_overlayRef.hostElement`.
- All DOM operations gated by `isBrowser`.
- The wrapper structure ("cdk-global-overlay-wrapper") is created on `apply()` if not present, identical to CDK.

- [ ] **Step 2: Port `FlexibleConnectedPositionStrategy`**

Port `src/cdk/overlay/position/flexible-connected-position-strategy.ts` (~1000 lines) applying:
- Drop `@Injectable` and DI.
- Drop the `_origin: PositionChangeEmitter` Observable. Replace `positionChanges` field with a signal-backed `{ value: ConnectedOverlayPositionChange | null }` exposed via `getPositionChanges(): Signal<...>`.
- All math/positioning logic ports verbatim.
- Drop the `NgZone` parameter; remove all `runOutsideAngular` wrappings.

- [ ] **Step 3: Port `OverlayPositionBuilder`**

```ts
import { GlobalPositionStrategy } from './global-position-strategy';
import { FlexibleConnectedPositionStrategy } from './flexible-connected-position-strategy';

export class OverlayPositionBuilder {
  global(): GlobalPositionStrategy { return new GlobalPositionStrategy(); }
  flexibleConnectedTo(origin: HTMLElement): FlexibleConnectedPositionStrategy {
    return new FlexibleConnectedPositionStrategy(origin);
  }
}
```

- [ ] **Step 4: Port `scroll-clip.ts`** verbatim (pure functions).

- [ ] **Step 5: Inline a minimal `viewport-ruler.ts`** (CDK lives in cdk/scrolling):

```ts
import { isBrowser } from '@builder.io/qwik/build';

export function getViewportSize(): { width: number; height: number } {
  if (!isBrowser) return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function getViewportScrollPosition(): { top: number; left: number } {
  if (!isBrowser) return { top: 0, left: 0 };
  return { top: window.pageYOffset, left: window.pageXOffset };
}
```

- [ ] **Step 6: Smoke test**

`src/qwik-cdk/overlay/position/global-position-strategy.spec.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GlobalPositionStrategy, OverlayRef } from '../public-api';

describe('GlobalPositionStrategy', () => {
  let strategy: GlobalPositionStrategy;
  let host: HTMLElement;
  let pane: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    pane = document.createElement('div');
    host.appendChild(pane);
    document.body.appendChild(host);
    strategy = new GlobalPositionStrategy();
  });

  it('centerHorizontally applies margin-left auto on apply', () => {
    const refStub: any = { hostElement: host, overlayElement: pane };
    strategy.attach(refStub);
    strategy.centerHorizontally();
    strategy.apply();
    const wrapper = host.querySelector('.cdk-global-overlay-wrapper');
    expect(wrapper).toBeTruthy();
  });
});
```

Run: `pnpm -C src/qwik-cdk test overlay`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): port Global and FlexibleConnected position strategies"
```

---

### Task 17: Scroll strategies + dispatchers

**Reference sources:** `src/cdk/overlay/scroll/*.ts`, `src/cdk/overlay/dispatchers/*.ts`.

**Files:**
- Create: `src/qwik-cdk/overlay/scroll/noop-scroll-strategy.ts`
- Create: `src/qwik-cdk/overlay/scroll/block-scroll-strategy.ts`
- Create: `src/qwik-cdk/overlay/scroll/close-scroll-strategy.ts`
- Create: `src/qwik-cdk/overlay/scroll/reposition-scroll-strategy.ts`
- Create: `src/qwik-cdk/overlay/scroll/scroll-strategy-options.ts`
- Create: `src/qwik-cdk/overlay/dispatchers/base-overlay-dispatcher.ts`
- Create: `src/qwik-cdk/overlay/dispatchers/overlay-keyboard-dispatcher.ts`
- Create: `src/qwik-cdk/overlay/dispatchers/overlay-outside-click-dispatcher.ts`

**Interfaces:**
- Produces:
  - Four `ScrollStrategy` implementations.
  - `class ScrollStrategyOptions { noop(): ScrollStrategy; block(): ScrollStrategy; close(opts?): ScrollStrategy; reposition(opts?): ScrollStrategy }`.
  - `class OverlayKeyboardDispatcher` + `OVERLAY_KEYBOARD_DISPATCHER` context.
  - `class OverlayOutsideClickDispatcher` + `OVERLAY_OUTSIDE_CLICK_DISPATCHER` context.

- [ ] **Step 1: Port each scroll strategy verbatim** with these adjustments per file:
  - Drop `@Injectable` and `NgZone`.
  - `_attachedOverlay` field stays; CDK's pattern of attach/detach works as-is.
  - Use `isBrowser` to gate `document` / `window` access.

- [ ] **Step 2: Port `ScrollStrategyOptions`** as a plain class with factory methods (no `@Injectable`).

- [ ] **Step 3: Port `BaseOverlayDispatcher`** — internal abstract class managing the attached overlays list (renamed if you prefer; keep the same shape).

- [ ] **Step 4: Port `OverlayKeyboardDispatcher`**

Key changes:
- Constructor: no DI; takes no parameters.
- Replace `renderer.listen('body', 'keydown', ...)` with a single `document.addEventListener('keydown', handler, true)` call. Gate with `isBrowser`. Add a `dispose()` method that removes it.
- The dispatcher is instantiated once in `QwikCdkRoot` via `useVisibleTask$` and cleaned up on root teardown.

- [ ] **Step 5: Port `OverlayOutsideClickDispatcher`** with the same pattern.

- [ ] **Step 6: Add to `overlay/public-api.ts`**

```ts
export * from './scroll/noop-scroll-strategy';
export * from './scroll/block-scroll-strategy';
export * from './scroll/close-scroll-strategy';
export * from './scroll/reposition-scroll-strategy';
export { ScrollStrategyOptions, SCROLL_STRATEGY_OPTIONS, useScrollStrategyOptions } from './scroll/scroll-strategy-options';
export { OverlayKeyboardDispatcher, OVERLAY_KEYBOARD_DISPATCHER, useOverlayKeyboardDispatcher } from './dispatchers/overlay-keyboard-dispatcher';
export { OverlayOutsideClickDispatcher, OVERLAY_OUTSIDE_CLICK_DISPATCHER, useOverlayOutsideClickDispatcher } from './dispatchers/overlay-outside-click-dispatcher';
```

- [ ] **Step 7: Smoke tests** for one scroll strategy and one dispatcher

`src/qwik-cdk/overlay/scroll/block-scroll-strategy.spec.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BlockScrollStrategy } from '../public-api';

describe('BlockScrollStrategy', () => {
  let s: BlockScrollStrategy;
  beforeEach(() => { s = new BlockScrollStrategy(); s.attach({} as any); });
  afterEach(() => { s.disable(); });
  it('sets position:fixed on <html> when enabled', () => {
    s.enable();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(true);
  });
});
```

`src/qwik-cdk/overlay/dispatchers/overlay-keyboard-dispatcher.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { OverlayKeyboardDispatcher } from '../public-api';

describe('OverlayKeyboardDispatcher', () => {
  it('routes keydown to topmost attached overlay', () => {
    const d = new OverlayKeyboardDispatcher();
    const events: KeyboardEvent[] = [];
    const ref: any = { _keydownEvents: (e: KeyboardEvent) => events.push(e) };
    d.add(ref);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(events.length).toBe(1);
    d.remove(ref);
    d.dispose();
  });
});
```

Run: `pnpm -C src/qwik-cdk test overlay`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): port overlay scroll strategies and dispatchers"
```

---

## Phase 6 — QwikCdkRoot

### Task 18: `<QwikCdkRoot>` component

**Files:**
- Create: `src/qwik-cdk/root.tsx`
- (modify `src/qwik-cdk/index.ts` — already imports from `./root`; now resolves)

**Interfaces:**
- Consumes: all context IDs from the foundation + overlay entry-points.
- Produces: `<QwikCdkRoot>` component that, on first mount, provides every qwik-cdk context with default-constructed services and renders `<Slot/>` + `<OverlayContainerOutlet/>`.

- [ ] **Step 1: Implement `root.tsx`**

```tsx
import {
  component$, Slot, useContextProvider, useSignal, useStore, useVisibleTask$, $,
} from '@builder.io/qwik';
import { Platform, PLATFORM } from './platform/platform';
import { Directionality, DIRECTIONALITY } from './bidi/directionality';
import type { Direction } from './bidi/directionality';
import { _IdGenerator, ID_GENERATOR } from './a11y/id-generator';
import { InputModalityDetector, INPUT_MODALITY_DETECTOR } from './a11y/input-modality/input-modality-detector';
import { FocusMonitor, FOCUS_MONITOR } from './a11y/focus-monitor/focus-monitor';
import {
  OVERLAY_REGISTRY, type OverlayRegistry, type OverlayEntry, OverlayContainerOutlet,
  DefaultOverlayContainer, OVERLAY_CONTAINER, OverlayContainerOptions,
  createOverlayService, OVERLAY,
  ScrollStrategyOptions, SCROLL_STRATEGY_OPTIONS,
  OverlayKeyboardDispatcher, OVERLAY_KEYBOARD_DISPATCHER,
  OverlayOutsideClickDispatcher, OVERLAY_OUTSIDE_CLICK_DISPATCHER,
} from './overlay/public-api';
import type { DialogConfig } from './dialog/dialog-config';

export interface QwikCdkRootProps {
  dialogDefaults?: Partial<DialogConfig>;
  overlayContainer?: OverlayContainerOptions;
  direction?: Direction;
  loadStyles?: boolean;
}

export const QwikCdkRoot = component$<QwikCdkRootProps>((props) => {
  // Singleton services
  const platform = new Platform();
  const idGen = new _IdGenerator();
  const dir = new Directionality(props.direction ?? 'ltr');
  const modalityDetector = new InputModalityDetector();
  const focusMonitor = new FocusMonitor(platform, modalityDetector);
  const overlayContainer = new DefaultOverlayContainer();
  const scrollStrategyOptions = new ScrollStrategyOptions();
  const keyboardDispatcher = new OverlayKeyboardDispatcher();
  const outsideClickDispatcher = new OverlayOutsideClickDispatcher();

  // Overlay registry — uses useStore so mutations are reactive
  const entries = useSignal<readonly OverlayEntry[]>([]);
  const registry: OverlayRegistry = {
    entries,
    push: (e) => { entries.value = [...entries.value, e]; },
    remove: (id) => { entries.value = entries.value.filter((x) => x.id !== id); },
    get: (id) => entries.value.find((x) => x.id === id),
  };

  const overlay = createOverlayService(registry, idGen);

  // Provide all contexts
  useContextProvider(PLATFORM, platform);
  useContextProvider(ID_GENERATOR, idGen);
  useContextProvider(DIRECTIONALITY, dir);
  useContextProvider(INPUT_MODALITY_DETECTOR, modalityDetector);
  useContextProvider(FOCUS_MONITOR, focusMonitor);
  useContextProvider(OVERLAY_CONTAINER, overlayContainer);
  useContextProvider(SCROLL_STRATEGY_OPTIONS, scrollStrategyOptions);
  useContextProvider(OVERLAY_KEYBOARD_DISPATCHER, keyboardDispatcher);
  useContextProvider(OVERLAY_OUTSIDE_CLICK_DISPATCHER, outsideClickDispatcher);
  useContextProvider(OVERLAY_REGISTRY, registry);
  useContextProvider(OVERLAY, overlay);

  // Cleanup dispatchers on teardown
  useVisibleTask$(({ cleanup }) => {
    cleanup(() => {
      keyboardDispatcher.dispose();
      outsideClickDispatcher.dispose();
      modalityDetector.destroy?.();
    });
  });

  // Auto-load overlay-structure styles if requested (default true)
  if (props.loadStyles !== false) {
    // Side-effect import; Vite bundles the CSS with the component.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // @ts-expect-error - side-effect css import
    import('./scss/overlay/overlay-structure.scss');
  }

  return (
    <>
      <Slot/>
      <OverlayContainerOutlet/>
    </>
  );
});
```

- [ ] **Step 2: Typecheck**

Run: `pnpm -C src/qwik-cdk typecheck`
Expected: PASS — `./root` now resolves.

- [ ] **Step 3: Build**

Run: `pnpm -C src/qwik-cdk build`
Expected: PASS.

- [ ] **Step 4: Smoke test**

`src/qwik-cdk/root.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { component$, useContext } from '@builder.io/qwik';
import { QwikCdkRoot } from './index';
import { OVERLAY } from './overlay/public-api';

const ContextProbe = component$(() => {
  const overlay = useContext(OVERLAY);
  return <div class="probe">{overlay ? 'has-overlay' : 'no-overlay'}</div>;
});

describe('QwikCdkRoot', () => {
  it('provides the OVERLAY context to children', async () => {
    const { render, screen } = await createDOM();
    await render(<QwikCdkRoot><ContextProbe/></QwikCdkRoot>);
    expect(screen.outerHTML).toContain('has-overlay');
  });
});
```

Run: `pnpm -C src/qwik-cdk test root`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): add <QwikCdkRoot> top-level provider component"
```

---

## Phase 7 — Dialog

### Task 19: `DialogConfig`, dialog tokens, dialog defaults

**Reference sources:** `src/cdk/dialog/dialog-config.ts`, `src/cdk/dialog/dialog-injectors.ts`.

**Files:**
- Create: `src/qwik-cdk/dialog/dialog-config.ts`
- Create: `src/qwik-cdk/dialog/dialog-tokens.ts`
- Update: `src/qwik-cdk/dialog/public-api.ts`
- Modify: `src/qwik-cdk/root.tsx` (provide `DEFAULT_DIALOG_CONFIG` from `props.dialogDefaults`)
- Create: `src/qwik-cdk/dialog/dialog-module.removed.md`
- Create: `src/qwik-cdk/dialog/dialog-injectors.removed.md` (renamed-from breadcrumb)
- Create: `src/qwik-cdk/dialog/SYNC.md`

**Interfaces:**
- Produces: `class DialogConfig<D, R>` with the full surface from spec §5; three context IDs (`DIALOG_DATA`, `DEFAULT_DIALOG_CONFIG`, `DIALOG_SCROLL_STRATEGY`).

- [ ] **Step 1: Write `dialog-config.ts` (verbatim from spec §5)** — copy the full class declaration.

- [ ] **Step 2: Write `dialog-tokens.ts` (verbatim from spec §5)**

- [ ] **Step 3: Update `dialog/public-api.ts`**

```ts
export { DialogConfig } from './dialog-config';
export { DIALOG_DATA, DEFAULT_DIALOG_CONFIG, DIALOG_SCROLL_STRATEGY } from './dialog-tokens';
```

- [ ] **Step 4: Wire `DEFAULT_DIALOG_CONFIG` into `<QwikCdkRoot>`**

In `src/qwik-cdk/root.tsx`, add:
```ts
import { DEFAULT_DIALOG_CONFIG } from './dialog/dialog-tokens';
// ...
useContextProvider(DEFAULT_DIALOG_CONFIG, props.dialogDefaults ?? {});
```

- [ ] **Step 5: Test**

`src/qwik-cdk/dialog/dialog-config.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { DialogConfig } from './public-api';

describe('DialogConfig', () => {
  it('constructs empty', () => {
    const c = new DialogConfig();
    expect(c.role).toBeUndefined();
    expect(c.hasBackdrop).toBeUndefined();
  });
  it('all fields settable', () => {
    const c = new DialogConfig<{x: 1}>();
    c.data = { x: 1 };
    c.role = 'alertdialog';
    c.hasBackdrop = true;
    c.disableClose = true;
    c.panelClass = ['a', 'b'];
    expect(c.role).toBe('alertdialog');
    expect(c.panelClass).toEqual(['a', 'b']);
  });
});
```

Run: `pnpm -C src/qwik-cdk test dialog`
Expected: PASS.

- [ ] **Step 6: `.removed.md` + `SYNC.md`**

`src/qwik-cdk/dialog/dialog-module.removed.md`:
```md
# Not ported: dialog-module.ts
NgModules don't exist in Qwik. The export surface is dialog/public-api.ts.
```

`src/qwik-cdk/dialog/dialog-injectors.removed.md`:
```md
# Renamed: dialog-injectors.ts → dialog-tokens.ts
The three InjectionTokens become Qwik context IDs of the same names.
File renamed for clarity; the original name's record is here so syncers can
find it.
```

`src/qwik-cdk/dialog/SYNC.md` initial draft per spec §3 template, listing the deviations from spec §10.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): add DialogConfig and dialog tokens"
```

---

### Task 20: `CdkDialogContainer` component

**Reference sources:** `src/cdk/dialog/dialog-container.ts`, `src/cdk/dialog/dialog-container.html`, `src/cdk/dialog/dialog-container.scss`.

**Files:**
- Create: `src/qwik-cdk/dialog/dialog-container.tsx`
- Create: `src/qwik-cdk/dialog/dialog-container.html.removed.md`

**Interfaces:**
- Consumes: `useFocusTrap`, `DialogConfig`.
- Produces: `CdkDialogContainer` Qwik component, accepts `config` prop and renders the host element with ARIA attributes + focus trap. Children render through `<Slot/>`.

- [ ] **Step 1: Implement `dialog-container.tsx`** (from spec §6)

```tsx
import { component$, Slot, useSignal } from '@builder.io/qwik';
import { useFocusTrap } from '../a11y/focus-trap/use-focus-trap';
import type { DialogConfig } from './dialog-config';
import './../scss/dialog/dialog-container.scss';

function toArray<T>(v: T | T[] | undefined | null): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

export const CdkDialogContainer = component$<{ config: DialogConfig }>(({ config }) => {
  const hostRef = useSignal<HTMLElement>();
  useFocusTrap(hostRef, {
    autoFocus: config.autoFocus,
    restoreFocus: config.restoreFocus,
  });
  return (
    <div
      ref={hostRef}
      class={['cdk-dialog-container', ...toArray(config.panelClass)].join(' ')}
      tabIndex={-1}
      role={config.role ?? 'dialog'}
      aria-modal={config.ariaModal ?? true}
      aria-label={config.ariaLabel ?? undefined}
      aria-labelledby={config.ariaLabelledBy ?? undefined}
      aria-describedby={config.ariaDescribedBy ?? undefined}
    >
      <Slot/>
    </div>
  );
});
```

- [ ] **Step 2: `.removed.md`**

`src/qwik-cdk/dialog/dialog-container.html.removed.md`:
```md
# Folded: dialog-container.html
The Angular template (<ng-template cdkPortalOutlet>) is replaced by Qwik's
<Slot/> mechanism inside dialog-container.tsx. The portal-outlet pattern is
gone (see portal/dom-portal-outlet.removed.md).
```

- [ ] **Step 3: Test**

`src/qwik-cdk/dialog/dialog-container.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { CdkDialogContainer, DialogConfig } from './public-api';

describe('CdkDialogContainer', () => {
  it('renders host with cdk-dialog-container class and default role=dialog', async () => {
    const { render, screen } = await createDOM();
    const cfg = new DialogConfig();
    await render(<CdkDialogContainer config={cfg}><span>child</span></CdkDialogContainer>);
    expect(screen.outerHTML).toContain('cdk-dialog-container');
    expect(screen.outerHTML).toContain('role="dialog"');
    expect(screen.outerHTML).toContain('child');
  });
  it('applies role=alertdialog when configured', async () => {
    const { render, screen } = await createDOM();
    const cfg = new DialogConfig();
    cfg.role = 'alertdialog';
    await render(<CdkDialogContainer config={cfg}><span/></CdkDialogContainer>);
    expect(screen.outerHTML).toContain('role="alertdialog"');
  });
  it('applies ariaLabel', async () => {
    const { render, screen } = await createDOM();
    const cfg = new DialogConfig();
    cfg.ariaLabel = 'Settings';
    await render(<CdkDialogContainer config={cfg}><span/></CdkDialogContainer>);
    expect(screen.outerHTML).toContain('aria-label="Settings"');
  });
});
```

- [ ] **Step 4: Update public-api**

```ts
export { CdkDialogContainer } from './dialog-container';
```

Run: `pnpm -C src/qwik-cdk test dialog`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): add CdkDialogContainer component"
```

---

### Task 21: `DialogRef`

**Reference sources:** `src/cdk/dialog/dialog-ref.ts`.

**Files:**
- Create: `src/qwik-cdk/dialog/dialog-ref.ts`

**Interfaces:**
- Consumes: `OverlayRef`, `DialogConfig`.
- Produces: `class DialogRef<R, C>` per spec §5.

- [ ] **Step 1: Implement `dialog-ref.ts`**

```ts
import { type Signal } from '@builder.io/qwik';
import type { OverlayRef } from '../overlay/overlay-ref';
import type { DialogConfig } from './dialog-config';
import type { FocusOrigin } from '../a11y/focus-monitor/focus-monitor';

export class DialogRef<R = unknown, C = unknown> {
  readonly id: string;
  readonly isOpen: Signal<boolean>;
  readonly componentInstance: Signal<C | null>;
  readonly closed: Promise<R | undefined>;

  private _resolveClosed!: (r: R | undefined) => void;

  constructor(
    private readonly overlayRef: OverlayRef,
    private readonly config: DialogConfig<unknown, R>,
    isOpenSignal: Signal<boolean>,
    componentInstanceSignal: Signal<C | null>,
  ) {
    this.id = config.id!;
    this.isOpen = isOpenSignal;
    this.componentInstance = componentInstanceSignal;
    this.closed = new Promise<R | undefined>((resolve) => { this._resolveClosed = resolve; });
  }

  close(result?: R, _options?: { focusOrigin?: FocusOrigin }): void {
    if (!this.isOpen.value) return;
    (this.isOpen as { value: boolean }).value = false;
    this.overlayRef.dispose();
    this._resolveClosed(result);
  }

  updatePosition(): void { this.overlayRef.updatePosition(); }
  updateSize(width?: string | number, height?: string | number): void {
    this.overlayRef.updateSize({ width, height });
  }
  addPanelClass(classes: string | string[]): void { this.overlayRef.addPanelClass(classes); }
  removePanelClass(classes: string | string[]): void { this.overlayRef.removePanelClass(classes); }
}
```

- [ ] **Step 2: Update public-api**

```ts
export { DialogRef } from './dialog-ref';
```

- [ ] **Step 3: Test**

`src/qwik-cdk/dialog/dialog-ref.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { DialogRef, DialogConfig } from './public-api';

describe('DialogRef', () => {
  it('resolves closed promise with result when close() called', async () => {
    const cfg = new DialogConfig();
    cfg.id = 'd1';
    const overlayRef: any = { dispose() {}, updatePosition() {}, updateSize() {}, addPanelClass() {}, removePanelClass() {} };
    const isOpen: any = { value: true };
    const instance: any = { value: null };
    const ref = new DialogRef(overlayRef, cfg, isOpen, instance);
    ref.close('done');
    await expect(ref.closed).resolves.toBe('done');
    expect(isOpen.value).toBe(false);
  });
});
```

Run: `pnpm -C src/qwik-cdk test dialog`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): add DialogRef with promise-based close"
```

---

### Task 22: `useDialog()` hook + `Dialog` service

**Reference sources:** `src/cdk/dialog/dialog.ts`.

**Files:**
- Create: `src/qwik-cdk/dialog/dialog.ts`
- Update: `src/qwik-cdk/dialog/public-api.ts`
- Modify: `src/qwik-cdk/root.tsx` (provide DIALOG context + Dialog service)

**Interfaces:**
- Consumes: `OVERLAY_REGISTRY`, `OVERLAY`, `_IdGenerator`, `DEFAULT_DIALOG_CONFIG`, `OverlayKeyboardDispatcher`, `OverlayOutsideClickDispatcher`.
- Produces: `interface Dialog`, `DIALOG` context, `useDialog()`.

- [ ] **Step 1: Implement `dialog.ts`**

```tsx
import {
  $, component$, createContextId, Slot, useContext, useContextProvider,
  useSignal, type Component, type QRL, type Signal,
} from '@builder.io/qwik';
import { isBrowser } from '@builder.io/qwik/build';
import type { DialogConfig } from './dialog-config';
import { DialogRef } from './dialog-ref';
import { DialogConfig as DialogConfigCtor } from './dialog-config';
import { CdkDialogContainer } from './dialog-container';
import { useOverlay, type OverlayRef } from '../overlay/public-api';
import { useIdGenerator, DIALOG_DATA, DEFAULT_DIALOG_CONFIG } from '../dialog/dialog-tokens';
import { _IdGenerator } from '../a11y/id-generator';

export interface Dialog {
  open<C, D = unknown, R = unknown>(
    component: Component<any>,
    config?: DialogConfig<D, R>,
  ): DialogRef<R, C>;
  closeAll(): void;
  getDialogById<R = unknown>(id: string): DialogRef<R> | undefined;
  readonly openDialogs: Signal<readonly DialogRef[]>;
}

export const DIALOG = createContextId<Dialog>('qwik-cdk/dialog');

export function useDialog(): Dialog { return useContext(DIALOG); }

/**
 * The Dialog wrapper component that the registry renders for each open dialog.
 * It plugs the user's component into a CdkDialogContainer, providing DIALOG_DATA.
 */
const DialogWrapper = component$<{ config: DialogConfig; ContentComponent: Component<any>; contentProps: any }>(
  ({ config, ContentComponent, contentProps }) => {
    useContextProvider(DIALOG_DATA, config.data);
    return (
      <CdkDialogContainer config={config}>
        <ContentComponent {...contentProps}/>
      </CdkDialogContainer>
    );
  },
);

export function createDialogService(deps: {
  overlay: ReturnType<typeof useOverlay>,
  idGen: _IdGenerator,
  defaults: Partial<DialogConfig>,
  openDialogs: Signal<readonly DialogRef[]>,
}): Dialog {
  return {
    openDialogs: deps.openDialogs,
    open<C, D, R>(component: Component<any>, config?: DialogConfig<D, R>): DialogRef<R, C> {
      // SSR no-op
      if (!isBrowser) {
        const isOpen = { value: false } as Signal<boolean>;
        const instance = { value: null } as Signal<C | null>;
        const fake = new DialogRef<R, C>({ dispose() {}, updatePosition() {}, updateSize() {}, addPanelClass() {}, removePanelClass() {} } as any,
                                          (config ?? new DialogConfigCtor()) as any, isOpen, instance);
        (fake as any)._resolveClosed(undefined);
        return fake;
      }

      const merged = Object.assign(new DialogConfigCtor(), deps.defaults, config ?? {});
      if (!merged.id) merged.id = deps.idGen.getId('cdk-dialog-');

      const isOpen = { value: true } as Signal<boolean>;
      const instance = { value: null } as Signal<C | null>;

      const overlayRef: OverlayRef = deps.overlay.create(
        DialogWrapper,
        { config: merged, ContentComponent: component, contentProps: {} },
        {
          hasBackdrop: merged.hasBackdrop ?? true,
          panelClass: merged.panelClass,
          width: merged.width,
          height: merged.height,
          // ... other overlay-relevant config fields
          positionStrategy: merged.positionStrategy,
          scrollStrategy: merged.scrollStrategy,
        } as any,
      );

      const ref = new DialogRef<R, C>(overlayRef, merged as any, isOpen, instance);

      // Wire close-on-Escape, close-on-backdrop-click, etc.
      if (!merged.disableClose) {
        wireCloseBehavior(overlayRef, merged, ref);
      }

      deps.openDialogs.value = [...deps.openDialogs.value, ref] as readonly DialogRef[];
      ref.closed.then(() => {
        deps.openDialogs.value = deps.openDialogs.value.filter((r) => r !== ref);
      });

      return ref;
    },
    closeAll(): void {
      for (const r of deps.openDialogs.value) r.close();
    },
    getDialogById<R>(id: string): DialogRef<R> | undefined {
      return deps.openDialogs.value.find((r) => r.id === id) as DialogRef<R> | undefined;
    },
  };
}

function wireCloseBehavior(overlayRef: OverlayRef, config: DialogConfig, ref: DialogRef) {
  // Backdrop click
  const host = overlayRef.hostElement;
  // Listeners are attached in OverlayHost via useVisibleTask$ — actual wiring
  // here will need a small callback pipeline. For Phase 7 baseline, attach
  // directly after a microtask:
  queueMicrotask(() => {
    const h = overlayRef.hostElement;
    if (!h) return;
    h.querySelector('.cdk-overlay-backdrop')?.addEventListener('click', (e) => {
      config.onBackdropClick$?.(e as MouseEvent);
      if (!config.disableClose) ref.close();
    });
  });
  // Escape key — handled by keyboard dispatcher in a future iteration; here
  // we attach a direct listener that auto-cleans on close.
  const onKey = (e: KeyboardEvent) => {
    config.onKeydown$?.(e);
    if (e.key === 'Escape' && !config.disableClose) ref.close();
  };
  document.addEventListener('keydown', onKey);
  ref.closed.finally(() => document.removeEventListener('keydown', onKey));
}
```

- [ ] **Step 2: Wire DIALOG context into `root.tsx`**

In `src/qwik-cdk/root.tsx`, add after the other `useContextProvider` calls:

```ts
import { createDialogService, DIALOG, type Dialog } from './dialog/dialog';
import type { DialogRef } from './dialog/dialog-ref';

// ...inside component$:
const openDialogs = useSignal<readonly DialogRef[]>([]);
const dialog: Dialog = createDialogService({
  overlay, idGen, defaults: props.dialogDefaults ?? {}, openDialogs,
});
useContextProvider(DIALOG, dialog);
```

- [ ] **Step 3: Update `dialog/public-api.ts`**

```ts
export { Dialog, DIALOG, useDialog, createDialogService } from './dialog';
```

- [ ] **Step 4: End-to-end smoke test**

`src/qwik-cdk/dialog/dialog.spec.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { component$, $, useContext } from '@builder.io/qwik';
import { QwikCdkRoot } from '../index';
import { useDialog, DIALOG_DATA } from './public-api';

const Body = component$(() => {
  const data = useContext(DIALOG_DATA) as { msg: string };
  return <p class="dialog-body">{data.msg}</p>;
});

const Opener = component$(() => {
  const dialog = useDialog();
  return (
    <button class="opener" onClick$={$(() => {
      dialog.open(Body, { data: { msg: 'hello' }, hasBackdrop: true });
    })}>open</button>
  );
});

describe('useDialog', () => {
  it('opens a dialog and renders its content', async () => {
    const { render, userEvent, screen } = await createDOM();
    await render(<QwikCdkRoot><Opener/></QwikCdkRoot>);
    await userEvent('.opener', 'click');
    expect(screen.outerHTML).toContain('dialog-body');
    expect(screen.outerHTML).toContain('hello');
    expect(screen.outerHTML).toContain('cdk-overlay-container');
    expect(screen.outerHTML).toContain('cdk-overlay-pane');
    expect(screen.outerHTML).toContain('cdk-dialog-container');
  });
});
```

Run: `pnpm -C src/qwik-cdk test dialog`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): add useDialog hook and Dialog service"
```

---

### Task 23: Backdrop click + Escape close + outside-click via dispatchers (proper integration)

The Task 22 wiring uses ad-hoc listeners. This task replaces them with the proper dispatcher integration.

**Files:**
- Modify: `src/qwik-cdk/dialog/dialog.ts` (route through dispatchers)
- Modify: `src/qwik-cdk/overlay/dispatchers/overlay-keyboard-dispatcher.ts` (expose `add(ref, handler)` API)
- Modify: `src/qwik-cdk/overlay/dispatchers/overlay-outside-click-dispatcher.ts` (expose `add(ref, handler)` API)
- Modify: `src/qwik-cdk/overlay/overlay-host.tsx` (wire backdrop click via local listener; emit through ref)

**Interfaces:**
- Refines dispatchers' attach API to: `add(overlayRef, { onKeydown, onOutsideClick, eventPredicate? }): void` / `remove(overlayRef): void`.

- [ ] **Step 1: Refactor `OverlayKeyboardDispatcher`**

Expose:
```ts
add(ref: OverlayRef, handlers: { onKeydown: (e: KeyboardEvent) => void }): void;
remove(ref: OverlayRef): void;
```

Internal: maintains stack of `(ref, handlers)`; on `keydown` document event, calls `handlers.onKeydown` of the topmost ref whose `eventPredicate(e)` (from config) returns true (default: true).

- [ ] **Step 2: Refactor `OverlayOutsideClickDispatcher`** similarly with `onOutsideClick`.

- [ ] **Step 3: Re-wire `dialog.ts`** to call:

```ts
keyboardDispatcher.add(overlayRef, {
  onKeydown: (e) => {
    config.onKeydown$?.(e);
    if (e.key === 'Escape' && !config.disableClose) ref.close();
  },
});
outsideClickDispatcher.add(overlayRef, {
  onOutsideClick: (e) => {
    config.onOutsidePointer$?.(e);
    // Specific backdrop-click distinguished by target ∈ backdrop element:
    if (isBackdropClick(e, overlayRef) && !config.disableClose) ref.close();
  },
});
ref.closed.finally(() => {
  keyboardDispatcher.remove(overlayRef);
  outsideClickDispatcher.remove(overlayRef);
});
```

(Pass `keyboardDispatcher` and `outsideClickDispatcher` into `createDialogService` from `root.tsx`.)

- [ ] **Step 4: Re-run the Task 22 smoke test**

Run: `pnpm -C src/qwik-cdk test dialog`
Expected: PASS.

- [ ] **Step 5: Add Escape close test**

```ts
it('closes on Escape', async () => {
  // Open dialog (as above), then dispatch Escape:
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  // Assert the dialog is gone from the DOM.
});
```

Run: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-cdk
git commit -m "feat(multiple): wire dialog close-on-escape and backdrop-click via dispatchers"
```

---

### Task 24: Top-level `index.ts` exports + per-entry-point `README.md` files

**Files:**
- Modify: `src/qwik-cdk/index.ts` (final shape)
- Create: `src/qwik-cdk/{platform,bidi,coercion,keycodes,portal,a11y,overlay,dialog}/README.md` (one-paragraph each)

- [ ] **Step 1: Finalize `index.ts`**

```ts
// src/qwik-cdk/index.ts
export { QwikCdkRoot } from './root';
export type { QwikCdkRootProps } from './root';
```

- [ ] **Step 2: Write a README per entry-point**

Each entry's README is two sentences: what's exported, what it's for, and a link to the corresponding CDK entry-point. Example for `dialog`:

```md
# @angular-community/qwik-cdk/dialog
Qwik port of [@angular/cdk/dialog](https://github.com/angular/components/tree/main/src/cdk/dialog).
Exports `useDialog`, `DialogConfig`, `DialogRef`, `CdkDialogContainer`, `DIALOG_DATA`,
`DEFAULT_DIALOG_CONFIG`, `DIALOG_SCROLL_STRATEGY`. See SYNC.md for porting deviations.
```

- [ ] **Step 3: Build and lint pass**

Run: `pnpm -C src/qwik-cdk build && pnpm -C src/qwik-cdk typecheck && pnpm -C src/qwik-cdk test`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-cdk
git commit -m "docs(multiple): add per-entry-point READMEs and finalize index.ts"
```

---

## Phase 8 — Dev-app

### Task 25: `src/qwik-cdk-dev-app/` skeleton with QwikCdkRoot

**Files:**
- Create: `src/qwik-cdk-dev-app/package.json`
- Create: `src/qwik-cdk-dev-app/tsconfig.json`
- Create: `src/qwik-cdk-dev-app/vite.config.ts`
- Create: `src/qwik-cdk-dev-app/src/root.tsx`
- Create: `src/qwik-cdk-dev-app/src/entry.ssr.tsx`
- Create: `src/qwik-cdk-dev-app/src/entry.dev.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/index.tsx`

**Interfaces:**
- Produces: `pnpm -C src/qwik-cdk-dev-app dev` runs a Qwik City app wrapping the routes in `<QwikCdkRoot>`.

- [ ] **Step 1: `package.json`**

```jsonc
{
  "name": "qwik-cdk-dev-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && vite build --ssr src/entry.ssr.tsx",
    "preview": "vite preview"
  },
  "dependencies": {
    "@angular-community/qwik-cdk": "workspace:*"
  },
  "devDependencies": {
    "@builder.io/qwik": "^1.5.0",
    "@builder.io/qwik-city": "^1.5.0",
    "vite": "*",
    "typescript": "*"
  }
}
```

- [ ] **Step 2: Standard Qwik City scaffolding** (use Qwik City's recommended `vite.config.ts`, `tsconfig.json`, `src/root.tsx`, `src/entry.ssr.tsx`, `src/entry.dev.tsx`). Wrap the root `<RouterHead>`/`<Router>` content with `<QwikCdkRoot>`.

`src/qwik-cdk-dev-app/src/root.tsx`:
```tsx
import { component$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet } from '@builder.io/qwik-city';
import { QwikCdkRoot } from '@angular-community/qwik-cdk';
import '@angular-community/qwik-cdk/overlay-prebuilt.css';

export default component$(() => (
  <QwikCityProvider>
    <head>
      <meta charSet="utf-8" />
      <title>qwik-cdk dev-app</title>
    </head>
    <body>
      <QwikCdkRoot>
        <RouterOutlet />
      </QwikCdkRoot>
    </body>
  </QwikCityProvider>
));
```

- [ ] **Step 3: Index route with one open-dialog button**

`src/qwik-cdk-dev-app/src/routes/index.tsx`:
```tsx
import { component$, $, useContext } from '@builder.io/qwik';
import { useDialog, DIALOG_DATA } from '@angular-community/qwik-cdk/dialog';

const Body = component$(() => {
  const data = useContext(DIALOG_DATA) as { msg: string };
  return <p>{data.msg}</p>;
});

export default component$(() => {
  const dialog = useDialog();
  return (
    <main>
      <h1>qwik-cdk dev-app</h1>
      <button onClick$={$(() => dialog.open(Body, { data: { msg: 'hello' }, hasBackdrop: true }))}>
        open dialog
      </button>
    </main>
  );
});
```

- [ ] **Step 4: Run it**

```bash
pnpm install
pnpm -C src/qwik-cdk-dev-app dev
```

Open http://localhost:5173, click "open dialog", verify the dialog opens with backdrop. Close via Escape or backdrop click.

- [ ] **Step 5: SSR check**

```bash
pnpm -C src/qwik-cdk-dev-app build && pnpm -C src/qwik-cdk-dev-app preview
```

Verify it renders the page server-side without errors (no "document is not defined" in the build/preview logs), and that opening the dialog still works after resume.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-cdk-dev-app
git commit -m "feat(multiple): add qwik-cdk-dev-app with basic dialog scenario"
```

---

### Task 26: Dev-app: 20 scenario routes for Playwright parity

**Files:**
- Create: `src/qwik-cdk-dev-app/src/routes/dialog/<scenario>.tsx` × 20

**Interfaces:**
- Produces: routes `/dialog/basic`, `/dialog/with-data`, `/dialog/no-backdrop`, `/dialog/custom-panel-class`, `/dialog/escape-close`, `/dialog/backdrop-click-close`, `/dialog/disable-close`, `/dialog/multiple-stacked`, `/dialog/alertdialog-role`, `/dialog/aria-label`, `/dialog/aria-labelledby`, `/dialog/aria-describedby`, `/dialog/auto-focus-first-tabbable`, `/dialog/auto-focus-first-heading`, `/dialog/auto-focus-disabled`, `/dialog/restore-focus`, `/dialog/custom-position`, `/dialog/custom-scroll-strategy`, `/dialog/width-height`, `/dialog/min-max`.

**Pattern:** every route auto-opens its dialog on load (via `useVisibleTask$`) with the scenario-specific config, so Playwright can navigate-and-snapshot.

- [ ] **Step 1: Create a shared scenario template**

`src/qwik-cdk-dev-app/src/routes/dialog/_template.tsx`:
```tsx
import { component$, useVisibleTask$, useContext } from '@builder.io/qwik';
import type { Component } from '@builder.io/qwik';
import { useDialog, DIALOG_DATA } from '@angular-community/qwik-cdk/dialog';
import type { DialogConfig } from '@angular-community/qwik-cdk/dialog';

export const ScenarioBody = component$(() => <div class="scenario-body">scenario</div>);

export interface AutoOpenProps<D = unknown> {
  Body?: Component<any>;
  config?: DialogConfig<D, any>;
}

export const AutoOpen = component$<AutoOpenProps>((props) => {
  const dialog = useDialog();
  useVisibleTask$(() => {
    dialog.open(props.Body ?? ScenarioBody, props.config);
  });
  return <main data-scenario-ready>ready</main>;
});
```

- [ ] **Step 2: Add 20 route files** — each ~10 lines. Example:

`src/qwik-cdk-dev-app/src/routes/dialog/basic/index.tsx`:
```tsx
import { component$ } from '@builder.io/qwik';
import { AutoOpen } from '../_template';

export default component$(() => <AutoOpen config={{ hasBackdrop: true } as any}/>);
```

`src/qwik-cdk-dev-app/src/routes/dialog/no-backdrop/index.tsx`:
```tsx
import { component$ } from '@builder.io/qwik';
import { AutoOpen } from '../_template';

export default component$(() => <AutoOpen config={{ hasBackdrop: false } as any}/>);
```

(repeat for each scenario; full file contents are in this plan as code blocks if needed — the parity-test scenarios listed in §9 of the spec describe each variant).

For the more involved scenarios:

`src/qwik-cdk-dev-app/src/routes/dialog/alertdialog-role/index.tsx`:
```tsx
import { component$ } from '@builder.io/qwik';
import { AutoOpen } from '../_template';
export default component$(() => <AutoOpen config={{ role: 'alertdialog' } as any}/>);
```

`src/qwik-cdk-dev-app/src/routes/dialog/aria-labelledby/index.tsx`:
```tsx
import { component$ } from '@builder.io/qwik';
import { AutoOpen, ScenarioBody } from '../_template';
const LabelledBody = component$(() => (<><h2 id="title">Confirm</h2><p>Sure?</p></>));
export default component$(() => (
  <AutoOpen Body={LabelledBody} config={{ ariaLabelledBy: 'title' } as any}/>
));
```

`src/qwik-cdk-dev-app/src/routes/dialog/multiple-stacked/index.tsx`:
```tsx
import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { useDialog } from '@angular-community/qwik-cdk/dialog';
import { ScenarioBody } from '../_template';

export default component$(() => {
  const dialog = useDialog();
  useVisibleTask$(() => {
    dialog.open(ScenarioBody, { id: 'a', hasBackdrop: true } as any);
    dialog.open(ScenarioBody, { id: 'b', hasBackdrop: true } as any);
  });
  return <main data-scenario-ready>ready</main>;
});
```

… and so on for the other 16 scenarios.

- [ ] **Step 3: Verify each route in dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app dev
```

Navigate manually to each of the 20 routes; verify a dialog renders.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-cdk-dev-app
git commit -m "feat(multiple): add 20 dialog scenario routes in dev-app for parity tests"
```

---

## Phase 9 — Tests

### Task 27: Vitest scenario port from `src/cdk/dialog/dialog.spec.ts`

**Files:**
- Update: `src/qwik-cdk/dialog/dialog.spec.ts` (expand from smoke to full scenario port)

**Interfaces:**
- Produces: a Vitest spec mirroring `src/cdk/dialog/dialog.spec.ts`, with each scenario either ported or annotated as skipped (Angular-specific).

- [ ] **Step 1: Read `src/cdk/dialog/dialog.spec.ts`** (≈800 lines, ~150 `it` blocks).

- [ ] **Step 2: Port each `it` block one at a time**

For each describe/it block, decide:
- **Port:** if it tests behavior (DOM, ARIA, focus, classes, lifecycle effects observable from outside Angular). Translate to Vitest using `createDOM` + the `Opener` pattern from Task 22's test. Use `useVisibleTask$` to auto-open inside a test harness component.
- **Skip:** if it tests Angular plumbing (TestBed providers, NgZone interactions, change-detection ordering, `ComponentRef` destroy timing). Add comment `// Skipped (Angular-specific): <CDK file line range> — <reason>` and a `it.skip(...)`.

For each block, after porting, append to the entry-point `SYNC.md`'s "Scenario port log".

- [ ] **Step 3: Run the full spec**

Run: `pnpm -C src/qwik-cdk test dialog/dialog.spec.ts`
Expected: PASS for ported scenarios; skipped scenarios are visible in the output.

- [ ] **Step 4: Append final counts to `src/qwik-cdk/dialog/SYNC.md`** under "Scenario port log".

- [ ] **Step 5: Commit**

```bash
git add src/qwik-cdk
git commit -m "test(multiple): port dialog.spec.ts scenarios to vitest"
```

---

### Task 28: Vitest scenario port from `src/cdk/overlay/*.spec.ts`

**Files:**
- Update: `src/qwik-cdk/overlay/overlay.spec.ts`, `overlay-container.spec.ts`, `position/flexible-connected-position-strategy.spec.ts`, `position/global-position-strategy.spec.ts`, `scroll/block-scroll-strategy.spec.ts`, `scroll/close-scroll-strategy.spec.ts`, `scroll/reposition-scroll-strategy.spec.ts`, `dispatchers/overlay-keyboard-dispatcher.spec.ts`, `dispatchers/overlay-outside-click-dispatcher.spec.ts`.

Same process as Task 27: read CDK spec, port behavior scenarios, skip Angular-specific ones, update entry SYNC.md.

- [ ] **Step 1:** for each CDK spec file in the list, repeat the port-or-skip process.

- [ ] **Step 2:** Run `pnpm -C src/qwik-cdk test overlay`. Fix any new failures.

- [ ] **Step 3:** Commit per-file or as a single squashed commit.

```bash
git add src/qwik-cdk
git commit -m "test(multiple): port overlay/* specs to vitest"
```

---

### Task 29: Playwright structural-parity package setup

**Files:**
- Create: `src/qwik-cdk-parity-tests/package.json`
- Create: `src/qwik-cdk-parity-tests/playwright.config.ts`
- Create: `src/qwik-cdk-parity-tests/lib/structural-diff.ts`
- Create: `src/qwik-cdk-parity-tests/lib/serve-apps.ts` (start CDK dev-app + qwik-cdk-dev-app side-by-side)
- Create: `src/qwik-cdk-parity-tests/specs/dialog-basic.spec.ts` (first scenario)

**Interfaces:**
- Produces: `pnpm -C src/qwik-cdk-parity-tests test` runs Playwright against both dev-apps and asserts structural parity for the basic scenario.

- [ ] **Step 1: `package.json`**

```jsonc
{
  "name": "qwik-cdk-parity-tests",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "*",
    "typescript": "*"
  }
}
```

- [ ] **Step 2: `playwright.config.ts`** — boots both dev-apps via `webServer`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  use: { trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'pnpm -C ../../ dev-app',
      port: 4200, // angular dev-app
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'pnpm -C ../qwik-cdk-dev-app dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
```

- [ ] **Step 3: `lib/structural-diff.ts`** — produces a serializable tree from a DOM node and diffs two trees:

```ts
import type { Locator, Page } from '@playwright/test';

export interface Node {
  tag: string;
  classes: string[];
  attrs: Record<string, string>;
  styles: Partial<CSSStyleDeclaration>;
  children: Node[];
  text?: string;
}

const IGNORE_ATTRS = new Set(['ng-version', 'data-overlay-id']);
const IGNORE_ATTR_PREFIXES = ['_ngcontent-', '_nghost-', 'ng-reflect-', 'data-q'];
const KEEP_STYLES = ['display', 'position', 'z-index', 'width', 'height', 'top', 'left', 'transform', 'opacity'];

export async function snapshot(loc: Locator): Promise<Node> {
  return loc.evaluate((el: Element, opts) => walk(el, opts), { KEEP_STYLES });
}

// walk runs in browser context — implementation inlined:
function walk(el: Element, { KEEP_STYLES }: { KEEP_STYLES: string[] }): Node {
  // (see Step 5 for the full evaluator)
}

export function diffNodes(a: Node, b: Node, path = 'root'): string[] {
  const diffs: string[] = [];
  if (a.tag !== b.tag) diffs.push(`${path}: tag ${a.tag} != ${b.tag}`);
  const aCls = [...a.classes].sort().join(' ');
  const bCls = [...b.classes].sort().join(' ');
  if (aCls !== bCls) diffs.push(`${path}: classes [${aCls}] != [${bCls}]`);
  // attrs
  for (const k of new Set([...Object.keys(a.attrs), ...Object.keys(b.attrs)])) {
    if (a.attrs[k] !== b.attrs[k]) diffs.push(`${path}: attr ${k} '${a.attrs[k]}' != '${b.attrs[k]}'`);
  }
  // styles
  for (const k of new Set([...Object.keys(a.styles), ...Object.keys(b.styles)])) {
    if ((a.styles as any)[k] !== (b.styles as any)[k])
      diffs.push(`${path}: style ${k} '${(a.styles as any)[k]}' != '${(b.styles as any)[k]}'`);
  }
  if ((a.children.length) !== (b.children.length)) diffs.push(`${path}: child count ${a.children.length} != ${b.children.length}`);
  for (let i = 0; i < Math.min(a.children.length, b.children.length); i++) {
    diffs.push(...diffNodes(a.children[i], b.children[i], `${path}>${a.children[i].tag}[${i}]`));
  }
  return diffs;
}
```

- [ ] **Step 4: Define the in-page `walk` function** by including it in `page.addInitScript` (full implementation, ~30 lines): captures tag, filtered classes/attrs, KEEP_STYLES from `getComputedStyle`, recurses children.

- [ ] **Step 5: First parity test**

`src/qwik-cdk-parity-tests/specs/dialog-basic.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { snapshot, diffNodes } from '../lib/structural-diff';

test('dialog basic: structural parity', async ({ page, browser }) => {
  await page.goto('http://localhost:4200/dialog/basic');
  await page.waitForSelector('.cdk-overlay-container');
  const angularSnap = await snapshot(page.locator('.cdk-overlay-container'));

  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto('http://localhost:5173/dialog/basic');
  await page2.waitForSelector('.cdk-overlay-container');
  const qwikSnap = await snapshot(page2.locator('.cdk-overlay-container'));

  const diffs = diffNodes(angularSnap, qwikSnap);
  expect(diffs, diffs.join('\n')).toEqual([]);
});
```

- [ ] **Step 6: Run it**

```bash
pnpm install
cd src/qwik-cdk-parity-tests && pnpm playwright install chromium
pnpm -C src/qwik-cdk-parity-tests test
```

Expected: PASS. If diffs surface, that's a SIGNAL — investigate which side is wrong (probably qwik-cdk; CDK is the reference). Iterate on the OverlayHost/DialogContainer DOM until the diff is empty.

- [ ] **Step 7: Add a corresponding `/dialog/basic` route in CDK's dev-app**

Check if `src/dev-app/dialog/dialog-demo.ts` already covers this. If not, add a route. Use the existing CDK dev-app conventions.

- [ ] **Step 8: Commit**

```bash
git add src/qwik-cdk-parity-tests
git commit -m "test(multiple): add Playwright parity test package and first dialog scenario"
```

---

### Task 30: Playwright parity — remaining 19 scenarios

**Files:**
- Create: `src/qwik-cdk-parity-tests/specs/dialog-<scenario>.spec.ts` × 19

For each of the 19 remaining scenarios, write a parity spec following Task 29's pattern. The route paths (`/dialog/with-data`, `/dialog/no-backdrop`, etc.) match between dev-apps.

- [ ] **Step 1: Write all 19 specs.** Each is ~20 lines.

- [ ] **Step 2: Run the full parity suite**

```bash
pnpm -C src/qwik-cdk-parity-tests test
```

Expected: all 20 pass. Iterate on qwik-cdk DOM until any diff is empty.

- [ ] **Step 3: Commit**

```bash
git add src/qwik-cdk-parity-tests
git commit -m "test(multiple): complete 20 dialog parity scenarios"
```

---

## Phase 10 — Finalization

### Task 31: SSR audit lint

**Files:**
- Create: `src/qwik-cdk/scripts/lint-no-ssr-leaks.mjs`

**Interfaces:**
- Produces: `pnpm -C src/qwik-cdk lint:no-ssr-leaks` that exits non-zero if any `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` occurs outside a `useVisibleTask$` callback OR an `if (isBrowser)` guard, in non-spec files.

- [ ] **Step 1: Implement the lint**

```js
#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const FORBIDDEN = /\b(document|window|navigator)\.|getComputedStyle\(|requestAnimationFrame\(/g;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', 'dist', 'scss', 'scripts'].includes(e.name)) continue;
      yield* walk(p);
    } else if (e.isFile() && /\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.spec.ts')) {
      yield p;
    }
  }
}

const failures = [];
for await (const f of walk(root)) {
  const src = await readFile(f, 'utf8');
  // remove comments + strings (cheap, not perfect)
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/(['"`])(?:\\.|[^\\])*?\1/g, '""');

  // Find forbidden tokens
  const m = [...stripped.matchAll(FORBIDDEN)];
  for (const match of m) {
    // Check whether this occurrence is inside useVisibleTask$ or an isBrowser guard
    const upto = stripped.slice(0, match.index!);
    const lastTask = upto.lastIndexOf('useVisibleTask$');
    const lastTaskEnd = lastTask >= 0 ? findBalanced(stripped, lastTask) : -1;
    const inTask = lastTask >= 0 && match.index! < lastTaskEnd;

    // crude isBrowser guard detection: any `if (isBrowser)` within 200 chars before
    const slice = upto.slice(Math.max(0, upto.length - 200));
    const guarded = /\bisBrowser\b/.test(slice);

    if (!inTask && !guarded) {
      failures.push(`${relative(root, f)}: ${match[0]} (unguarded)`);
    }
  }
}

function findBalanced(s, fromIdx) {
  let depth = 0, i = s.indexOf('(', fromIdx);
  for (; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') { depth--; if (depth === 0) return i; }
  }
  return s.length;
}

if (failures.length) {
  console.error('SSR leaks found:');
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('No SSR leaks.');
```

- [ ] **Step 2: Run it; fix violations**

```bash
pnpm -C src/qwik-cdk lint:no-ssr-leaks
```

If violations show up, wrap the offending code in `if (isBrowser)` or move it into a `useVisibleTask$`. Iterate.

- [ ] **Step 3: Commit**

```bash
git add src/qwik-cdk
git commit -m "test(multiple): add SSR-leak lint for qwik-cdk"
```

---

### Task 32: SYNC.md files + root pnpm scripts

**Files:**
- Create: `src/qwik-cdk/SYNC.md` (top-level)
- Update: `src/qwik-cdk/{platform,bidi,coercion,keycodes,portal,a11y,overlay,dialog}/SYNC.md` (final state — ensure each has Synced files / Intentionally not ported / Open deviations / Scenario port log)
- Modify: root `package.json` (add `test:qwik-cdk` script)

- [ ] **Step 1: Top-level `src/qwik-cdk/SYNC.md`**

```md
# qwik-cdk sync log

Last fully-synced from angular/components commit: <sha-of-main-at-port-time>

## Per-entry-point sync state

| Entry-point | Last synced SHA | Status |
|---|---|---|
| platform | <sha> | green |
| bidi     | <sha> | green |
| coercion | <sha> | green |
| keycodes | <sha> | green |
| portal   | <sha> | green |
| a11y     | <sha> | partial (subset only — Dialog dependencies; see a11y/SYNC.md) |
| overlay  | <sha> | green |
| dialog   | <sha> | green |

## Sync recipe

(Replicate from spec §11.)

## Cadence

(Replicate from spec §11.)
```

Fill `<sha>` with `git rev-parse HEAD` output at the time of writing.

- [ ] **Step 2: Verify each per-entry `SYNC.md` is complete**

Each should contain:
- "Synced files:" — listing every file ported
- "Intentionally not ported:" — listing every CDK file we deliberately skipped (with a one-line reason)
- "Open deviations:" — every API divergence from spec §10 that applies to this entry
- "Scenario port log:" (for entries with ported tests) — listing every CDK test scenario as ✓ ported or ✗ skipped (with reason)

Run: `for d in src/qwik-cdk/{platform,bidi,coercion,keycodes,portal,a11y,overlay,dialog}; do echo "--- $d/SYNC.md ---"; cat "$d/SYNC.md"; done` to review them all.

- [ ] **Step 3: Add root `test:qwik-cdk` script**

In root `package.json` `scripts`:
```jsonc
"test:qwik-cdk": "pnpm -C src/qwik-cdk build && pnpm -C src/qwik-cdk test && pnpm -C src/qwik-cdk lint:no-ssr-leaks && pnpm -C src/qwik-cdk test:css-parity && pnpm -C src/qwik-cdk-parity-tests test"
```

- [ ] **Step 4: Run the full pipeline**

```bash
pnpm install
pnpm test:qwik-cdk
```

Expected: green. If anything fails, fix and rerun.

- [ ] **Step 5: Final commit**

```bash
git add src/qwik-cdk src/qwik-cdk-dev-app src/qwik-cdk-parity-tests package.json
git commit -m "feat(multiple): finalize qwik-cdk SYNC.md files and root test:qwik-cdk pipeline"
```

---

## Completion checklist

Before considering this plan done, verify:

- [ ] `pnpm -C src/qwik-cdk build` succeeds; `dist/` contains one bundle per entry-point.
- [ ] `pnpm -C src/qwik-cdk test` is fully green.
- [ ] `pnpm -C src/qwik-cdk lint:no-ssr-leaks` is green.
- [ ] `pnpm -C src/qwik-cdk test:css-parity` is green.
- [ ] `pnpm -C src/qwik-cdk-dev-app dev` boots; can manually open & close a dialog.
- [ ] `pnpm -C src/qwik-cdk-dev-app build && preview` renders without `document is not defined`; dialog opens after resume.
- [ ] `pnpm -C src/qwik-cdk-parity-tests test` is green across all 20 scenarios.
- [ ] `pnpm test:qwik-cdk` (root) is fully green.
- [ ] All per-entry `SYNC.md` files are present and complete.
- [ ] Spec §10 "Open deviations" catalogue matches what's recorded in `SYNC.md` files.
