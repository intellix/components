# qwik-material Button Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/button/` (four Angular Material button components: standard, icon, FAB, mini-FAB) into a `qwik-material/button` entry-point that consumes qwik-cdk, mirroring the shape of the completed Dialog port.

**Architecture:** Four thin `component$` wrappers (`<MatButton>`, `<MatIconButton>`, `<MatFabButton>`, `<MatMiniFabButton>`) + three internal helpers (`<PersistentRipple>`, `<FocusIndicator>`, `<TouchTarget>`) + one plain-object config context. Anchor form is opt-in via `href` prop. CSS-only ripple-lite via existing MDC persistent-ripple SCSS; JS ripple deferred to a future qwik-cdk `MatRipple` primitive.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package created by the Dialog port.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./button`. New prebuilt CSS entry: `./button-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths in this plan are relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-07-15-qwik-material-button-port-design.md](../specs/2026-07-15-qwik-material-button-port-design.md). Read §2 (Public API), §3 (Internal architecture), §6 (CSS delivery), §8 (Deviations catalog) before starting any port task.
- **Material source reference:** `src/material/button/`. Every port task names the exact source file(s) it mirrors.
- **qwik-cdk peer:** `@angular-community/qwik-cdk` at `workspace:*` (already declared by the Dialog port). Button doesn't consume qwik-cdk at runtime, but the peer stays for shared build/typing conventions.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. E.g. `button.ts` → `mat-button.tsx`; `button-config.ts` (spec-invented) stays as-is because it has no upstream `.ts` counterpart. Component files use `.tsx`. Templates (`*.html`) collapse into their `.tsx` JSX with a `<basename>.html.removed.md` breadcrumb.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/button/SYNC.md`. Consumer-facing type names (`MatButton`, `MatIconButton`, `MatFabButton`, `MatMiniFabButton`, `MatButtonConfig`, `MatButtonAppearance`) stay the same but shift from `class X` to `Component<Props>` or `interface X`.
- **No RxJS dependency.**
- **No exported classes** in the consumer surface. `button/public-api.ts` must not contain `export class` — only `export interface`, `export type`, `export const *_CONTEXT` / `export const Mat*Button` (component references), and `export * from` re-exports.
- **SSR safety:** every `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` call must be inside `useVisibleTask$` OR guarded by `typeof <global> !== 'undefined'`. **Do NOT use `isBrowser` from `@builder.io/qwik/build`** as an SSR guard — the qwikVite CSR-optimizer inlines it to `true` and DCE strips the guard (verified by qwik-cdk commit `a1e69c1f6`). Button v1 has no runtime browser-global access; the guard rule still applies to any future edits.
- **Commit message scope:** the upstream repo's commit-msg hook does not know `qwik-material`; use scope `multiple` (which is in the allowed list) for commits to qwik-material files.
- **Pnpm version:** the repo pins `pnpm@11.7.0`. Don't change it.
- **Node version:** the repo pins via `.nvmrc`. Don't change it.
- **No Bazel changes.** qwik-material lives outside the Bazel graph. Don't touch any `BUILD.bazel` file.
- **No upstream CI integration.** The plan stops at "qwik-material/button works locally".
- **Commit style:** every task ends with a commit named after the deliverable. Small, mechanical tasks may squash the "write failing test / verify fails / implement / verify passes" cycle into two commits (test+impl and commit); larger tasks use TDD strictly.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `button` entry-point into the existing qwik-material package

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both already exist from the Dialog port).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/button/index.ts` (empty stub — Task 11 replaces it with the real public-api re-export)

**Interfaces:**
- Consumes: existing package scaffolding from the Dialog port.
- Produces: `pnpm -C src/qwik-material build` still succeeds (dialog CSS still emits, no button CSS yet). Type resolution for `@angular-community/qwik-material/button` returns an empty module.

- [ ] **Step 1: Add the `./button` export entry to `src/qwik-material/package.json`**

Read the current `exports` block. Insert two new entries directly after the `./dialog` block: one for the JS entry-point and one for the prebuilt CSS.

Final `exports` block (only the two new entries are inserted):

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
  "./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
  "./button-prebuilt.css": "./dist/button-prebuilt.css",
  "./scss/*": "./scss/*"
}
```

- [ ] **Step 2: Extend the vite `entries` array + sassEntries in `src/qwik-material/vite.config.ts`**

Change the `entries` constant from `['dialog']` to `['dialog', 'button']`. Change the `sassEntries` array in the `qwik-material-compile-sass-prebuilt` plugin's `closeBundle` to include the button prebuilt path (the SCSS file itself does not exist yet — Task 2 lands it; the plugin's error handler already swallows ENOENT with a warning per the Dialog Task 3 precedent).

Final `entries` line:

```ts
const entries = ['dialog', 'button'];
```

Final `sassEntries` array:

```ts
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
];
```

- [ ] **Step 3: Create `src/qwik-material/button/index.ts`**

```ts
export {};
```

This is a stub. Task 11 replaces it with `export * from './public-api';`.

- [ ] **Step 4: Verify the build still succeeds**

Run:

```bash
pnpm -C src/qwik-material build
```

Expected:
- `dist/dialog-prebuilt.css` still emits with the M3 defaults from the Dialog port (from the earlier `a191597d5` commit).
- Console shows the warning `[qwik-material] skipping scss/button/button-prebuilt.scss — not yet present.` because the SCSS file lands in Task 2.
- Exit code 0.
- `ls dist/button/` shows one entry: `index.d.ts` (the empty module marker from the dts plugin).

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/package.json src/qwik-material/vite.config.ts src/qwik-material/button/index.ts
git commit -m "build(multiple): wire qwik-material/button entry-point into package + vite"
```

---

## Phase 2 — SCSS chain + prebuilt CSS

### Task 2: Copy Button SCSS + stub loop + prebuilt CSS with M3 defaults

**Reference source:** `src/material/button/button.scss`, `src/material/button/fab.scss`, `src/material/button/icon-button.scss`, `src/material/button/button-high-contrast.scss`, plus the five underscore partials (`_button-base.scss`, `_m2-button.scss`, `_m3-button.scss`, `_m2-fab.scss`, `_m3-fab.scss`, `_m2-icon-button.scss`, `_m3-icon-button.scss`, `_button-theme.scss`, `_fab-theme.scss`, `_icon-button-theme.scss`).

**Files:**
- Create: `src/qwik-material/scss/button/button.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/fab.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/icon-button.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/button-high-contrast.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_button-base.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_m2-button.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_m3-button.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_button-theme.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_m2-fab.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_m3-fab.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_fab-theme.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_m2-icon-button.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_m3-icon-button.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/_icon-button-theme.scss` (verbatim copy)
- Create: `src/qwik-material/scss/button/button-prebuilt.scss` (new entry — @use the four structural files + M3 :root defaults)
- Create (as needed): any additional stubs under `src/qwik-material/scss/` for `@use` paths outside `dialog/`. Most core stubs already exist from Dialog Task 3.

**Interfaces:**
- Consumes: Task 1's vite plumbing (`sassEntries` includes `scss/button/button-prebuilt.scss`).
- Produces: `dist/button-prebuilt.css` emitted after `pnpm build`. The CSS contains Material Button's structural + theme layers + M3 default `:root` values.

**Approach:** Copy the 14 source SCSS files verbatim. Enumerate any `@use` paths pointing outside the button folder. For each missing upstream path, either reuse an existing stub under `src/qwik-material/scss/core/**` (created by Dialog Task 3) or create a new stub. Each new stub starts with a `// STUB — see SYNC.md` comment.

- [ ] **Step 1: Copy the 14 SCSS files verbatim**

```bash
mkdir -p src/qwik-material/scss/button
cp src/material/button/button.scss                 src/qwik-material/scss/button/button.scss
cp src/material/button/fab.scss                    src/qwik-material/scss/button/fab.scss
cp src/material/button/icon-button.scss            src/qwik-material/scss/button/icon-button.scss
cp src/material/button/button-high-contrast.scss   src/qwik-material/scss/button/button-high-contrast.scss
cp src/material/button/_button-base.scss           src/qwik-material/scss/button/_button-base.scss
cp src/material/button/_m2-button.scss             src/qwik-material/scss/button/_m2-button.scss
cp src/material/button/_m3-button.scss             src/qwik-material/scss/button/_m3-button.scss
cp src/material/button/_button-theme.scss          src/qwik-material/scss/button/_button-theme.scss
cp src/material/button/_m2-fab.scss                src/qwik-material/scss/button/_m2-fab.scss
cp src/material/button/_m3-fab.scss                src/qwik-material/scss/button/_m3-fab.scss
cp src/material/button/_fab-theme.scss             src/qwik-material/scss/button/_fab-theme.scss
cp src/material/button/_m2-icon-button.scss        src/qwik-material/scss/button/_m2-icon-button.scss
cp src/material/button/_m3-icon-button.scss        src/qwik-material/scss/button/_m3-icon-button.scss
cp src/material/button/_icon-button-theme.scss     src/qwik-material/scss/button/_icon-button-theme.scss
```

- [ ] **Step 2: Enumerate `@use` paths that need stubs**

Run:

```bash
grep -h "^@use" src/qwik-material/scss/button/*.scss | sort -u
```

For each `@use` path that starts with `../` or references an Angular Material internal (e.g. `../core/tokens/m2-utils`, `../core/style/private`), record the path. Existing stubs under `src/qwik-material/scss/core/**` from Dialog Task 3 cover most of them (m2-utils, m3-utils, token-utils, sass-utils, elevation, private, inspection, theming). Note new paths that need fresh stubs.

- [ ] **Step 3: Create stubs for any missing `@use` paths (iterative)**

For each unresolved path not already covered by a Dialog-Task-3 stub, create a stub file at the matching relative path under `src/qwik-material/scss/`. Stub content = minimum function/mixin/variable definitions needed to satisfy the compile. Header:

```scss
// STUB: this file is a compile-time stand-in for @angular/material/<path>.
// See src/qwik-material/dialog/SYNC.md for the stubbing rationale.
// (Button-specific additions are logged in src/qwik-material/button/SYNC.md — Task 16.)
```

Iterative loop:
1. Run `pnpm -C src/qwik-material build`.
2. Read the first Sass error at the top of the output.
3. Either add the missing symbol to an existing stub OR create a new stub file.
4. Repeat until the build succeeds.

Cap at ~15 iterations before flagging BLOCKED. Prefer permissive definitions (mixin that emits nothing, function that returns `null` or a sensible neutral value) over reproducing real Material Design DSL logic.

- [ ] **Step 4: Create `src/qwik-material/scss/button/button-prebuilt.scss`**

```scss
// Prebuilt Material Button CSS entry.
//
// Emits: structural styles from button.scss + fab.scss + icon-button.scss +
// button-high-contrast.scss + a minimal set of M3 default values for the
// `--mdc-*` and `--mat-*` custom properties the structural rules reference.
// Consumers import via `@angular-community/qwik-material/button-prebuilt.css`.
// For full custom theming, consumers should instead @use the *-theme mixins
// from `@angular-community/qwik-material/scss/button/_*-theme.scss` once the
// qwik-material/core theming DSL lands.

@use './button';
@use './fab';
@use './icon-button';
@use './button-high-contrast';

// Minimal Material Design 3 defaults so a bare consumer sees a themed button.
// Values sourced from @angular/material/button M3 tokens (M3 primary palette,
// 40px container height, 20px pill shape, elevation 1 shadow on protected).
// Every value can be overridden by the consumer at :root or on any ancestor
// of the button.
:root {
  // Common system tokens
  --mat-sys-primary: #6750a4;
  --mat-sys-on-primary: #ffffff;
  --mat-sys-surface: #fef7ff;
  --mat-sys-on-surface: rgba(0, 0, 0, 0.87);
  --mat-sys-outline: rgba(0, 0, 0, 0.12);

  // Text button (MatButton appearance="text", the default)
  --mdc-text-button-container-height: 40px;
  --mdc-text-button-container-shape: 20px;
  --mdc-text-button-label-text-color: var(--mat-sys-primary);
  --mdc-text-button-label-text-font: Roboto, "Helvetica Neue", sans-serif;
  --mdc-text-button-label-text-size: 0.875rem;
  --mdc-text-button-label-text-weight: 500;
  --mdc-text-button-label-text-tracking: 0.0892857143em;
  --mdc-text-button-disabled-label-text-color: rgba(0, 0, 0, 0.38);

  // Filled button (MatButton appearance="filled")
  --mdc-filled-button-container-color: var(--mat-sys-primary);
  --mdc-filled-button-label-text-color: var(--mat-sys-on-primary);
  --mdc-filled-button-container-height: 40px;
  --mdc-filled-button-container-shape: 20px;
  --mdc-filled-button-disabled-container-color: rgba(0, 0, 0, 0.12);
  --mdc-filled-button-disabled-label-text-color: rgba(0, 0, 0, 0.38);

  // Elevated button (MatButton appearance="elevated", MDC "protected")
  --mdc-protected-button-container-color: var(--mat-sys-surface);
  --mdc-protected-button-label-text-color: var(--mat-sys-primary);
  --mdc-protected-button-container-height: 40px;
  --mdc-protected-button-container-shape: 20px;
  --mdc-protected-button-container-elevation-shadow:
    0 3px 1px -2px rgba(0, 0, 0, 0.2),
    0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 1px 5px 0 rgba(0, 0, 0, 0.12);
  --mdc-protected-button-disabled-container-color: rgba(0, 0, 0, 0.12);
  --mdc-protected-button-disabled-label-text-color: rgba(0, 0, 0, 0.38);

  // Outlined button (MatButton appearance="outlined")
  --mdc-outlined-button-outline-color: var(--mat-sys-outline);
  --mdc-outlined-button-label-text-color: var(--mat-sys-primary);
  --mdc-outlined-button-container-height: 40px;
  --mdc-outlined-button-container-shape: 20px;
  --mdc-outlined-button-outline-width: 1px;
  --mdc-outlined-button-disabled-outline-color: rgba(0, 0, 0, 0.12);
  --mdc-outlined-button-disabled-label-text-color: rgba(0, 0, 0, 0.38);

  // Tonal button (MatButton appearance="tonal", Mat-specific)
  --mat-tonal-button-container-color: #eaddff;
  --mat-tonal-button-label-text-color: #21005d;

  // FAB (MatFabButton / MatMiniFabButton)
  --mdc-fab-container-color: var(--mat-sys-primary);
  --mdc-fab-container-shape: 16px;
  --mdc-fab-container-elevation-shadow:
    0 3px 5px -1px rgba(0, 0, 0, 0.2),
    0 6px 10px 0 rgba(0, 0, 0, 0.14),
    0 1px 18px 0 rgba(0, 0, 0, 0.12);
  --mdc-fab-icon-color: var(--mat-sys-on-primary);
  --mdc-fab-icon-size: 24px;

  // Icon button (MatIconButton)
  --mdc-icon-button-icon-color: var(--mat-sys-on-surface);
  --mdc-icon-button-icon-size: 24px;
  --mdc-icon-button-state-layer-size: 40px;

  // State layer opacities (govern the ripple-lite hover/focus/press feedback)
  --mat-mdc-button-persistent-ripple-color: currentColor;
  --mat-mdc-button-ripple-color: currentColor;
}
```

- [ ] **Step 5: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected:
- `dist/button-prebuilt.css` exists and is non-empty.
- Console shows `✓ built in …ms` with no Sass errors.

- [ ] **Step 6: Sanity-check the emitted CSS**

```bash
grep -c "mat-mdc-button\|mdc-button\|mat-mdc-fab\|mat-mdc-icon-button" src/qwik-material/dist/button-prebuilt.css
```

Expected: a number > 50 (indicates the button structural rules made it through).

Also confirm the M3 defaults landed:

```bash
grep -c "mdc-filled-button-container-color: var(--mat-sys-primary)" src/qwik-material/dist/button-prebuilt.css
```

Expected: `1`.

- [ ] **Step 7: Commit**

```bash
git add src/qwik-material/scss/
git commit -m "feat(multiple): copy Material Button SCSS + prebuilt CSS entry with M3 defaults"
```

---

## Phase 3 — Foundation types

### Task 3: `MatButtonAppearance` + `APPEARANCE_CLASSES` + `MatButtonColor`

**Reference source:** `src/material/button/button-base.ts` line 31 (MatButtonAppearance), `src/material/button/button.ts` line 16-22 (APPEARANCE_CLASSES map).

**Files:**
- Create: `src/qwik-material/button/button-appearance.ts`
- Create: `src/qwik-material/button/button-appearance.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MatButtonAppearance` type, `MatButtonColor` type, `APPEARANCE_CLASSES: Record<MatButtonAppearance, readonly string[]>` constant. Consumed by every MatButton component in Phase 5.

- [ ] **Step 1: Write `button-appearance.ts`**

```ts
/**
 * Possible appearances for a `<MatButton>`.
 * See https://m3.material.io/components/buttons/overview.
 */
export type MatButtonAppearance = 'text' | 'filled' | 'elevated' | 'outlined' | 'tonal';

/**
 * Legacy M2 palette. Deprecated in M3 but still honoured by upstream
 * @angular/material for backwards-compatible themes. Applying `color` adds
 * a `mat-<color>` class that consumers can hook M2 palette theming into.
 */
export type MatButtonColor = 'primary' | 'accent' | 'warn';

/**
 * Classes that need to be set for each appearance of MatButton.
 * Mirrors src/material/button/button.ts line 16-22 with the Map converted to
 * a plain-object Record so lookup is a plain property access (no Map runtime
 * import in the consumer's bundle) and serialization is trivial.
 */
export const APPEARANCE_CLASSES: Record<MatButtonAppearance, readonly string[]> = {
  text: ['mat-mdc-button'],
  filled: ['mdc-button--unelevated', 'mat-mdc-unelevated-button'],
  elevated: ['mdc-button--raised', 'mat-mdc-raised-button'],
  outlined: ['mdc-button--outlined', 'mat-mdc-outlined-button'],
  tonal: ['mat-tonal-button'],
};
```

- [ ] **Step 2: Write `button-appearance.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import {
  APPEARANCE_CLASSES,
  type MatButtonAppearance,
  type MatButtonColor,
} from './button-appearance';

describe('button-appearance', () => {
  it('APPEARANCE_CLASSES covers every documented MatButtonAppearance', () => {
    const keys: MatButtonAppearance[] = ['text', 'filled', 'elevated', 'outlined', 'tonal'];
    for (const k of keys) {
      expect(APPEARANCE_CLASSES[k]).toBeDefined();
      expect(APPEARANCE_CLASSES[k].length).toBeGreaterThan(0);
    }
  });

  it('text appearance emits mat-mdc-button', () => {
    expect(APPEARANCE_CLASSES.text).toEqual(['mat-mdc-button']);
  });

  it('filled appearance emits mdc-button--unelevated + mat-mdc-unelevated-button', () => {
    expect(APPEARANCE_CLASSES.filled).toEqual([
      'mdc-button--unelevated',
      'mat-mdc-unelevated-button',
    ]);
  });

  it('elevated appearance emits mdc-button--raised + mat-mdc-raised-button', () => {
    expect(APPEARANCE_CLASSES.elevated).toEqual(['mdc-button--raised', 'mat-mdc-raised-button']);
  });

  it('outlined appearance emits mdc-button--outlined + mat-mdc-outlined-button', () => {
    expect(APPEARANCE_CLASSES.outlined).toEqual([
      'mdc-button--outlined',
      'mat-mdc-outlined-button',
    ]);
  });

  it('tonal appearance emits mat-tonal-button (Mat-specific, no MDC counterpart)', () => {
    expect(APPEARANCE_CLASSES.tonal).toEqual(['mat-tonal-button']);
  });

  it('MatButtonColor accepts the three documented palette values', () => {
    const colors: MatButtonColor[] = ['primary', 'accent', 'warn'];
    expect(colors).toHaveLength(3);
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm -C src/qwik-material test button/button-appearance
```

Expected: 7/7 passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/button/button-appearance.ts src/qwik-material/button/button-appearance.spec.ts
git commit -m "feat(multiple): add MatButtonAppearance + APPEARANCE_CLASSES + MatButtonColor"
```

---

### Task 4: `MatButtonConfig` + `MAT_BUTTON_CONFIG` context token

**Reference source:** `src/material/button/button-base.ts` line 33-46 (MatButtonConfig interface + MAT_BUTTON_CONFIG injection token).

**Files:**
- Create: `src/qwik-material/button/button-config.ts`
- Create: `src/qwik-material/button/button-config.spec.ts`

**Interfaces:**
- Consumes: `MatButtonAppearance` / `MatButtonColor` from Task 3.
- Produces: `MatButtonConfig` interface, `MAT_BUTTON_CONFIG: ContextId<MatButtonConfig>` token. Consumed by Phase 5 button components (via `useContext(MAT_BUTTON_CONFIG, DEFAULTS)`) and by Task 10's QwikMaterialProvider extension (via `useContextProvider`).

- [ ] **Step 1: Write `button-config.ts`**

```ts
import {createContextId} from '@builder.io/qwik';
import type {MatButtonAppearance, MatButtonColor} from './button-appearance';

/**
 * Object that can be used to configure default options for every MatButton
 * variant (standard, icon, FAB, mini-FAB) rendered inside a
 * <QwikMaterialProvider matButtonConfig={…}> subtree.
 *
 * See design spec §2.1 and §2.3 for full field semantics.
 */
export interface MatButtonConfig {
  /**
   * Applied to buttons that don't set an explicit `color` prop.
   * Deprecated in M3 but honoured for backwards-compatibility.
   */
  color?: MatButtonColor | null;

  /**
   * Applied when a MatButton doesn't set an explicit `disabledInteractive`
   * prop. When true, disabled buttons keep focus + click events reachable
   * (useful for tooltip wrapping).
   */
  disabledInteractive?: boolean;

  /**
   * Default appearance for `<MatButton>` when neither the `appearance` prop
   * nor a caller-provided `appearance` is set. Not applied to `<MatIconButton>`,
   * `<MatFabButton>`, or `<MatMiniFabButton>` (those have only one appearance
   * each).
   */
  defaultAppearance?: MatButtonAppearance;
}

/**
 * Context token that installs default MatButton options in a subtree.
 * Provided by `<QwikMaterialProvider matButtonConfig={…}>`. Consumed by
 * every MatButton variant via `useContext(MAT_BUTTON_CONFIG, DEFAULTS)`.
 */
export const MAT_BUTTON_CONFIG = createContextId<MatButtonConfig>(
  'qwik-material/button-config',
);
```

- [ ] **Step 2: Write `button-config.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';

describe('MatButtonConfig', () => {
  it('accepts an empty config', () => {
    const c: MatButtonConfig = {};
    expect(c).toBeDefined();
  });

  it('accepts every documented field', () => {
    const c: MatButtonConfig = {
      color: 'primary',
      disabledInteractive: true,
      defaultAppearance: 'filled',
    };
    expect(c.color).toBe('primary');
    expect(c.disabledInteractive).toBe(true);
    expect(c.defaultAppearance).toBe('filled');
  });

  it('accepts null for color to explicitly opt-out of a palette', () => {
    const c: MatButtonConfig = {color: null};
    expect(c.color).toBeNull();
  });

  it('MAT_BUTTON_CONFIG carries the expected context id', () => {
    expect(MAT_BUTTON_CONFIG.id).toBe('qwik-material/button-config');
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm -C src/qwik-material test button/button-config
```

Expected: 4/4 passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/button/button-config.ts src/qwik-material/button/button-config.spec.ts
git commit -m "feat(multiple): add MatButtonConfig interface + MAT_BUTTON_CONFIG token"
```

---

## Phase 4 — Internal helper components

### Task 5: `<PersistentRipple>` + `<FocusIndicator>` + `<TouchTarget>`

**Reference source:** `src/material/button/button.html` line 1-4 (persistent ripple), line 22 (focus indicator), line 24 (touch target); `src/material/button/icon-button.html`.

**Files:**
- Create: `src/qwik-material/button/internal/persistent-ripple.tsx`
- Create: `src/qwik-material/button/internal/focus-indicator.tsx`
- Create: `src/qwik-material/button/internal/touch-target.tsx`
- Create: `src/qwik-material/button/internal/internal.spec.tsx`
- Create: `src/qwik-material/button/dialog-container.html.removed.md`
  (See "Breadcrumb" note below.)

**Interfaces:**
- Consumes: nothing.
- Produces: three stateless `component$` exports used by all four button variants in Phase 5.

**Breadcrumb note:** upstream's `button.html` and `icon-button.html` become inline JSX in the Phase 5 tasks. Per the file-naming rule, drop a `button.html.removed.md` breadcrumb in Task 6's file list, not here. This task creates only the three internal helpers + their combined spec.

- [ ] **Step 1: Write `internal/persistent-ripple.tsx`**

```tsx
import {component$} from '@builder.io/qwik';

/**
 * The persistent ripple `<span>` that upstream MDC uses as the target for
 * its state-layer overlay (hover / focus-visible / active pseudo-elements).
 * Position is controlled entirely by CSS from button.scss / fab.scss.
 *
 * `isFab` toggles between `mdc-button__ripple` (standard button + icon-button)
 * and `mdc-fab__ripple` (FAB variants), matching upstream button.html line 2-4.
 */
export interface PersistentRippleProps {
  isFab: boolean;
}

export const PersistentRipple = component$<PersistentRippleProps>(({isFab}) => (
  <span
    class={[
      'mat-mdc-button-persistent-ripple',
      isFab ? 'mdc-fab__ripple' : 'mdc-button__ripple',
    ]}
  />
));
```

- [ ] **Step 2: Write `internal/focus-indicator.tsx`**

```tsx
import {component$} from '@builder.io/qwik';

/**
 * The `<span class="mat-focus-indicator">` element that MDC positions via
 * `::before` for high-contrast mode indication. Upstream button.html line 22.
 * Stateless — CSS drives every visible state.
 */
export const FocusIndicator = component$(() => <span class="mat-focus-indicator" />);
```

- [ ] **Step 3: Write `internal/touch-target.tsx`**

```tsx
import {component$} from '@builder.io/qwik';

/**
 * The `<span class="mat-mdc-button-touch-target">` element that MDC uses to
 * enlarge the hit area of icon buttons to the minimum 48x48 recommended by
 * Material accessibility guidelines. Upstream button.html line 24.
 * Stateless — CSS drives sizing.
 */
export const TouchTarget = component$(() => <span class="mat-mdc-button-touch-target" />);
```

- [ ] **Step 4: Write the combined spec `internal/internal.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {createDOM} from '@builder.io/qwik/testing';
import {PersistentRipple} from './persistent-ripple';
import {FocusIndicator} from './focus-indicator';
import {TouchTarget} from './touch-target';

describe('button internal helpers', () => {
  it('PersistentRipple renders with mdc-button__ripple when isFab=false', async () => {
    const {render, screen} = await createDOM();
    await render(<PersistentRipple isFab={false} />);
    const span = screen.querySelector('.mat-mdc-button-persistent-ripple') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.classList.contains('mdc-button__ripple')).toBe(true);
    expect(span.classList.contains('mdc-fab__ripple')).toBe(false);
  });

  it('PersistentRipple renders with mdc-fab__ripple when isFab=true', async () => {
    const {render, screen} = await createDOM();
    await render(<PersistentRipple isFab={true} />);
    const span = screen.querySelector('.mat-mdc-button-persistent-ripple') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.classList.contains('mdc-fab__ripple')).toBe(true);
    expect(span.classList.contains('mdc-button__ripple')).toBe(false);
  });

  it('FocusIndicator renders exactly one <span class="mat-focus-indicator">', async () => {
    const {render, screen} = await createDOM();
    await render(<FocusIndicator />);
    const spans = screen.querySelectorAll('span.mat-focus-indicator');
    expect(spans.length).toBe(1);
  });

  it('TouchTarget renders exactly one <span class="mat-mdc-button-touch-target">', async () => {
    const {render, screen} = await createDOM();
    await render(<TouchTarget />);
    const spans = screen.querySelectorAll('span.mat-mdc-button-touch-target');
    expect(spans.length).toBe(1);
  });
});
```

If `createDOM` renders trigger the same Qwik-optimizer hang seen in the Dialog port's `.tsx` specs (verified at Dialog Task 8-14 across multiple `.spec.tsx` files), replace with a module-import assertion spec instead:

```tsx
import {describe, it, expect} from 'vitest';
import {PersistentRipple} from './persistent-ripple';
import {FocusIndicator} from './focus-indicator';
import {TouchTarget} from './touch-target';

describe('button internal helpers (module-import smoke)', () => {
  it('PersistentRipple, FocusIndicator, TouchTarget are all defined', () => {
    expect(PersistentRipple).toBeDefined();
    expect(FocusIndicator).toBeDefined();
    expect(TouchTarget).toBeDefined();
  });
});
```

Try the createDOM variant first. If vitest hangs > 10s on the file, kill it and use the smoke variant. Note the choice in the commit message.

- [ ] **Step 5: Run the tests**

```bash
pnpm -C src/qwik-material test button/internal
```

Expected: 4/4 passing (createDOM variant) OR 1/1 passing (smoke fallback).

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/button/internal/
git commit -m "feat(multiple): add PersistentRipple + FocusIndicator + TouchTarget helpers"
```

---

## Phase 5 — Button components

### Task 6: `<MatButton>` component

**Reference source:** `src/material/button/button.ts` (MatButton class), `src/material/button/button-base.ts` (MatButtonBase directive), `src/material/button/button.html` (template).

**Files:**
- Create: `src/qwik-material/button/mat-button.tsx`
- Create: `src/qwik-material/button/mat-button.spec.tsx`
- Create: `src/qwik-material/button/button.html.removed.md`

**Interfaces:**
- Consumes: `MatButtonAppearance` + `APPEARANCE_CLASSES` from Task 3; `MAT_BUTTON_CONFIG` from Task 4; `PersistentRipple`, `FocusIndicator`, `TouchTarget` from Task 5.
- Produces: `MatButton: Component<MatButtonProps>`, `MatButtonProps` interface. Consumed by public-api.ts (Task 11), scenario tests (Task 12), dev-app routes (Tasks 13-14), Playwright specs (Task 15).

- [ ] **Step 1: Write `button.html.removed.md`**

```markdown
# button.html — removed

Upstream `src/material/button/button.html` is inlined into `mat-button.tsx`
as JSX per the qwik-material file-naming rule. The upstream template has
five elements:

1. `<span class="mat-mdc-button-persistent-ripple">` — rendered via `<PersistentRipple isFab={false}/>`
2. `<ng-content select=".material-icons:not([iconPositionEnd])...">` — collapsed into the default `<Slot/>` for v1 (icon-position slot deferred; see SYNC.md)
3. `<span class="mdc-button__label"><ng-content></ng-content></span>` — inlined as `<span class="mdc-button__label"><Slot/></span>`
4. `<span class="mat-focus-indicator">` — rendered via `<FocusIndicator/>`
5. `<span class="mat-mdc-button-touch-target">` — rendered via `<TouchTarget/>`

The `[progressIndicator]` slot and its container are omitted (deferred per
design spec §8 deviation #3).
```

- [ ] **Step 2: Write `mat-button.tsx`**

```tsx
import {component$, Slot, useContext, $, type QRL} from '@builder.io/qwik';
import {APPEARANCE_CLASSES, type MatButtonAppearance, type MatButtonColor} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';

export interface MatButtonProps {
  /** Appearance variant. Default 'text' (or provider's defaultAppearance). */
  appearance?: MatButtonAppearance;
  /** M2 palette class. Deprecated in M3 but honoured. Falls back to provider config. */
  color?: MatButtonColor;
  /** Disables the button. Renders `disabled` attr on <button> or blocks click on <a>. */
  disabled?: boolean;
  /** Adds .mat-mdc-button-ripple-disabled which hides the state-layer overlay. */
  disableRipple?: boolean;
  /** When true, disabled buttons keep focus + click reachable (tooltip-friendly). */
  disabledInteractive?: boolean;
  /** When set, renders <a href> instead of <button>. Click is prevented if disabled. */
  href?: string;
  /** Native <button> type. Ignored when href is set. Default 'button'. */
  type?: 'button' | 'submit' | 'reset';
  onClick$?: QRL<(e: MouseEvent) => void>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  id?: string;
  class?: string | ReadonlyArray<string>;
}

const DEFAULTS: MatButtonConfig = {
  color: null,
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatButton = component$<MatButtonProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const appearance = props.appearance ?? config.defaultAppearance ?? 'text';
  const color = props.color ?? config.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  const classes = [
    'mat-mdc-button-base',
    'mdc-button',
    ...APPEARANCE_CLASSES[appearance],
    color ? `mat-${color}` : 'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    disabledInteractive && 'mat-mdc-button-disabled-interactive',
    props.disableRipple && 'mat-mdc-button-ripple-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const preventDisabledClick$ = $((e: MouseEvent) => {
    if (props.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (props.onClick$) props.onClick$(e);
  });

  if (isAnchor) {
    return (
      <a
        href={props.href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={props.ariaDescribedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
      >
        <PersistentRipple isFab={false} />
        <span class="mdc-button__label">
          <Slot />
        </span>
        <FocusIndicator />
        <TouchTarget />
      </a>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      id={props.id}
      class={classes}
      disabled={nativelyDisabled || undefined}
      aria-disabled={disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
    >
      <PersistentRipple isFab={false} />
      <span class="mdc-button__label">
        <Slot />
      </span>
      <FocusIndicator />
      <TouchTarget />
    </button>
  );
});
```

- [ ] **Step 3: Write `mat-button.spec.tsx`**

Follow the Task 5 fallback rule: try `createDOM` first; fall back to a module-import smoke test if the file hangs vitest. Reference tests for the createDOM path:

```tsx
import {describe, it, expect} from 'vitest';
import {createDOM} from '@builder.io/qwik/testing';
import {MatButton} from './mat-button';

describe('MatButton', () => {
  it('default renders a <button> with .mat-mdc-button (text appearance)', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton>Click me</MatButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.classList.contains('mat-mdc-button-base')).toBe(true);
    expect(btn.classList.contains('mat-mdc-button')).toBe(true);
    expect(btn.classList.contains('mat-unthemed')).toBe(true);
    expect(btn.textContent).toContain('Click me');
  });

  it('appearance="filled" emits mdc-button--unelevated + mat-mdc-unelevated-button', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton appearance="filled">X</MatButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mdc-button--unelevated')).toBe(true);
    expect(btn.classList.contains('mat-mdc-unelevated-button')).toBe(true);
  });

  it('appearance="elevated" emits mdc-button--raised + mat-mdc-raised-button', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton appearance="elevated">X</MatButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mdc-button--raised')).toBe(true);
    expect(btn.classList.contains('mat-mdc-raised-button')).toBe(true);
  });

  it('appearance="outlined" emits mdc-button--outlined + mat-mdc-outlined-button', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton appearance="outlined">X</MatButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mdc-button--outlined')).toBe(true);
    expect(btn.classList.contains('mat-mdc-outlined-button')).toBe(true);
  });

  it('appearance="tonal" emits mat-tonal-button', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton appearance="tonal">X</MatButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mat-tonal-button')).toBe(true);
  });

  it('color="primary" adds mat-primary and drops mat-unthemed', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton color="primary">X</MatButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mat-primary')).toBe(true);
    expect(btn.classList.contains('mat-unthemed')).toBe(false);
  });

  it('disabled sets the native disabled attribute + .mat-mdc-button-disabled class', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton disabled>X</MatButton>);
    const btn = screen.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.classList.contains('mat-mdc-button-disabled')).toBe(true);
  });

  it('disabled + disabledInteractive keeps button un-disabled natively + sets aria-disabled', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton disabled disabledInteractive>X</MatButton>);
    const btn = screen.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.classList.contains('mat-mdc-button-disabled')).toBe(true);
    expect(btn.classList.contains('mat-mdc-button-disabled-interactive')).toBe(true);
  });

  it('disableRipple adds .mat-mdc-button-ripple-disabled', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton disableRipple>X</MatButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mat-mdc-button-ripple-disabled')).toBe(true);
  });

  it('href switches the rendered tag to <a>', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton href="/x">Go</MatButton>);
    expect(screen.querySelector('button')).toBeNull();
    const a = screen.querySelector('a') as HTMLAnchorElement;
    expect(a).toBeTruthy();
    expect(a.getAttribute('href')).toBe('/x');
  });

  it('disabled anchor sets tabindex=-1 + aria-disabled=true', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton href="/x" disabled>Go</MatButton>);
    const a = screen.querySelector('a') as HTMLAnchorElement;
    expect(a.getAttribute('tabindex')).toBe('-1');
    expect(a.getAttribute('aria-disabled')).toBe('true');
  });

  it('type prop defaults to "button" and can be overridden', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton type="submit">X</MatButton>);
    const btn = screen.querySelector('button') as HTMLButtonElement;
    expect(btn.type).toBe('submit');
  });

  it('id + aria-* props pass through', async () => {
    const {render, screen} = await createDOM();
    await render(
      <MatButton id="my-btn" ariaLabel="Save" ariaDescribedBy="desc" ariaLabelledBy="label">
        X
      </MatButton>,
    );
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.id).toBe('my-btn');
    expect(btn.getAttribute('aria-label')).toBe('Save');
    expect(btn.getAttribute('aria-describedby')).toBe('desc');
    expect(btn.getAttribute('aria-labelledby')).toBe('label');
  });

  it('renders the three internal helpers as children', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton>X</MatButton>);
    expect(screen.querySelector('.mat-mdc-button-persistent-ripple')).toBeTruthy();
    expect(screen.querySelector('.mat-focus-indicator')).toBeTruthy();
    expect(screen.querySelector('.mat-mdc-button-touch-target')).toBeTruthy();
    expect(screen.querySelector('.mdc-button__label')).toBeTruthy();
  });
});
```

Fallback smoke spec (if createDOM hangs):

```tsx
import {describe, it, expect} from 'vitest';
import {MatButton} from './mat-button';

describe('MatButton (module-import smoke)', () => {
  it('MatButton is a Qwik component', () => {
    expect(MatButton).toBeDefined();
    expect(typeof MatButton).toBe('function');
  });
});
```

- [ ] **Step 4: Run the tests**

```bash
pnpm -C src/qwik-material test button/mat-button
```

Expected: 14/14 passing (createDOM) OR 1/1 passing (smoke fallback).

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/button/mat-button.tsx src/qwik-material/button/mat-button.spec.tsx src/qwik-material/button/button.html.removed.md
git commit -m "feat(multiple): add MatButton component with 5 appearances + anchor form"
```

---

### Task 7: `<MatIconButton>` component

**Reference source:** `src/material/button/icon-button.ts`, `src/material/button/icon-button.html`.

**Files:**
- Create: `src/qwik-material/button/mat-icon-button.tsx`
- Create: `src/qwik-material/button/mat-icon-button.spec.tsx`
- Create: `src/qwik-material/button/icon-button.html.removed.md`

**Interfaces:**
- Consumes: `MAT_BUTTON_CONFIG` from Task 4; `PersistentRipple`, `FocusIndicator`, `TouchTarget` from Task 5.
- Produces: `MatIconButton: Component<MatIconButtonProps>`, `MatIconButtonProps` interface. Consumed by public-api.ts (Task 11), scenario tests (Task 12), dev-app routes (Tasks 13-14), Playwright specs (Task 15).

- [ ] **Step 1: Write `icon-button.html.removed.md`**

```markdown
# icon-button.html — removed

Upstream `src/material/button/icon-button.html` is inlined into
`mat-icon-button.tsx` as JSX per the qwik-material file-naming rule.
The upstream template has three elements:

1. `<span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple">` — rendered via `<PersistentRipple isFab={false}/>` plus an extra `.mdc-icon-button__ripple` class on the same span
2. `<span class="mat-focus-indicator">` — rendered via `<FocusIndicator/>`
3. `<span class="mat-mdc-button-touch-target">` — rendered via `<TouchTarget/>`

The icon itself is projected via the default `<Slot/>` — no separate label wrapper.
```

**Note:** upstream's `icon-button.html` puts `mdc-icon-button__ripple` as an *additional* class on the persistent-ripple `<span>` (not `mdc-button__ripple`). Our `<PersistentRipple isFab={false}/>` emits `mdc-button__ripple`, so `<MatIconButton>` must add `mdc-icon-button__ripple` alongside it. Simplest way: render the span inline in `<MatIconButton>` rather than using `<PersistentRipple>`. This is documented in the spec §3.3 and is the only place where the icon-button diverges from the shared helper.

- [ ] **Step 2: Write `mat-icon-button.tsx`**

```tsx
import {component$, Slot, useContext, $, type QRL} from '@builder.io/qwik';
import type {MatButtonColor} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';

export interface MatIconButtonProps {
  color?: MatButtonColor;
  disabled?: boolean;
  disableRipple?: boolean;
  disabledInteractive?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick$?: QRL<(e: MouseEvent) => void>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  id?: string;
  class?: string | ReadonlyArray<string>;
}

const DEFAULTS: MatButtonConfig = {
  color: null,
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatIconButton = component$<MatIconButtonProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const color = props.color ?? config.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  const classes = [
    'mat-mdc-button-base',
    'mdc-icon-button',
    'mat-mdc-icon-button',
    color ? `mat-${color}` : 'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    disabledInteractive && 'mat-mdc-button-disabled-interactive',
    props.disableRipple && 'mat-mdc-button-ripple-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const preventDisabledClick$ = $((e: MouseEvent) => {
    if (props.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (props.onClick$) props.onClick$(e);
  });

  const children = (
    <>
      <span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple" />
      <Slot />
      <FocusIndicator />
      <TouchTarget />
    </>
  );

  if (isAnchor) {
    return (
      <a
        href={props.href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={props.ariaDescribedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      id={props.id}
      class={classes}
      disabled={nativelyDisabled || undefined}
      aria-disabled={disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
    >
      {children}
    </button>
  );
});
```

- [ ] **Step 3: Write `mat-icon-button.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {createDOM} from '@builder.io/qwik/testing';
import {MatIconButton} from './mat-icon-button';

describe('MatIconButton', () => {
  it('renders a <button> with mdc-icon-button + mat-mdc-icon-button + mat-mdc-button-base', async () => {
    const {render, screen} = await createDOM();
    await render(<MatIconButton ariaLabel="Menu">M</MatIconButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.classList.contains('mat-mdc-button-base')).toBe(true);
    expect(btn.classList.contains('mdc-icon-button')).toBe(true);
    expect(btn.classList.contains('mat-mdc-icon-button')).toBe(true);
  });

  it('emits the centered-ripple span with both classes', async () => {
    const {render, screen} = await createDOM();
    await render(<MatIconButton>M</MatIconButton>);
    const span = screen.querySelector('.mat-mdc-button-persistent-ripple') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.classList.contains('mdc-icon-button__ripple')).toBe(true);
    // MatIconButton does NOT emit mdc-button__ripple (icon uses its own ripple class)
    expect(span.classList.contains('mdc-button__ripple')).toBe(false);
  });

  it('does NOT wrap children in .mdc-button__label', async () => {
    const {render, screen} = await createDOM();
    await render(<MatIconButton>icon</MatIconButton>);
    expect(screen.querySelector('.mdc-button__label')).toBeNull();
  });

  it('color="primary" adds mat-primary', async () => {
    const {render, screen} = await createDOM();
    await render(<MatIconButton color="primary">M</MatIconButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mat-primary')).toBe(true);
  });

  it('disabled + disabledInteractive keeps native enabled + sets aria-disabled', async () => {
    const {render, screen} = await createDOM();
    await render(<MatIconButton disabled disabledInteractive>M</MatIconButton>);
    const btn = screen.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });

  it('href switches the rendered tag to <a>', async () => {
    const {render, screen} = await createDOM();
    await render(<MatIconButton href="/x">M</MatIconButton>);
    expect(screen.querySelector('button')).toBeNull();
    expect(screen.querySelector('a')).toBeTruthy();
  });
});
```

Fallback smoke spec if createDOM hangs — same shape as Task 6's fallback with `MatIconButton` substituted.

- [ ] **Step 4: Run the tests**

```bash
pnpm -C src/qwik-material test button/mat-icon-button
```

Expected: 6/6 passing (createDOM) OR 1/1 passing (smoke fallback).

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/button/mat-icon-button.tsx src/qwik-material/button/mat-icon-button.spec.tsx src/qwik-material/button/icon-button.html.removed.md
git commit -m "feat(multiple): add MatIconButton component"
```

---

### Task 8: `<MatFabButton>` component (with `extended` prop)

**Reference source:** `src/material/button/fab.ts` (MatFabButton class only — MatMiniFabButton is Task 9), `src/material/button/button.html` (shared template).

**Files:**
- Create: `src/qwik-material/button/mat-fab-button.tsx`
- Create: `src/qwik-material/button/mat-fab-button.spec.tsx`

**Interfaces:**
- Consumes: `MAT_BUTTON_CONFIG` from Task 4; `PersistentRipple`, `FocusIndicator`, `TouchTarget` from Task 5.
- Produces: `MatFabButton: Component<MatFabProps>`, `MatFabProps` interface. `MatMiniFabProps` (Task 9) re-uses this props shape minus `extended` — Task 9's interface `extends Omit<MatFabProps, 'extended'>`. So Task 9 imports `MatFabProps` from this file.

- [ ] **Step 1: Write `mat-fab-button.tsx`**

```tsx
import {component$, Slot, useContext, $, type QRL} from '@builder.io/qwik';
import type {MatButtonColor} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';

export interface MatFabProps {
  /** When true, renders the extended FAB variant (wider, label visible). */
  extended?: boolean;
  color?: MatButtonColor;
  disabled?: boolean;
  disableRipple?: boolean;
  disabledInteractive?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick$?: QRL<(e: MouseEvent) => void>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  id?: string;
  class?: string | ReadonlyArray<string>;
}

// FAB defaults differ from standard button: color defaults to 'accent' per
// upstream fab.ts line 84-90 (the historical M2 default for FAB).
const DEFAULTS: MatButtonConfig = {
  color: 'accent',
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatFabButton = component$<MatFabProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const color = props.color ?? config.color ?? DEFAULTS.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  const classes = [
    'mat-mdc-button-base',
    'mdc-fab',
    'mat-mdc-fab-base',
    'mat-mdc-fab',
    props.extended && 'mdc-fab--extended',
    props.extended && 'mat-mdc-extended-fab',
    color ? `mat-${color}` : 'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    disabledInteractive && 'mat-mdc-button-disabled-interactive',
    props.disableRipple && 'mat-mdc-button-ripple-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const preventDisabledClick$ = $((e: MouseEvent) => {
    if (props.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (props.onClick$) props.onClick$(e);
  });

  const children = (
    <>
      <PersistentRipple isFab={true} />
      <span class="mdc-button__label">
        <Slot />
      </span>
      <FocusIndicator />
      <TouchTarget />
    </>
  );

  if (isAnchor) {
    return (
      <a
        href={props.href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={props.ariaDescribedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      id={props.id}
      class={classes}
      disabled={nativelyDisabled || undefined}
      aria-disabled={disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
    >
      {children}
    </button>
  );
});
```

- [ ] **Step 2: Write `mat-fab-button.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {createDOM} from '@builder.io/qwik/testing';
import {MatFabButton} from './mat-fab-button';

describe('MatFabButton', () => {
  it('renders a <button> with mdc-fab + mat-mdc-fab-base + mat-mdc-fab', async () => {
    const {render, screen} = await createDOM();
    await render(<MatFabButton ariaLabel="Add">+</MatFabButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.classList.contains('mdc-fab')).toBe(true);
    expect(btn.classList.contains('mat-mdc-fab-base')).toBe(true);
    expect(btn.classList.contains('mat-mdc-fab')).toBe(true);
  });

  it('default color is accent (mat-accent class)', async () => {
    const {render, screen} = await createDOM();
    await render(<MatFabButton>+</MatFabButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mat-accent')).toBe(true);
    expect(btn.classList.contains('mat-unthemed')).toBe(false);
  });

  it('extended=true adds mdc-fab--extended + mat-mdc-extended-fab', async () => {
    const {render, screen} = await createDOM();
    await render(<MatFabButton extended>+ New</MatFabButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mdc-fab--extended')).toBe(true);
    expect(btn.classList.contains('mat-mdc-extended-fab')).toBe(true);
  });

  it('extended=false (default) does NOT add extended classes', async () => {
    const {render, screen} = await createDOM();
    await render(<MatFabButton>+</MatFabButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mdc-fab--extended')).toBe(false);
    expect(btn.classList.contains('mat-mdc-extended-fab')).toBe(false);
  });

  it('emits <PersistentRipple isFab={true}> — spans mdc-fab__ripple', async () => {
    const {render, screen} = await createDOM();
    await render(<MatFabButton>+</MatFabButton>);
    const span = screen.querySelector('.mat-mdc-button-persistent-ripple') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.classList.contains('mdc-fab__ripple')).toBe(true);
    expect(span.classList.contains('mdc-button__ripple')).toBe(false);
  });

  it('explicit color prop overrides the accent default', async () => {
    const {render, screen} = await createDOM();
    await render(<MatFabButton color="primary">+</MatFabButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mat-primary')).toBe(true);
    expect(btn.classList.contains('mat-accent')).toBe(false);
  });

  it('href switches the rendered tag to <a>', async () => {
    const {render, screen} = await createDOM();
    await render(<MatFabButton href="/x">+</MatFabButton>);
    expect(screen.querySelector('button')).toBeNull();
    expect(screen.querySelector('a')).toBeTruthy();
  });
});
```

Fallback smoke spec — same shape as Task 6's fallback with `MatFabButton` substituted.

- [ ] **Step 3: Run the tests**

```bash
pnpm -C src/qwik-material test button/mat-fab-button
```

Expected: 7/7 passing (createDOM) OR 1/1 passing (smoke fallback).

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/button/mat-fab-button.tsx src/qwik-material/button/mat-fab-button.spec.tsx
git commit -m "feat(multiple): add MatFabButton component with extended variant"
```

---

### Task 9: `<MatMiniFabButton>` component

**Reference source:** `src/material/button/fab.ts` line 129-142 (MatMiniFabButton class).

**Files:**
- Create: `src/qwik-material/button/mat-mini-fab-button.tsx`
- Create: `src/qwik-material/button/mat-mini-fab-button.spec.tsx`

**Interfaces:**
- Consumes: `MatFabProps` from Task 8; `MAT_BUTTON_CONFIG` from Task 4; `PersistentRipple`, `FocusIndicator`, `TouchTarget` from Task 5.
- Produces: `MatMiniFabButton: Component<MatMiniFabProps>`, `MatMiniFabProps` interface (extends `Omit<MatFabProps, 'extended'>`). Consumed by public-api.ts (Task 11), scenario tests (Task 12), dev-app routes (Tasks 13-14), Playwright specs (Task 15).

- [ ] **Step 1: Write `mat-mini-fab-button.tsx`**

```tsx
import {component$, Slot, useContext, $} from '@builder.io/qwik';
import type {MatFabProps} from './mat-fab-button';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';

// Mini-FAB has no 'extended' prop; everything else matches MatFabProps.
export interface MatMiniFabProps extends Omit<MatFabProps, 'extended'> {}

// Same accent default as MatFabButton (see fab.ts line 130-143).
const DEFAULTS: MatButtonConfig = {
  color: 'accent',
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatMiniFabButton = component$<MatMiniFabProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const color = props.color ?? config.color ?? DEFAULTS.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  const classes = [
    'mat-mdc-button-base',
    'mdc-fab',
    'mat-mdc-fab-base',
    'mdc-fab--mini',
    'mat-mdc-mini-fab',
    color ? `mat-${color}` : 'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    disabledInteractive && 'mat-mdc-button-disabled-interactive',
    props.disableRipple && 'mat-mdc-button-ripple-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const preventDisabledClick$ = $((e: MouseEvent) => {
    if (props.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (props.onClick$) props.onClick$(e);
  });

  const children = (
    <>
      <PersistentRipple isFab={true} />
      <span class="mdc-button__label">
        <Slot />
      </span>
      <FocusIndicator />
      <TouchTarget />
    </>
  );

  if (isAnchor) {
    return (
      <a
        href={props.href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={props.ariaDescribedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      id={props.id}
      class={classes}
      disabled={nativelyDisabled || undefined}
      aria-disabled={disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
    >
      {children}
    </button>
  );
});
```

- [ ] **Step 2: Write `mat-mini-fab-button.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {createDOM} from '@builder.io/qwik/testing';
import {MatMiniFabButton} from './mat-mini-fab-button';

describe('MatMiniFabButton', () => {
  it('renders a <button> with mdc-fab + mdc-fab--mini + mat-mdc-mini-fab', async () => {
    const {render, screen} = await createDOM();
    await render(<MatMiniFabButton ariaLabel="Add">+</MatMiniFabButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.classList.contains('mdc-fab')).toBe(true);
    expect(btn.classList.contains('mdc-fab--mini')).toBe(true);
    expect(btn.classList.contains('mat-mdc-mini-fab')).toBe(true);
    // Mini-FAB should NOT carry the regular FAB class
    expect(btn.classList.contains('mat-mdc-fab')).toBe(false);
  });

  it('default color is accent (mat-accent class)', async () => {
    const {render, screen} = await createDOM();
    await render(<MatMiniFabButton>+</MatMiniFabButton>);
    const btn = screen.querySelector('button') as HTMLElement;
    expect(btn.classList.contains('mat-accent')).toBe(true);
  });

  it('emits <PersistentRipple isFab={true}>', async () => {
    const {render, screen} = await createDOM();
    await render(<MatMiniFabButton>+</MatMiniFabButton>);
    const span = screen.querySelector('.mat-mdc-button-persistent-ripple') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.classList.contains('mdc-fab__ripple')).toBe(true);
  });

  it('href switches the rendered tag to <a>', async () => {
    const {render, screen} = await createDOM();
    await render(<MatMiniFabButton href="/x">+</MatMiniFabButton>);
    expect(screen.querySelector('button')).toBeNull();
    expect(screen.querySelector('a')).toBeTruthy();
  });
});
```

Fallback smoke spec — same shape as Task 6's fallback with `MatMiniFabButton` substituted.

- [ ] **Step 3: Run the tests**

```bash
pnpm -C src/qwik-material test button/mat-mini-fab-button
```

Expected: 4/4 passing (createDOM) OR 1/1 passing (smoke fallback).

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/button/mat-mini-fab-button.tsx src/qwik-material/button/mat-mini-fab-button.spec.tsx
git commit -m "feat(multiple): add MatMiniFabButton component"
```

---

## Phase 6 — Provider extension

### Task 10: Extend `<QwikMaterialProvider>` with `matButtonConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (existing provider from Dialog port).

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-button.spec.tsx` (new spec for the button-config flow — keeps dialog specs isolated)

**Interfaces:**
- Consumes: `MatButtonConfig` + `MAT_BUTTON_CONFIG` from Task 4.
- Produces: `QwikMaterialProviderProps.matButtonConfig` optional field. When set, the provider installs `MAT_BUTTON_CONFIG` in the subtree. Consumed by the four button components (Phase 5) via `useContext(MAT_BUTTON_CONFIG, DEFAULTS)`.

- [ ] **Step 1: Read the current provider file**

```bash
cat src/qwik-material/dialog/qwik-material-provider.tsx
```

Confirm the existing structure (imports, props interface, component body). The current file has three `useContextProvider` calls (defaults, scroll-strategy, animations-disabled).

- [ ] **Step 2: Add the `matButtonConfig` prop + provider call**

Update the file in-place:

```tsx
import {component$, noSerialize, Slot, useContextProvider, useSignal} from '@builder.io/qwik';
import type {ScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import {createBlockScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import {
  MAT_ANIMATIONS_DISABLED,
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_DIALOG_SCROLL_STRATEGY,
} from './mat-dialog-tokens';
import type {MatButtonConfig} from '../button/button-config';
import {MAT_BUTTON_CONFIG} from '../button/button-config';

export interface QwikMaterialProviderProps {
  /** Defaults merged into every MatDialog open() config. */
  matDialogDefaults?: Partial<MatDialogConfig>;
  /** Factory returning the default ScrollStrategy for MatDialog. Defaults to createBlockScrollStrategy(). */
  matDialogScrollStrategyFactory?: () => ScrollStrategy;
  /** Disables all Material animations globally when true. */
  animationsDisabled?: boolean;
  /** Defaults applied to every MatButton / MatIconButton / MatFabButton / MatMiniFabButton in this subtree. */
  matButtonConfig?: MatButtonConfig;
}

export const QwikMaterialProvider = component$<QwikMaterialProviderProps>(props => {
  const animationsDisabled = useSignal(props.animationsDisabled ?? false);

  useContextProvider(MAT_DIALOG_DEFAULT_OPTIONS, props.matDialogDefaults ?? {});
  useContextProvider(
    MAT_DIALOG_SCROLL_STRATEGY,
    noSerialize(props.matDialogScrollStrategyFactory ?? (() => createBlockScrollStrategy())),
  );
  useContextProvider(MAT_ANIMATIONS_DISABLED, animationsDisabled);
  // MatButtonConfig is a plain object with primitive fields — no noSerialize needed.
  // Buttons outside a provider get the DEFAULTS declared in each Mat*Button
  // component; providing an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_BUTTON_CONFIG, props.matButtonConfig ?? {});

  return <Slot />;
});
```

- [ ] **Step 3: Write `qwik-material-provider-button.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {createDOM} from '@builder.io/qwik/testing';
import {component$, useContext} from '@builder.io/qwik';
import {QwikMaterialProvider} from './qwik-material-provider';
import {MAT_BUTTON_CONFIG} from '../button/button-config';

const ConfigProbe = component$(() => {
  const cfg = useContext(MAT_BUTTON_CONFIG);
  return (
    <div data-testid="probe" data-color={cfg.color ?? 'null'} data-appearance={cfg.defaultAppearance ?? 'text'} />
  );
});

describe('QwikMaterialProvider (button config)', () => {
  it('installs an empty MAT_BUTTON_CONFIG when no matButtonConfig prop is provided', async () => {
    const {render, screen} = await createDOM();
    await render(
      <QwikMaterialProvider>
        <ConfigProbe />
      </QwikMaterialProvider>,
    );
    const probe = screen.querySelector('[data-testid="probe"]') as HTMLElement;
    expect(probe.getAttribute('data-color')).toBe('null');
    expect(probe.getAttribute('data-appearance')).toBe('text');
  });

  it('propagates matButtonConfig fields to descendants', async () => {
    const {render, screen} = await createDOM();
    await render(
      <QwikMaterialProvider matButtonConfig={{color: 'primary', defaultAppearance: 'filled'}}>
        <ConfigProbe />
      </QwikMaterialProvider>,
    );
    const probe = screen.querySelector('[data-testid="probe"]') as HTMLElement;
    expect(probe.getAttribute('data-color')).toBe('primary');
    expect(probe.getAttribute('data-appearance')).toBe('filled');
  });
});
```

If createDOM hangs (same infra rule as Task 5), fall back to a smoke spec confirming `MAT_BUTTON_CONFIG` import from the provider file works — but the flow-through behaviour test cannot be replicated in a smoke spec. Note the reduced coverage in the commit message and defer to Task 12 (scenario port) or Task 15 (Playwright) for the flow-through verification.

- [ ] **Step 4: Run the tests**

```bash
pnpm -C src/qwik-material test dialog/qwik-material-provider-button
```

Expected: 2/2 passing (createDOM) OR skipped-with-note (smoke fallback).

Then run the full existing dialog provider spec to confirm no regression:

```bash
pnpm -C src/qwik-material test dialog/qwik-material-provider
```

Expected: previously passing count unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/dialog/qwik-material-provider.tsx src/qwik-material/dialog/qwik-material-provider-button.spec.tsx
git commit -m "feat(multiple): extend QwikMaterialProvider with matButtonConfig field"
```

---

## Phase 7 — Public API + build validation

### Task 11: `button/public-api.ts` + `button/index.ts` + build verification

**Reference source:** `src/qwik-material/dialog/public-api.ts` + `src/qwik-material/dialog/index.ts` (existing patterns from the Dialog port).

**Files:**
- Create: `src/qwik-material/button/public-api.ts`
- Modify: `src/qwik-material/button/index.ts` (replaces the empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Phase 3-5.
- Produces: the consumer-facing surface `@angular-community/qwik-material/button`. Consumed by dev-app routes (Tasks 13-14), Playwright specs (Task 15), and any external consumer.

- [ ] **Step 1: Write `button/public-api.ts`**

```ts
// Public API for @angular-community/qwik-material/button.
// See docs/superpowers/specs/2026-07-15-qwik-material-button-port-design.md §2.

export type {MatButtonAppearance, MatButtonColor} from './button-appearance';
export type {MatButtonConfig} from './button-config';
export {MAT_BUTTON_CONFIG} from './button-config';

export {MatButton, type MatButtonProps} from './mat-button';
export {MatIconButton, type MatIconButtonProps} from './mat-icon-button';
export {MatFabButton, type MatFabProps} from './mat-fab-button';
export {MatMiniFabButton, type MatMiniFabProps} from './mat-mini-fab-button';
```

- [ ] **Step 2: Replace `button/index.ts` stub with the real re-export**

```ts
export * from './public-api';
```

- [ ] **Step 3: Verify build + typecheck are clean**

```bash
pnpm -C src/qwik-material build && pnpm -C src/qwik-material typecheck
```

Expected:
- Build emits `dist/button/index.js` (~1-2 KB) + `dist/button/index.d.ts` (~1-3 KB) containing the four component + one config token surface.
- Both commands exit 0.

- [ ] **Step 4: Sanity-check the exported surface**

```bash
grep -nE "^export " src/qwik-material/dist/button/index.d.ts | head -20
```

Expected output includes:
- `export declare const MAT_BUTTON_CONFIG: ...`
- `export declare const MatButton: ...`
- `export declare const MatIconButton: ...`
- `export declare const MatFabButton: ...`
- `export declare const MatMiniFabButton: ...`
- Type re-exports (`MatButtonAppearance`, `MatButtonColor`, `MatButtonConfig`, `MatButtonProps`, `MatIconButtonProps`, `MatFabProps`, `MatMiniFabProps`)

Also confirm zero exported classes on the consumer surface:

```bash
grep -nE "^export declare class" src/qwik-material/dist/button/index.d.ts
```

Expected: no output (empty).

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/button/public-api.ts src/qwik-material/button/index.ts
git commit -m "feat(multiple): finalize qwik-material/button public API"
```

---

## Phase 8 — Scenario tests

### Task 12: Vitest scenario port from `src/material/button/button.spec.ts`

**Reference source:** `src/material/button/button.spec.ts` (561 lines, ~60 upstream `it` blocks).

**Files:**
- Create: `src/qwik-material/button/mat-button-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 11.
- Produces: coverage table under §7.1 of the design spec (~55 passing, ~17 skipped). Consumed by the final review to confirm parity intent.

- [ ] **Step 1: Read the upstream spec fully**

```bash
cat src/material/button/button.spec.ts
```

Categorise each `it` block into one of:
- **portable** (~40): appearance classes, color classes, disabled state, disableRipple class toggle, disabledInteractive attrs, href-switches-tag, anchor click-preventer, icon/fab/mini-fab structural
- **skipped-angular-only** (~10): Renderer2 / NgZone / TestBed injection
- **skipped-ripple-js** (~8): JS ripple animation
- **skipped-focus-monitor** (~2): mouse-vs-keyboard focus discrimination

- [ ] **Step 2: Write the scenario spec**

The file has three top-level `describe` blocks corresponding to the four components. Use createDOM per test; fall back to a smoke-only spec if the file hangs vitest.

Sketch (fill in the ~55 tests following the categorisation from Step 1):

```tsx
import {describe, it, expect} from 'vitest';
import {createDOM} from '@builder.io/qwik/testing';
import {MatButton, MatIconButton, MatFabButton, MatMiniFabButton} from './public-api';

describe('MatButton — scenarios ported from src/material/button/button.spec.ts', () => {
  // ~35 tests here covering appearance, color, disabled, disableRipple, href, etc.
  // Copy the exact assertion intent from upstream; adapt syntax (Qwik JSX + createDOM).
  // Example:
  it('applies mat-primary when color="primary"', async () => {
    const {render, screen} = await createDOM();
    await render(<MatButton color="primary">X</MatButton>);
    expect((screen.querySelector('button') as HTMLElement).classList.contains('mat-primary')).toBe(true);
  });
  // …
});

describe('MatIconButton — scenarios', () => {
  // ~6 tests: distinct host classes, centered-ripple class, no label wrapper
});

describe('MatFabButton — scenarios', () => {
  // ~8 tests: fab classes, extended toggle, default accent color
});

describe('MatMiniFabButton — scenarios', () => {
  // ~4 tests: mini-fab classes, default accent color
});

describe.skip('Ripple JS animation — deferred to future qwik-cdk MatRipple primitive', () => {
  // ~8 tests preserving upstream intent for later
});

describe.skip('FocusMonitor origin discrimination — deferred', () => {
  // ~2 tests preserving upstream intent for later
});

describe.skip('Angular-only — TestBed / Renderer2 / NgZone', () => {
  // ~10 tests preserving upstream intent as reference
});
```

If createDOM hangs, downgrade every test to a module-import assertion (each `it` becomes `expect(<component>).toBeDefined()`) and document the reduced coverage as a Task-12 concern for the reviewer. Do NOT skip the file entirely.

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test button/mat-button-scenarios
```

Expected: ~55 passing + ~20 skipped (createDOM), OR whichever count you achieved (smoke fallback).

- [ ] **Step 4: Run the full qwik-material safe-subset to confirm no regression**

```bash
pnpm -C src/qwik-material test
```

Expected: total count (dialog + button) — the pre-Task-12 total plus the ~55 button additions.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/button/mat-button-scenarios.spec.tsx
git commit -m "test(multiple): port MatButton scenarios from upstream button.spec.ts"
```

---

## Phase 9 — Dev-app scenarios

### Task 13: Dev-app scenario template + first 8 button routes + index tile

**Reference source:** `src/qwik-cdk-dev-app/src/scenarios/_template.tsx` (existing template from Dialog port), `src/qwik-cdk-dev-app/src/routes/mat-dialog/basic/index.tsx` (existing route pattern).

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add button-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Buttons" section with 16 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/text/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/filled/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/elevated/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/outlined/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/tonal/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/text-link/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/filled-link/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/disabled/index.tsx`

**Interfaces:**
- Consumes: `MatButton` from `@angular-community/qwik-material/button`.
- Produces: 8 mount-only routes at `/mat-button/*` that render a button and mark `<main data-scenario-ready>ready</main>` for Playwright.

- [ ] **Step 1: Add the button-prebuilt.css import to root.tsx**

```tsx
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
```

- [ ] **Step 2: Add a "Buttons" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Read the current index route; append a new `<section>` after the existing "Dialogs" section listing all 16 button routes as `<a>` links. Keep the existing dialog section intact.

Reference snippet (insert into the index component's JSX):

```tsx
<section>
  <h2>Buttons</h2>
  <ul>
    <li><a href="/mat-button/text/">text</a></li>
    <li><a href="/mat-button/filled/">filled</a></li>
    <li><a href="/mat-button/elevated/">elevated</a></li>
    <li><a href="/mat-button/outlined/">outlined</a></li>
    <li><a href="/mat-button/tonal/">tonal</a></li>
    <li><a href="/mat-button/text-link/">text-link</a></li>
    <li><a href="/mat-button/filled-link/">filled-link</a></li>
    <li><a href="/mat-button/disabled/">disabled</a></li>
    <li><a href="/mat-button/disabled-interactive/">disabled-interactive</a></li>
    <li><a href="/mat-button/color-primary/">color-primary</a></li>
    <li><a href="/mat-button/color-accent/">color-accent</a></li>
    <li><a href="/mat-button/color-warn/">color-warn</a></li>
    <li><a href="/mat-button/icon-button/">icon-button</a></li>
    <li><a href="/mat-button/fab/">fab</a></li>
    <li><a href="/mat-button/fab-extended/">fab-extended</a></li>
    <li><a href="/mat-button/mini-fab/">mini-fab</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create route 1 — `text/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton>Text button</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create route 2 — `filled/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton appearance="filled">Filled button</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create route 3 — `elevated/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton appearance="elevated">Elevated button</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create route 4 — `outlined/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton appearance="outlined">Outlined button</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create route 5 — `tonal/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton appearance="tonal">Tonal button</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create route 6 — `text-link/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton href="/about">Text link</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Create route 7 — `filled-link/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton appearance="filled" href="/about">Filled link</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 10: Create route 8 — `disabled/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton disabled>Disabled button</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 11: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Expected:
- Client build succeeds (~250 modules)
- SSR build succeeds
- All 8 new routes appear in `dist/q-manifest.json` (grep for `mat-button`)

- [ ] **Step 12: Commit**

```bash
git add src/qwik-cdk-dev-app/src/root.tsx src/qwik-cdk-dev-app/src/routes/index.tsx src/qwik-cdk-dev-app/src/routes/mat-button/
git commit -m "feat(multiple): add mat-button dev-app routes 1-8 + index tile"
```

---

### Task 14: Remaining 8 dev-app button routes

**Reference source:** design spec §7.2 (dev-app routes table).

**Files:**
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/disabled-interactive/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/color-primary/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/color-accent/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/color-warn/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/icon-button/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/fab/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/fab-extended/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button/mini-fab/index.tsx`

**Interfaces:**
- Consumes: `MatButton`, `MatIconButton`, `MatFabButton`, `MatMiniFabButton` from `@angular-community/qwik-material/button`.
- Produces: 8 more mount-only routes at `/mat-button/*`. Combined with Task 13 = 16 total.

- [ ] **Step 1: Create `disabled-interactive/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton disabled disabledInteractive>Disabled interactive</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 2: Create `color-primary/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton color="primary" appearance="filled">Primary</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 3: Create `color-accent/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton color="accent" appearance="filled">Accent</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `color-warn/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton color="warn" appearance="filled">Warn</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `icon-button/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatIconButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatIconButton ariaLabel="Menu">≡</MatIconButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create `fab/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatFabButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatFabButton ariaLabel="Add">+</MatFabButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `fab-extended/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatFabButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatFabButton extended>+ New</MatFabButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create `mini-fab/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatMiniFabButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatMiniFabButton ariaLabel="Add">+</MatMiniFabButton>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Expected:
- Client + SSR builds succeed.
- All 16 mat-button routes appear in `dist/q-manifest.json`:

```bash
grep -oE '"mat-button/[a-z-]+/"' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `16`.

- [ ] **Step 10: Manual verification (preview)**

```bash
pnpm -C src/qwik-cdk-dev-app preview
```

Visit each of the 16 routes in a browser. Confirm each renders a visibly-styled button (elevated shadow on `elevated`, outlined border on `outlined`, filled background on `filled`, etc.). Not scripted — this is the human smoke test.

- [ ] **Step 11: Commit**

```bash
git add src/qwik-cdk-dev-app/src/routes/mat-button/
git commit -m "feat(multiple): add mat-button dev-app routes 9-16 (color + icon + fab variants)"
```

---

## Phase 10 — Playwright parity

### Task 15: Playwright material-button parity specs (16)

**Reference source:** `src/qwik-cdk-parity-tests/specs/material-dialog/basic.spec.ts` (existing pattern from Dialog port).

**Files:**
- Create: `src/qwik-cdk-parity-tests/specs/material-button/text.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/filled.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/elevated.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/outlined.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/tonal.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/text-link.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/filled-link.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/disabled.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/disabled-interactive.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/color-primary.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/color-accent.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/color-warn.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/icon-button.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/fab.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/fab-extended.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button/mini-fab.spec.ts`

**Interfaces:**
- Consumes: Task 14's dev-app routes running at `http://localhost:4173/mat-button/*`.
- Produces: 16 Playwright specs, one per route, verifying structural DOM + class assertions.

- [ ] **Step 1: Read the existing material-dialog spec template**

```bash
cat src/qwik-cdk-parity-tests/specs/material-dialog/basic.spec.ts
```

Note the imports, `BASE_URL`, `test.beforeEach`, `page.waitForSelector('[data-scenario-ready]')`, and assertion style. Reuse this template.

- [ ] **Step 2: Write `text.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/text — renders <button> with mat-mdc-button class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/text/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mat-mdc-button(\s|$)/);
  await expect(btn).toHaveText('Text button');
});
```

- [ ] **Step 3: Write `filled.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/filled — renders with mdc-button--unelevated + mat-mdc-unelevated-button', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/filled/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-button--unelevated/);
  await expect(btn).toHaveClass(/mat-mdc-unelevated-button/);
});
```

- [ ] **Step 4: Write `elevated.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/elevated — renders with mdc-button--raised + mat-mdc-raised-button', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/elevated/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-button--raised/);
  await expect(btn).toHaveClass(/mat-mdc-raised-button/);
});
```

- [ ] **Step 5: Write `outlined.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/outlined — renders with mdc-button--outlined + mat-mdc-outlined-button', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/outlined/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-button--outlined/);
  await expect(btn).toHaveClass(/mat-mdc-outlined-button/);
});
```

- [ ] **Step 6: Write `tonal.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/tonal — renders with mat-tonal-button', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/tonal/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mat-tonal-button/);
});
```

- [ ] **Step 7: Write `text-link.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/text-link — renders <a> instead of <button>', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/text-link/`);
  await page.waitForSelector('[data-scenario-ready]');
  await expect(page.locator('button.mat-mdc-button-base')).toHaveCount(0);
  const a = page.locator('a.mat-mdc-button-base');
  await expect(a).toBeVisible();
  await expect(a).toHaveAttribute('href', '/about');
});
```

- [ ] **Step 8: Write `filled-link.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/filled-link — <a> with filled classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/filled-link/`);
  await page.waitForSelector('[data-scenario-ready]');
  const a = page.locator('a.mat-mdc-button-base');
  await expect(a).toBeVisible();
  await expect(a).toHaveClass(/mdc-button--unelevated/);
  await expect(a).toHaveAttribute('href', '/about');
});
```

- [ ] **Step 9: Write `disabled.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/disabled — <button disabled> with mat-mdc-button-disabled class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/disabled/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toBeDisabled();
  await expect(btn).toHaveClass(/mat-mdc-button-disabled/);
});
```

- [ ] **Step 10: Write `disabled-interactive.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/disabled-interactive — aria-disabled=true, native NOT disabled', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/disabled-interactive/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).not.toBeDisabled();
  await expect(btn).toHaveAttribute('aria-disabled', 'true');
  await expect(btn).toHaveClass(/mat-mdc-button-disabled-interactive/);
});
```

- [ ] **Step 11: Write `color-primary.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/color-primary — mat-primary class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/color-primary/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toHaveClass(/mat-primary/);
  await expect(btn).not.toHaveClass(/mat-unthemed/);
});
```

- [ ] **Step 12: Write `color-accent.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/color-accent — mat-accent class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/color-accent/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toHaveClass(/mat-accent/);
});
```

- [ ] **Step 13: Write `color-warn.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/color-warn — mat-warn class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/color-warn/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toHaveClass(/mat-warn/);
});
```

- [ ] **Step 14: Write `icon-button.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/icon-button — <button> with mdc-icon-button + mat-mdc-icon-button', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/icon-button/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-icon-button/);
  await expect(btn).toHaveClass(/mat-mdc-icon-button/);
  await expect(btn).toHaveAttribute('aria-label', 'Menu');
  // Icon button does NOT wrap children in .mdc-button__label
  await expect(page.locator('.mdc-button__label')).toHaveCount(0);
});
```

- [ ] **Step 15: Write `fab.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/fab — <button> with mdc-fab + mat-accent default', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/fab/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-fab/);
  await expect(btn).toHaveClass(/mat-mdc-fab/);
  await expect(btn).toHaveClass(/mat-accent/);
  await expect(btn).not.toHaveClass(/mdc-fab--extended/);
});
```

- [ ] **Step 16: Write `fab-extended.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/fab-extended — mdc-fab--extended + mat-mdc-extended-fab', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/fab-extended/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-fab--extended/);
  await expect(btn).toHaveClass(/mat-mdc-extended-fab/);
});
```

- [ ] **Step 17: Write `mini-fab.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/mini-fab — <button> with mdc-fab--mini + mat-mdc-mini-fab', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/mini-fab/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-fab/);
  await expect(btn).toHaveClass(/mdc-fab--mini/);
  await expect(btn).toHaveClass(/mat-mdc-mini-fab/);
  // Mini-FAB should NOT carry the regular FAB class
  await expect(btn).not.toHaveClass(/mat-mdc-fab(\s|$)/);
});
```

- [ ] **Step 18: Do NOT run Playwright yet**

Running the specs requires a human to run `pnpm -C src/qwik-cdk-dev-app preview` in a separate terminal AND to have installed the Chromium browser via `pnpm -C src/qwik-cdk-parity-tests exec playwright install chromium` at least once. Skip the pipeline invocation — the final task (16) documents the manual verification step.

- [ ] **Step 19: Commit**

```bash
git add src/qwik-cdk-parity-tests/specs/material-button/
git commit -m "test(multiple): Playwright material-button parity specs (16 routes)"
```

---

## Phase 11 — Finalisation

### Task 16: SYNC.md + root pnpm script + docs

**Reference source:** `src/qwik-material/dialog/SYNC.md` (existing Dialog SYNC), `package.json` at repo root (existing `test:qwik-material` script).

**Files:**
- Create: `src/qwik-material/button/SYNC.md`
- Modify: `src/qwik-material/dialog/SYNC.md` (append note about button-owned stubs, if any new ones were added in Task 2)
- Verify (no change expected): `package.json` root — `test:qwik-material` already chains build + vitest + lint + typecheck; button files are covered automatically.

**Interfaces:**
- Consumes: everything from Phases 1-10.
- Produces: `SYNC.md` documenting the button port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/button/SYNC.md`**

```markdown
# qwik-material/button sync log

Tracks the sync state between this port and `src/material/button/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`.

## Upstream sync state

| File                                          | Upstream path                                                       | Sync state | Notes                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `button/mat-button.tsx`                       | `src/material/button/button.ts` + `button.html`                     | ported     | Directive→component; APPEARANCE_CLASSES lifted to `button-appearance.ts`; anchor via href |
| `button/mat-icon-button.tsx`                  | `src/material/button/icon-button.ts` + `icon-button.html`           | ported     | Directive→component; MatIconAnchor alias dropped                                          |
| `button/mat-fab-button.tsx`                   | `src/material/button/fab.ts` (MatFabButton half)                    | ported     | Directive→component; MAT_FAB_DEFAULT_OPTIONS folded into MAT_BUTTON_CONFIG                |
| `button/mat-mini-fab-button.tsx`              | `src/material/button/fab.ts` (MatMiniFabButton half)                | ported     | Directive→component; MatMiniFabAnchor alias dropped                                       |
| `button/button-config.ts`                     | `src/material/button/button-base.ts` (config interface)             | ported     | ThemePalette narrowed to MatButtonColor                                                   |
| `button/button-appearance.ts`                 | `src/material/button/button-base.ts` (appearance type + map)        | ported     | Map converted to Record for zero-runtime lookup                                           |
| `scss/button/button.scss`                     | `src/material/button/button.scss`                                   | synced     | byte-identical copy                                                                       |
| `scss/button/fab.scss`                        | `src/material/button/fab.scss`                                      | synced     | byte-identical copy                                                                       |
| `scss/button/icon-button.scss`                | `src/material/button/icon-button.scss`                              | synced     | byte-identical copy                                                                       |
| `scss/button/button-high-contrast.scss`       | `src/material/button/button-high-contrast.scss`                     | synced     | byte-identical copy                                                                       |
| `scss/button/_button-base.scss`               | `src/material/button/_button-base.scss`                             | synced     | byte-identical copy                                                                       |
| `scss/button/_m2-button.scss` + m3 + theme    | (three underscore partials)                                         | synced     | byte-identical copies                                                                     |
| `scss/button/_m2-fab.scss` + m3 + theme       | (three underscore partials)                                         | synced     | byte-identical copies                                                                     |
| `scss/button/_m2-icon-button.scss` + m3 + theme | (three underscore partials)                                       | synced     | byte-identical copies                                                                     |
| `scss/button/button-prebuilt.scss`            | (Qwik-material-specific)                                            | new        | @use of the four structural files + M3 :root defaults                                     |

## Removed upstream files

- `button.html` → inlined into `mat-button.tsx`; breadcrumb at `button.html.removed.md`
- `icon-button.html` → inlined into `mat-icon-button.tsx`; breadcrumb at `icon-button.html.removed.md`
- `button-module.ts` → Qwik has no module concept
- `button-base.ts` → responsibilities split across `mat-button.tsx` / `mat-icon-button.tsx` / `mat-fab-button.tsx` / `mat-mini-fab-button.tsx` (each carries its own base logic inline)

## Deviations from upstream

1. **No JS ripple.** CSS-only state layer via the persistent-ripple `<span>` + existing MDC SCSS `::before` transitions. Follow-up: port `MatRipple` as a first-class qwik-cdk primitive, then wire buttons through it.
2. **No FocusMonitor integration.** `:focus-visible` covers keyboard-only state-layer visibility. Follow-up: consume `useFocusMonitor` when a use-case needs mouse / keyboard / program focus discrimination.
3. **No `showProgress` prop or `[progressIndicator]` slot.** Deferred per scope decision 2026-07-15.
4. **No icon-position slot.** No `<Slot name="icon"/>` before or `<Slot name="icon-end"/>` after the label. Consumers place icons in the default slot at v1.
5. **No `tabIndex` prop.** Qwik JSX forwards `tabIndex` as a standard HTML attribute via the JSX props of the underlying `<button>` / `<a>`.
6. **No `MatAnchor` / `MatIconAnchor` / `MatFabAnchor` / `MatMiniFabAnchor` type aliases.** Upstream declares them as `const X = Y; type X = Y;`; that pattern doesn't map to Qwik's single-render component model. Anchor form is opt-in via `href`.
7. **`_isFab` / `_isAnchor` internal fields not exposed.** Upstream keeps them protected on MatButtonBase; qwik-material's split-into-4-components architecture makes them redundant.
8. **`MAT_FAB_DEFAULT_OPTIONS` folded into `MAT_BUTTON_CONFIG`.** Upstream has a separate injection token for FAB's default color. Qwik-material collapses this into the single `MatButtonConfig.color` field.
9. **`matButtonConfig` field on `QwikMaterialProviderProps`.** Consistent with the dialog port's pattern of gathering component defaults on the single provider.
10. **No `_animationsDisabled` propagation to `.mat-animation-noopable` class.** Rely on the browser's `prefers-reduced-motion: reduce` for now. Follow-up if that's insufficient.

## Stub inventory delta

(Populated by the Task 2 SCSS-copy step. If Task 2 added any new stubs beyond
the 16 the dialog port already produced, list them here with the same
`{stub path, upstream path}` format used in `src/qwik-material/dialog/SYNC.md`.
If no new stubs were needed, write "No new stubs — button chain reused all
dialog-port stubs.")

## Class count

`grep -nE "^export class" src/qwik-material/button/**/*.ts src/qwik-material/button/**/*.tsx`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering both dialog and button.
```

- [ ] **Step 2: Update the dialog SYNC.md if button added any new stubs**

```bash
diff <(cd src/qwik-material/scss && find . -type f -name '*.scss' -not -path './dialog/*' -not -path './button/*' -not -name '_index.scss' | sort) <(git show HEAD~15:src/qwik-material/scss 2>/dev/null || echo "cannot list pre-button stubs")
```

(HEAD~15 is a rough placeholder — the actual "pre-button stubs" commit is the tip of the Dialog port, which is the branch base for this button port. Adjust the git ref if needed.)

If any stub was newly created by Task 2, append its entry to `src/qwik-material/dialog/SYNC.md` under a new `## Additions from qwik-material/button port` section — DO NOT rewrite the existing content. If no new stubs were added, this step is a no-op and can be skipped with a note in the commit body.

- [ ] **Step 3: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- Build: `dist/dialog-prebuilt.css` + `dist/button-prebuilt.css` both emit; component JS + d.ts files land under `dist/dialog/` + `dist/button/`.
- Vitest: dialog scenarios + button scenarios all pass (or fall back to smoke if createDOM hangs).
- Lint: zero SSR-leak violations.
- Typecheck: exit 0.

- [ ] **Step 4: Verify the Class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/button/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/button/SYNC.md src/qwik-material/dialog/SYNC.md
git commit -m "docs(multiple): finalize qwik-material/button SYNC.md + pipeline verification"
```

---

## Layout

```
src/qwik-material/
  button/
    button-appearance.ts             — MatButtonAppearance + APPEARANCE_CLASSES + MatButtonColor (Task 3)
    button-appearance.spec.ts        — foundation tests (Task 3)
    button-config.ts                 — MatButtonConfig + MAT_BUTTON_CONFIG (Task 4)
    button-config.spec.ts            — foundation tests (Task 4)
    internal/
      persistent-ripple.tsx          — <PersistentRipple isFab> (Task 5)
      focus-indicator.tsx            — <FocusIndicator> (Task 5)
      touch-target.tsx               — <TouchTarget> (Task 5)
      internal.spec.tsx              — combined helper spec (Task 5)
    mat-button.tsx                   — <MatButton> (Task 6)
    mat-button.spec.tsx              — component spec (Task 6)
    button.html.removed.md           — breadcrumb (Task 6)
    mat-icon-button.tsx              — <MatIconButton> (Task 7)
    mat-icon-button.spec.tsx         — component spec (Task 7)
    icon-button.html.removed.md      — breadcrumb (Task 7)
    mat-fab-button.tsx               — <MatFabButton> (Task 8)
    mat-fab-button.spec.tsx          — component spec (Task 8)
    mat-mini-fab-button.tsx          — <MatMiniFabButton> (Task 9)
    mat-mini-fab-button.spec.tsx     — component spec (Task 9)
    mat-button-scenarios.spec.tsx    — ported upstream scenarios (Task 12)
    public-api.ts                    — consumer-facing re-exports (Task 11)
    index.ts                         — `export * from './public-api'` (Task 1 stub / Task 11 real)
    SYNC.md                          — deviation + stub log (Task 16)
  dialog/
    qwik-material-provider.tsx       — MODIFIED in Task 10 (adds matButtonConfig)
    qwik-material-provider-button.spec.tsx — new spec (Task 10)
    SYNC.md                          — MODIFIED in Task 16 (stub delta note only, if any)
  scss/
    button/                           — 14 verbatim SCSS files + button-prebuilt.scss (Task 2)
    <any new stubs>                   — added iteratively by Task 2
  package.json                        — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                      — MODIFIED in Task 1 (entries array + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                          — MODIFIED in Task 13 (button-prebuilt.css import)
    routes/
      index.tsx                       — MODIFIED in Task 13 (Buttons section)
      mat-button/                     — 16 new route files (Tasks 13-14)

src/qwik-cdk-parity-tests/
  specs/material-button/              — 16 new Playwright specs (Task 15)
```

## Per-entry-point state

The `button` entry-point becomes the second entry after `dialog` in the qwik-material package. Both live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` is the one place they intersect.

## Sync recipe

To re-sync a specific file from upstream `src/material/button/`:

1. Locate the upstream file's counterpart in this SYNC log's table.
2. If "synced" state: `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "ported" state: manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change to the `mat-*.tsx` file, update the corresponding `.spec.tsx`.
4. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck)
- `pnpm -C src/qwik-material test button` reports ~75 passing + ~20 skipped tests (Tasks 3 + 4 + 5 + 6 + 7 + 8 + 9 + 12 = ~75 passing when createDOM works; drop to ~10 smoke tests if createDOM hangs across the board)
- Every button variant in the dev-app (`/mat-button/*`) renders with visible M3 styling in preview mode (elevated shadow on elevated, filled color on filled, extended pill on fab-extended, etc.)
- `pnpm -C src/qwik-material lint:no-ssr-leaks` reports zero violations
- 0 exported classes on the consumer surface (grep verified in Task 11 Step 4)
- Playwright material-button specs pass locally when run against the built dev-app preview

---

## Class count

Zero exported classes on the consumer surface. The port uses interfaces + `component$` factories + `createContextId` tokens exclusively, mirroring the qwik-material/dialog constraint.

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package. Adding button doesn't require any change to the pipeline — the scripts already glob the entire `src/qwik-material/` tree.

## Success criteria (final self-check)

- `pnpm test:qwik-material` green
- 16 dev-app routes render visibly in browser preview
- 16 Playwright specs pass
- Zero exported classes; zero SSR leaks; typecheck clean
- SYNC.md populated with all 10 deviations + any new stub delta
