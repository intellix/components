# qwik-material Progress Bar Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/progress-bar/` (256-LOC MatProgressBar component + template + 4 SCSS files + 346-LOC spec) into a `qwik-material/progress-bar` entry-point as a stateless `<MatProgressBar>` component with all 4 upstream modes, a `useVisibleTask$`-attached `onAnimationEnd$` QRL callback replacing upstream's `animationEnd` Output, and the shared `<QwikMaterialProvider>`-fed `matProgressBarConfig`.

**Architecture:** Single `component$` reads `MAT_PROGRESS_BAR_CONFIG` + `MAT_ANIMATIONS_DISABLED` from context, resolves each prop through the `prop ?? config` fallback, and renders the upstream 3-div inner template with computed `transform` / `flex-basis` styles. `useVisibleTask$` attaches a `transitionend` listener that reads live prop values via the Qwik props proxy at fire time — no render-time-derived locals in the closure.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package created by the Dialog + Button + Card + Toolbar + Badge + Icon ports.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./progress-bar`. New prebuilt CSS entry: `./progress-bar-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths in this plan are relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-07-29-qwik-material-progress-bar-port-design.md](../specs/2026-07-29-qwik-material-progress-bar-port-design.md). Read §2 (Public API), §3 (Internal architecture), §5 (CSS delivery), §6 (Deviations catalog) before starting any port task.
- **Material source reference:** `src/material/progress-bar/`. Every port task names the exact source file(s) it mirrors.
- **DOM parity — custom-element tag:** upstream renders `<mat-progress-bar>` as a real custom element (selector on line 87 of `src/material/progress-bar/progress-bar.ts`). Our port preserves the tag name via a JSX augmentation in `intrinsic-elements.d.ts`. External CMS stylesheets may target `mat-progress-bar` as an element selector.
- **DOM parity — class ladder:** upstream host bindings emit `mat-mdc-progress-bar mdc-linear-progress` (static), `mat-<color>` (via `[class]: '"mat-" + color'`), `_mat-animation-noopable` (when animations disabled), `mdc-linear-progress--animation-ready` (when NOT disabled), and `mdc-linear-progress--indeterminate` (when mode is indeterminate/query). The port's class ladder matches exactly.
- **DOM parity — host attributes:** upstream emits `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow` (present in determinate/buffer, absent in indeterminate/query), `tabindex="-1"`, and `mode` (mirrors current mode). Port emits the same shape + `aria-label`/`aria-labelledby`/`aria-describedby` passthroughs (§6 deviation #11).
- **DOM parity — inner template:** three children of the host: `.mdc-linear-progress__buffer` (with `.mdc-linear-progress__buffer-bar` + conditional `.mdc-linear-progress__buffer-dots` only when `mode === 'buffer'`), `.mdc-linear-progress__primary-bar` (with computed `transform: scaleX(...)`), and `.mdc-linear-progress__secondary-bar`. Every inner div carries `aria-hidden="true"`. The primary/secondary bars each contain a `<span class="mdc-linear-progress__bar-inner">`.
- **qwik-cdk peer:** `@angular-community/qwik-cdk` at `workspace:*` (already declared). Progress-bar does not consume qwik-cdk at runtime.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. E.g. `progress-bar.ts` → `mat-progress-bar.tsx`. Component files use `.tsx`.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/progress-bar/SYNC.md`.
- **No RxJS.**
- **No `HttpClient` / XHR access anywhere in the port.**
- **No exported classes** in the consumer surface. `progress-bar/public-api.ts` must not contain `export class`.
- **SSR safety:** every `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` call must be inside `useVisibleTask$` OR guarded by `typeof <global> !== 'undefined'`. Do NOT use `isBrowser` from `@builder.io/qwik/build`. Progress-bar's `useVisibleTask$` uses `addEventListener` which is safe under this rule (visible-tasks never run during SSR).
- **Commit message scope:** the upstream repo's commit-msg hook does not know `qwik-material`; use scope `multiple` (which is in the allowed list) for every commit in this plan.
- **Pnpm version:** the repo pins `pnpm@11.7.0`. Don't change it.
- **Node version:** pinned via `.nvmrc`. Don't change it.
- **No Bazel changes.**
- **No upstream CI integration.**
- **Class-list cast pattern (established in Dialog + Button + Card + Toolbar + Badge + Icon ports):** use `.filter(Boolean) as string[]`. The type `(string | ReadonlyArray<string>)[]` fails typecheck against Qwik's `ClassList` type.
- **Top-level helper functions (Rollup safety):** any module-level mutable state or non-trivial helpers used inside `component$` MUST be top-level functions, NOT inline expressions. Precedent: Badge Task 5's inline `_idSeq++` triggered a Rollup "Illegal reassignment of import" error the moment the module was bundled. `clamp()` in this port lives outside `component$`.
- **Spec files use smoke variant:** earlier ports confirmed `createDOM(<component$/>)` hangs the Qwik optimizer worker. Progress-bar `.spec.tsx` files use module-import assertions. Real DOM assertions live in Task 10's Playwright parity specs.
- **Handler closures MUST read live prop values via `props.X`, NOT render-time locals.** Precedent: spec §3.6's `useVisibleTask$` transitionend handler filters on `props.mode` / `props.value` / `props.onAnimationEnd$` at fire time — a consumer can swap `mode` mid-animation, and the filter must reflect the current mode. Qwik's props proxy stays valid across renders.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `progress-bar` entry-point into the existing qwik-material package

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from earlier ports).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/progress-bar/intrinsic-elements.d.ts`
- Create: `src/qwik-material/progress-bar/index.ts` (empty stub — Task 8 replaces)

**Interfaces:**
- Consumes: existing package scaffolding.
- Produces: `pnpm -C src/qwik-material build` still succeeds (existing 6 prebuilt CSS files still emit; no progress-bar CSS yet). Type resolution for `@angular-community/qwik-material/progress-bar` returns an empty module. `<mat-progress-bar>` is a legal JSX element with an accepted `mode` string attribute.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./progress-bar` after `./icon`, and `./progress-bar-prebuilt.css` after `./icon-prebuilt.css`. Final relevant block:

```json
"./icon": {
  "qwik": "./icon/index.ts",
  "types": "./dist/icon/index.d.ts",
  "import": "./dist/icon/index.js"
},
"./progress-bar": {
  "qwik": "./progress-bar/index.ts",
  "types": "./dist/progress-bar/index.d.ts",
  "import": "./dist/progress-bar/index.js"
},
"./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
"./button-prebuilt.css": "./dist/button-prebuilt.css",
"./card-prebuilt.css": "./dist/card-prebuilt.css",
"./toolbar-prebuilt.css": "./dist/toolbar-prebuilt.css",
"./badge-prebuilt.css": "./dist/badge-prebuilt.css",
"./icon-prebuilt.css": "./dist/icon-prebuilt.css",
"./progress-bar-prebuilt.css": "./dist/progress-bar-prebuilt.css",
"./scss/*": "./scss/*"
```

- [ ] **Step 2: Extend `src/qwik-material/vite.config.ts` `entries` array + `sassEntries` list**

Read the file. `entries` currently reads `['dialog', 'button', 'card', 'toolbar', 'badge', 'icon']`. Append `'progress-bar'`:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar'];
```

`sassEntries` currently ends with `['scss/icon/icon-prebuilt.scss', 'dist/icon-prebuilt.css']`. Append the progress-bar pair:

```ts
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
  ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
  ['scss/toolbar/toolbar-prebuilt.scss', 'dist/toolbar-prebuilt.css'],
  ['scss/badge/badge-prebuilt.scss', 'dist/badge-prebuilt.css'],
  ['scss/icon/icon-prebuilt.scss', 'dist/icon-prebuilt.css'],
  ['scss/progress-bar/progress-bar-prebuilt.scss', 'dist/progress-bar-prebuilt.css'],
];
```

- [ ] **Step 3: Create `src/qwik-material/progress-bar/intrinsic-elements.d.ts`**

The `<mat-progress-bar>` custom element is used inline as a block-level bar (like a `<div>`). Type as `QwikIntrinsicElements['div']` and widen with a `mode` custom attribute (mirrors upstream's `[attr.mode]` host binding; without this Qwik typed JSX would reject the attribute on the port's own component — same pattern as Icon Task 5's `fontIcon` widening). Contents:

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material ProgressBar's custom-element tag
 * name. Upstream renders <mat-progress-bar> as an actual custom element with a
 * reflected `mode` attribute; external CMS styles may target the tag directly
 * (not just the .mat-mdc-progress-bar class). See design spec
 * docs/superpowers/specs/2026-07-29-qwik-material-progress-bar-port-design.md
 * §3.1 + §6 deviation #12.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-progress-bar': QwikIntrinsicElements['div'] & {mode?: string};
    }
  }
}
```

- [ ] **Step 4: Create `src/qwik-material/progress-bar/index.ts`** (empty stub)

Contents:

```ts
export {};
```

Task 8 replaces this with `export * from './public-api';`.

- [ ] **Step 5: Run the build to confirm the stub compiles**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. The dts plugin generates `dist/progress-bar/index.d.ts` with `export {};`. The Sass pipeline logs a `skipping scss/progress-bar/progress-bar-prebuilt.scss — not yet present.` warning (ENOENT-tolerant guard); this is EXPECTED — Task 2 creates the SCSS file. Confirm the existing 6 prebuilt CSS files still emit:

```bash
ls src/qwik-material/dist/*.css
```

Expected: `dialog-prebuilt.css`, `button-prebuilt.css`, `card-prebuilt.css`, `toolbar-prebuilt.css`, `badge-prebuilt.css`, `icon-prebuilt.css`. NOT `progress-bar-prebuilt.css` yet.

`ls src/qwik-material/dist/progress-bar/`:

```bash
ls src/qwik-material/dist/progress-bar/
```

Expected: `index.d.ts`, `index.js`, `index.js.map`. `dist/progress-bar/index.d.ts` contents: `export {};`.

- [ ] **Step 6: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. The `intrinsic-elements.d.ts` from Step 3 makes `<mat-progress-bar>` a legal JSX element with a `mode` string attribute.

- [ ] **Step 7: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/progress-bar/intrinsic-elements.d.ts \
  src/qwik-material/progress-bar/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): wire qwik-material/progress-bar entry-point + <mat-progress-bar> JSX augmentation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SCSS + prebuilt CSS

### Task 2: Copy Progress Bar SCSS + `@angular/cdk` rewrite + iterative `:root` variable-name verification + prebuilt CSS

**Reference source:** `src/material/progress-bar/*.scss` (4 files, ~469 total LOC). `progress-bar.scss` has `@use '@angular/cdk';` at line 1 (grep-confirmed) — this port applies the established `@use '../cdk-stub' as cdk` rewrite (same as Dialog / Button / Card / Toolbar / Badge). The 3 partials (`_progress-bar-theme.scss`, `_m2-progress-bar.scss`, `_m3-progress-bar.scss`) are byte-identical copies.

**Files:**
- Create: `src/qwik-material/scss/progress-bar/progress-bar.scss` (copy with `@use '@angular/cdk'` → `@use '../cdk-stub' as cdk` rewrite)
- Create: `src/qwik-material/scss/progress-bar/_progress-bar-theme.scss` (byte-identical)
- Create: `src/qwik-material/scss/progress-bar/_m2-progress-bar.scss` (byte-identical)
- Create: `src/qwik-material/scss/progress-bar/_m3-progress-bar.scss` (byte-identical)
- Create: `src/qwik-material/scss/progress-bar/progress-bar-prebuilt.scss` (new — `@use` + `:root` M3 defaults)

**Interfaces:**
- Consumes: existing SCSS ecosystem — the sass compiler picks up `scss/progress-bar/progress-bar-prebuilt.scss` from Task 1's vite.config.ts change. `_cdk-stub.scss` from prior ports already provides `high-contrast`.
- Produces: `dist/progress-bar-prebuilt.css` after `pnpm -C src/qwik-material build`. Every `--mat-progress-bar-*` and `--mat-sys-*` reference emitted by the compiled CSS has a matching `:root` declaration.

- [ ] **Step 1: Byte-identical copy of the 3 partial SCSS files**

```bash
cp src/material/progress-bar/_progress-bar-theme.scss src/qwik-material/scss/progress-bar/_progress-bar-theme.scss
cp src/material/progress-bar/_m2-progress-bar.scss    src/qwik-material/scss/progress-bar/_m2-progress-bar.scss
cp src/material/progress-bar/_m3-progress-bar.scss    src/qwik-material/scss/progress-bar/_m3-progress-bar.scss
```

Verify byte-identical:

```bash
diff -q src/material/progress-bar/_progress-bar-theme.scss src/qwik-material/scss/progress-bar/_progress-bar-theme.scss
diff -q src/material/progress-bar/_m2-progress-bar.scss    src/qwik-material/scss/progress-bar/_m2-progress-bar.scss
diff -q src/material/progress-bar/_m3-progress-bar.scss    src/qwik-material/scss/progress-bar/_m3-progress-bar.scss
```

Expected: no output on any (empty stdout for each).

- [ ] **Step 2: Copy `progress-bar.scss` with the `@angular/cdk` rewrite**

```bash
cp src/material/progress-bar/progress-bar.scss src/qwik-material/scss/progress-bar/progress-bar.scss
```

Then edit `src/qwik-material/scss/progress-bar/progress-bar.scss` — replace line 1 exactly:

```
-@use '@angular/cdk';
+@use '../cdk-stub' as cdk;
```

Verify only that line changed:

```bash
diff src/material/progress-bar/progress-bar.scss src/qwik-material/scss/progress-bar/progress-bar.scss
```

Expected: exactly the one-line replacement above, no other lines changed.

Verify all `cdk.*` calls in the rewritten file resolve to symbols in `_cdk-stub.scss`:

```bash
grep -nE "cdk\." src/qwik-material/scss/progress-bar/progress-bar.scss
```

For each match, confirm the symbol exists in `src/qwik-material/scss/_cdk-stub.scss`. Expected: only `cdk.high-contrast` calls (already provided by `_cdk-stub.scss` from prior ports). If any other `cdk.` symbol appears (e.g. `cdk.responsive-tabs`), STOP and report BLOCKED — extending the stub is a separate task.

- [ ] **Step 3: Create the initial `src/qwik-material/scss/progress-bar/progress-bar-prebuilt.scss`**

Start with a candidate `:root` block for the tokens `_m3-progress-bar.scss` + `_progress-bar-theme.scss` reference. This is a CANDIDATE — Step 5 iterates to reconcile against the actual emitted CSS. Contents:

```scss
// Progress bar prebuilt CSS. Wraps the port's progress-bar.scss with :root
// defaults for every --mat-progress-bar-* variable it emits. See design
// spec §5.

@use './progress-bar';

:root {
  // M3 sys-color tokens referenced by _m3-progress-bar.scss's color group.
  --mat-sys-primary: #6750a4;
  --mat-sys-surface-variant: #e7e0ec;

  // Progress-bar-specific tokens (emitted by _m3-progress-bar.scss's base + color).
  --mat-progress-bar-active-indicator-height: 4px;
  --mat-progress-bar-track-height: 4px;
  --mat-progress-bar-track-shape: 0;
  --mat-progress-bar-active-indicator-color: var(--mat-sys-primary, #6750a4);
  --mat-progress-bar-track-color: var(--mat-sys-surface-variant, #e7e0ec);
}
```

Note the Sass syntax requirement: `@use './progress-bar';` MUST come before the `:root { … }` block. This differs from the badge/icon-prebuilt.scss files which append `@use` at the end — Sass requires `@use` first. Icon Task 2's implementer had to fix this via reorder; this brief bakes the correct order in.

- [ ] **Step 4: Run the build to emit `dist/progress-bar-prebuilt.css`**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. `dist/progress-bar-prebuilt.css` present:

```bash
ls src/qwik-material/dist/progress-bar-prebuilt.css
```

Expected: file listed.

- [ ] **Step 5: Grep the emitted CSS for every `--mat-*` reference and reconcile against the `:root` block**

This is the KEY step. The candidate `:root` block from Step 3 is a starting guess — the compiled CSS is the source of truth. Reconcile until the two variable sets are IDENTICAL.

```bash
# What the compiled CSS actually references
grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/progress-bar-prebuilt.css | sort -u
```

Compare to what the `:root` block declares:

```bash
grep -oE '^\s*--mat-[a-z-]+' src/qwik-material/scss/progress-bar/progress-bar-prebuilt.scss | sort -u
```

For every `var(--mat-*)` reference NOT covered by a `:root` line in `progress-bar-prebuilt.scss`:
- Look up the token name in `src/material/core/tokens/m3/_md-sys-color.scss` (for `--mat-sys-color-*`), `src/material/core/tokens/m3/_md-sys-typescale.scss` (for `--mat-sys-typescale-*`), `src/material/core/tokens/m3/_md-sys-shape.scss` (for `--mat-sys-shape-*`), etc.
- Add a `:root` declaration with the correct M3 default. For `--mat-sys-*` tokens with a natural fallback, use `var(--mat-sys-<upstream-name>, <literal-fallback>)`. For progress-bar-specific tokens with no upstream sys equivalent, use the literal value from `_m3-progress-bar.scss`.

For every `:root` declaration NOT actually referenced in the compiled CSS: remove it (phantom variable, would confuse consumers).

Rebuild after every edit until the diff is empty:

```bash
diff \
  <(grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/progress-bar-prebuilt.css | sed 's/var(//' | sort -u) \
  <(grep -oE '^\s*--mat-[a-z-]+' src/qwik-material/scss/progress-bar/progress-bar-prebuilt.scss | sed 's/^\s*//' | sort -u)
```

Expected: no output.

**Note on Icon Task 2 precedent:** the plan-author's candidate `:root` block may name variables that don't match what the SCSS actually emits (Icon Task 2 caught this — the plan said `--mat-icon-icon-color` but the real name was `--mat-icon-color`). Trust the compiled CSS's variable names over this brief. If you find the candidate above declares a variable that isn't in the compiled CSS, delete it. If the compiled CSS references a variable not in the candidate, add it.

- [ ] **Step 6: Confirm the `.mat-mdc-progress-bar` and `.mdc-linear-progress` structural rules survived**

```bash
grep -cE "^\.mat-mdc-progress-bar|^\.mdc-linear-progress" src/qwik-material/dist/progress-bar-prebuilt.css
```

Expected: at least `2` (top-level `.mat-mdc-progress-bar` block + `.mdc-linear-progress` block + potentially more via specific selectors like `.mdc-linear-progress--indeterminate`, `.mdc-linear-progress__buffer`, etc.). Higher is fine.

- [ ] **Step 7: Confirm existing 6 prebuilt CSS files still emit**

```bash
ls src/qwik-material/dist/*.css
```

Expected: 7 files (dialog + button + card + toolbar + badge + icon + progress-bar).

- [ ] **Step 8: Commit**

```bash
git add \
  src/qwik-material/scss/progress-bar/progress-bar.scss \
  src/qwik-material/scss/progress-bar/_progress-bar-theme.scss \
  src/qwik-material/scss/progress-bar/_m2-progress-bar.scss \
  src/qwik-material/scss/progress-bar/_m3-progress-bar.scss \
  src/qwik-material/scss/progress-bar/progress-bar-prebuilt.scss
git commit -m "$(cat <<'EOF'
feat(multiple): copy Progress Bar SCSS chain + progress-bar-prebuilt.css defaults

3 upstream partial .scss files copied byte-identical (_progress-bar-theme,
_m2-progress-bar, _m3-progress-bar). progress-bar.scss copied with one
deviation: @use '@angular/cdk' rewritten to @use '../cdk-stub' as cdk —
same rewrite as dialog/button/card/toolbar/badge ports. Only cdk.high-contrast
is called, already provided by existing _cdk-stub.scss.

progress-bar-prebuilt.scss adds :root defaults for every --mat-progress-bar-*
and --mat-sys-* variable the compiled CSS references. Verified by grepping
dist/progress-bar-prebuilt.css and reconciling against the :root block
until the diff is empty.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Types

### Task 3: `MatProgressBarColor` type file

**Reference source:** `src/material/progress-bar/progress-bar.ts:27` (ThemePalette import) + line 99's `mat-<color>` class binding.

**Files:**
- Create: `src/qwik-material/progress-bar/progress-bar-color.ts`
- Create: `src/qwik-material/progress-bar/progress-bar-color.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MatProgressBarColor` type — narrowed 3-value union.

- [ ] **Step 1: Create `src/qwik-material/progress-bar/progress-bar-color.ts`**

Contents:

```ts
/**
 * MatProgressBar color variants applied via the `.mat-<color>` class. Narrowed
 * from upstream's ThemePalette (see src/material/progress-bar/progress-bar.ts:27)
 * to the three values Angular Material actually uses for progress bars.
 */
export type MatProgressBarColor = 'primary' | 'accent' | 'warn';
```

- [ ] **Step 2: Create `src/qwik-material/progress-bar/progress-bar-color.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import type {MatProgressBarColor} from './progress-bar-color';

describe('MatProgressBarColor', () => {
  it('accepts the three documented values', () => {
    const a: MatProgressBarColor = 'primary';
    const b: MatProgressBarColor = 'accent';
    const c: MatProgressBarColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test progress-bar/progress-bar-color
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/progress-bar/progress-bar-color.ts src/qwik-material/progress-bar/progress-bar-color.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatProgressBarColor type (primary | accent | warn)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `MatProgressBarMode` type file

**Reference source:** `src/material/progress-bar/progress-bar.ts:84` (ProgressBarMode type).

**Files:**
- Create: `src/qwik-material/progress-bar/progress-bar-mode.ts`
- Create: `src/qwik-material/progress-bar/progress-bar-mode.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MatProgressBarMode` type — verbatim 4-value union.

- [ ] **Step 1: Create `src/qwik-material/progress-bar/progress-bar-mode.ts`**

Contents:

```ts
/**
 * MatProgressBar mode. Verbatim port of upstream's ProgressBarMode
 * (src/material/progress-bar/progress-bar.ts:84).
 *
 *   determinate  — value-driven bar, no continuous animation
 *   indeterminate — continuous back-and-forth animation, aria-valuenow omitted
 *   buffer       — determinate primary + buffer bar + dotted "loading" pattern
 *   query        — visually identical to indeterminate; separate mode for CMS
 */
export type MatProgressBarMode = 'determinate' | 'indeterminate' | 'buffer' | 'query';
```

- [ ] **Step 2: Create `src/qwik-material/progress-bar/progress-bar-mode.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import type {MatProgressBarMode} from './progress-bar-mode';

describe('MatProgressBarMode', () => {
  it('accepts the four documented values', () => {
    const a: MatProgressBarMode = 'determinate';
    const b: MatProgressBarMode = 'indeterminate';
    const c: MatProgressBarMode = 'buffer';
    const d: MatProgressBarMode = 'query';
    expect([a, b, c, d]).toEqual(['determinate', 'indeterminate', 'buffer', 'query']);
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test progress-bar/progress-bar-mode
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/progress-bar/progress-bar-mode.ts src/qwik-material/progress-bar/progress-bar-mode.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatProgressBarMode type (determinate | indeterminate | buffer | query)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Config token

### Task 5: `MatProgressBarConfig` + `MAT_PROGRESS_BAR_CONFIG` context token

**Reference source:** `src/material/progress-bar/progress-bar.ts:34-52` (MatProgressBarDefaultOptions interface + MAT_PROGRESS_BAR_DEFAULT_OPTIONS injection token).

**Files:**
- Create: `src/qwik-material/progress-bar/progress-bar-config.ts`
- Create: `src/qwik-material/progress-bar/progress-bar-config.spec.ts`

**Interfaces:**
- Consumes: `MatProgressBarColor` from Task 3, `MatProgressBarMode` from Task 4.
- Produces:
  - `interface MatProgressBarConfig { color?: MatProgressBarColor; mode?: MatProgressBarMode; }`
  - `const MAT_PROGRESS_BAR_CONFIG: ContextId<MatProgressBarConfig>` with id `'qwik-material/progress-bar-config'`

- [ ] **Step 1: Create `src/qwik-material/progress-bar/progress-bar-config.ts`**

Contents:

```ts
import {createContextId} from '@builder.io/qwik';
import type {MatProgressBarColor} from './progress-bar-color';
import type {MatProgressBarMode} from './progress-bar-mode';

/**
 * Defaults applied to every <MatProgressBar> in a subtree. Consumers provide
 * this via <QwikMaterialProvider matProgressBarConfig={...}>. Mirrors upstream
 * MatProgressBarDefaultOptions (src/material/progress-bar/progress-bar.ts:34-47).
 */
export interface MatProgressBarConfig {
  /** Default M2 palette color. Adds the `.mat-<color>` class if set. */
  color?: MatProgressBarColor;
  /** Default mode. Defaults to `'determinate'` when unset. */
  mode?: MatProgressBarMode;
}

/**
 * Context id used by <MatProgressBar> to read config. The id string is exposed
 * publicly and MUST remain stable across releases — consumers may inject it
 * directly in advanced scenarios.
 */
export const MAT_PROGRESS_BAR_CONFIG = createContextId<MatProgressBarConfig>(
  'qwik-material/progress-bar-config',
);
```

- [ ] **Step 2: Create `src/qwik-material/progress-bar/progress-bar-config.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import {MAT_PROGRESS_BAR_CONFIG, type MatProgressBarConfig} from './progress-bar-config';

describe('MAT_PROGRESS_BAR_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_PROGRESS_BAR_CONFIG.id).toBe('qwik-material/progress-bar-config');
  });

  it('MatProgressBarConfig accepts an empty object', () => {
    const cfg: MatProgressBarConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatProgressBarConfig accepts every documented field', () => {
    const cfg: MatProgressBarConfig = {color: 'accent', mode: 'buffer'};
    expect(cfg.color).toBe('accent');
    expect(cfg.mode).toBe('buffer');
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test progress-bar/progress-bar-config
```

Expected: 3/3 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/progress-bar/progress-bar-config.ts src/qwik-material/progress-bar/progress-bar-config.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatProgressBarConfig + MAT_PROGRESS_BAR_CONFIG context token

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Component

### Task 6: `<MatProgressBar>` component

**Reference source:** `src/material/progress-bar/progress-bar.ts:86-251` (component decorator + host bindings + prop setters + template getters + transitionend handler) + `src/material/progress-bar/progress-bar.html` (3-div inner template).

**Files:**
- Create: `src/qwik-material/progress-bar/mat-progress-bar.tsx`
- Create: `src/qwik-material/progress-bar/mat-progress-bar.spec.tsx`

**Interfaces:**
- Consumes:
  - `MatProgressBarColor` (Task 3)
  - `MatProgressBarMode` (Task 4)
  - `MAT_PROGRESS_BAR_CONFIG` + `MatProgressBarConfig` (Task 5)
  - `MAT_ANIMATIONS_DISABLED` from `../dialog/mat-dialog-tokens` (established at Dialog port — a `Signal<boolean>`)
- Produces:
  - `interface MatProgressBarProps` — 10 optional fields per spec §2.3
  - `const MatProgressBar: Component<MatProgressBarProps>`

- [ ] **Step 1: Create `src/qwik-material/progress-bar/mat-progress-bar.tsx`**

Contents (mirrors the shape of `src/qwik-material/icon/mat-icon.tsx` — stateless `component$`, prop resolution chain, class ladder via `.filter(Boolean) as string[]`, plus a `useVisibleTask$` for the transitionend listener):

```tsx
import {
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
  type QRL,
} from '@builder.io/qwik';
import type {MatProgressBarColor} from './progress-bar-color';
import type {MatProgressBarMode} from './progress-bar-mode';
import {MAT_PROGRESS_BAR_CONFIG, type MatProgressBarConfig} from './progress-bar-config';
import {MAT_ANIMATIONS_DISABLED} from '../dialog/mat-dialog-tokens';

/**
 * Props for <MatProgressBar>. Renders <mat-progress-bar> custom element with
 * the upstream MDC linear-progress DOM structure. See design spec §3.
 */
export interface MatProgressBarProps {
  /** Progress percentage 0-100 (clamped). Ignored in indeterminate/query mode. */
  value?: number;
  /** Buffer percentage 0-100 (clamped). Only visually applied in `buffer` mode. */
  bufferValue?: number;
  color?: MatProgressBarColor;
  mode?: MatProgressBarMode;
  /**
   * Fires when the primary bar's `transitionend` event completes in
   * `determinate` or `buffer` mode. Not called for `indeterminate` / `query`.
   * The callback receives the current clamped value at fire time.
   */
  onAnimationEnd$?: QRL<(value: number) => void>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatProgressBarConfig = {};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v || 0));
}

export const MatProgressBar = component$<MatProgressBarProps>(props => {
  const config = useContext(MAT_PROGRESS_BAR_CONFIG, DEFAULTS);
  const animationsDisabled = useContext(MAT_ANIMATIONS_DISABLED);

  const color = props.color ?? config.color ?? 'primary';
  const mode = props.mode ?? config.mode ?? 'determinate';
  const value = clamp(props.value ?? 0);
  const bufferValue = clamp(props.bufferValue ?? 0);

  const isIndeterminate = mode === 'indeterminate' || mode === 'query';
  const noopable = animationsDisabled.value;
  const primaryTransform = `scaleX(${isIndeterminate ? 1 : value / 100})`;
  const bufferFlexBasis = `${mode === 'buffer' ? bufferValue : 100}%`;

  const classes = [
    'mat-mdc-progress-bar',
    'mdc-linear-progress',
    `mat-${color}`,
    noopable && '_mat-animation-noopable',
    !noopable && 'mdc-linear-progress--animation-ready',
    isIndeterminate && 'mdc-linear-progress--indeterminate',
    props.class,
  ].filter(Boolean) as string[];

  const hostRef = useSignal<Element>();

  useVisibleTask$(({cleanup}) => {
    const el = hostRef.value;
    if (!el) return;
    const handler = (event: TransitionEvent) => {
      // Filter to the primary bar's own transitionend (children bubble).
      const target = event.target as HTMLElement | null;
      if (!target || !target.classList.contains('mdc-linear-progress__primary-bar')) return;
      // Read LIVE prop values via the Qwik props proxy — this handler may fire
      // long after this useVisibleTask$ callback ran, and mode/value/callback
      // may have changed. props.X stays current across renders.
      const currentMode = props.mode ?? config.mode ?? 'determinate';
      if (currentMode !== 'determinate' && currentMode !== 'buffer') return;
      const cb = props.onAnimationEnd$;
      if (!cb) return;
      cb(clamp(props.value ?? 0));
    };
    el.addEventListener('transitionend', handler);
    cleanup(() => el.removeEventListener('transitionend', handler));
  });

  return (
    <mat-progress-bar
      ref={hostRef}
      id={props.id}
      class={classes}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isIndeterminate ? undefined : value}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
      tabIndex={-1}
      mode={mode}
    >
      <div class="mdc-linear-progress__buffer" aria-hidden="true">
        <div class="mdc-linear-progress__buffer-bar" style={{flexBasis: bufferFlexBasis}} />
        {mode === 'buffer' && <div class="mdc-linear-progress__buffer-dots" />}
      </div>
      <div
        class="mdc-linear-progress__bar mdc-linear-progress__primary-bar"
        aria-hidden="true"
        style={{transform: primaryTransform}}
      >
        <span class="mdc-linear-progress__bar-inner" />
      </div>
      <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar" aria-hidden="true">
        <span class="mdc-linear-progress__bar-inner" />
      </div>
    </mat-progress-bar>
  );
});
```

Notes for the implementer:
- `clamp()` is a top-level function. Do NOT inline `Math.max(...Math.min(...))` inside `component$` — the Rollup safety precedent from Badge Task 5 says any non-trivial helper referenced by the extracted `component$` callback needs to be top-level.
- Inside the `useVisibleTask$` handler, read `props.mode` / `props.value` / `props.onAnimationEnd$` DIRECTLY. Do NOT capture the render-time-derived `mode` / `value` locals — those are stale by the next render. Qwik's props proxy stays valid across renders, so `props.X` inside a QRL closure always returns the current value.
- `<mat-progress-bar>` accepts a `mode` string attribute because Task 1's `intrinsic-elements.d.ts` widens the type to `QwikIntrinsicElements['div'] & {mode?: string}`. Without that widening, this file would fail typecheck.
- `aria-valuenow={isIndeterminate ? undefined : value}` — Qwik omits `undefined` attrs, matching upstream's `[attr.aria-valuenow]: '_isIndeterminate() ? null : value'` semantics (verified in Icon port).
- Every inner div carries `aria-hidden="true"` per the upstream template (see comment in progress-bar.html about ChromeVox screen-reader support).

- [ ] **Step 2: Create `src/qwik-material/progress-bar/mat-progress-bar.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatProgressBar} from './mat-progress-bar';

describe('MatProgressBar (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatProgressBar).toBeDefined();
    expect(typeof MatProgressBar).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test progress-bar/mat-progress-bar
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. The `intrinsic-elements.d.ts` from Task 1 makes `<mat-progress-bar>` a legal JSX element with a `mode` string attribute.

- [ ] **Step 5: Verify no SSR-global access outside `useVisibleTask$`**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/progress-bar/mat-progress-bar.tsx
```

Expected: no matches. The `addEventListener` call is on `hostRef.value` (an `Element` from Qwik's ref) inside `useVisibleTask$` — that's client-only by construction, no `document`/`window` involved. Also:

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/progress-bar/mat-progress-bar.tsx
```

Expected: no matches (`isBrowser` import banned per Global Constraints).

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/progress-bar/mat-progress-bar.tsx src/qwik-material/progress-bar/mat-progress-bar.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatProgressBar component (4 modes + onAnimationEnd$ QRL)

Renders <mat-progress-bar> with the upstream MDC linear-progress inner
template. useVisibleTask$ attaches transitionend listener that reads live
prop values via the Qwik props proxy at fire time (not render-time
locals). Zero SSR-global access outside the visible task.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Provider extension

### Task 7: Extend `<QwikMaterialProvider>` with `matProgressBarConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (currently ships 7 `useContextProvider` calls after Icon). Adding progress-bar makes it 8.

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-progress-bar.spec.tsx`

**Interfaces:**
- Consumes: `MatProgressBarConfig` + `MAT_PROGRESS_BAR_CONFIG` from Task 5.
- Produces: an extended `QwikMaterialProviderProps.matProgressBarConfig?: MatProgressBarConfig` field + an 8th `useContextProvider(MAT_PROGRESS_BAR_CONFIG, ...)` call. All 7 pre-existing provider calls unchanged.

- [ ] **Step 1: Extend the imports at the top of `qwik-material-provider.tsx`**

Read the file's current import block. Add two import lines after the icon import block. The final import block becomes (order matters — matches the alphabetical-ish precedent used through Badge → Icon):

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
import type {MatCardConfig} from '../card/card-config';
import {MAT_CARD_CONFIG} from '../card/card-config';
import type {MatBadgeConfig} from '../badge/badge-config';
import {MAT_BADGE_CONFIG} from '../badge/badge-config';
import type {MatIconConfig} from '../icon/icon-config';
import {MAT_ICON_CONFIG} from '../icon/icon-config';
import type {MatProgressBarConfig} from '../progress-bar/progress-bar-config';
import {MAT_PROGRESS_BAR_CONFIG} from '../progress-bar/progress-bar-config';
```

- [ ] **Step 2: Extend `QwikMaterialProviderProps` with the `matProgressBarConfig?` field**

Append to the interface body (after `matIconConfig`), so the final interface has:

```tsx
export interface QwikMaterialProviderProps {
  /** Defaults merged into every MatDialog open() config. */
  matDialogDefaults?: Partial<MatDialogConfig>;
  /** Factory returning the default ScrollStrategy for MatDialog. Defaults to createBlockScrollStrategy(). */
  matDialogScrollStrategyFactory?: () => ScrollStrategy;
  /** Disables all Material animations globally when true. */
  animationsDisabled?: boolean;
  /** Defaults applied to every MatButton / MatIconButton / MatFabButton / MatMiniFabButton in this subtree. */
  matButtonConfig?: MatButtonConfig;
  /** Defaults applied to every MatCard in this subtree. */
  matCardConfig?: MatCardConfig;
  /** Defaults applied to every MatBadge in this subtree. */
  matBadgeConfig?: MatBadgeConfig;
  /** Defaults applied to every MatIcon in this subtree. */
  matIconConfig?: MatIconConfig;
  /** Defaults applied to every MatProgressBar in this subtree. */
  matProgressBarConfig?: MatProgressBarConfig;
}
```

- [ ] **Step 3: Add the 8th `useContextProvider` call at the end of the component body**

Append AFTER the `useContextProvider(MAT_ICON_CONFIG, props.matIconConfig ?? {});` line and BEFORE the `return <Slot />;`:

```tsx
  // MatProgressBarConfig is a plain object with primitive fields — no noSerialize needed.
  // Progress bars outside a provider get the DEFAULTS declared in MatProgressBar; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_PROGRESS_BAR_CONFIG, props.matProgressBarConfig ?? {});
```

Verify all 7 pre-existing `useContextProvider` calls are untouched (in order: MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_ANIMATIONS_DISABLED, MAT_BUTTON_CONFIG, MAT_CARD_CONFIG, MAT_BADGE_CONFIG, MAT_ICON_CONFIG). Do NOT change their order or arguments.

- [ ] **Step 4: Create the provider-progress-bar smoke spec `qwik-material-provider-progress-bar.spec.tsx`**

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatProgressBarConfig} from '../progress-bar/progress-bar-config';

describe('QwikMaterialProvider — matProgressBarConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts a matProgressBarConfig field', () => {
    const cfg: MatProgressBarConfig = {color: 'accent', mode: 'buffer'};
    const props: QwikMaterialProviderProps = {matProgressBarConfig: cfg};
    expect(props.matProgressBarConfig?.color).toBe('accent');
    expect(props.matProgressBarConfig?.mode).toBe('buffer');
  });

  it('QwikMaterialProviderProps.matProgressBarConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matProgressBarConfig).toBeUndefined();
  });
});
```

- [ ] **Step 5: Run the provider spec**

```bash
pnpm -C src/qwik-material test qwik-material-provider-progress-bar
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
  src/qwik-material/dialog/qwik-material-provider-progress-bar.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): extend QwikMaterialProvider with matProgressBarConfig

Adds the 8th useContextProvider call (after MAT_ICON_CONFIG). All 7
pre-existing provider calls preserved unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Public API

### Task 8: `progress-bar/public-api.ts` + `progress-bar/index.ts` + build verification

**Reference source:** design spec §2.5.

**Files:**
- Create: `src/qwik-material/progress-bar/public-api.ts`
- Modify: `src/qwik-material/progress-bar/index.ts` (was empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Tasks 3, 4, 5, 6.
- Produces: the exact public export surface consumers see when they import from `@angular-community/qwik-material/progress-bar`.

- [ ] **Step 1: Create `src/qwik-material/progress-bar/public-api.ts`**

Contents (matches design spec §2.5 verbatim):

```ts
// Public API for @angular-community/qwik-material/progress-bar.
// See docs/superpowers/specs/2026-07-29-qwik-material-progress-bar-port-design.md §2.

export type {MatProgressBarColor} from './progress-bar-color';
export type {MatProgressBarMode} from './progress-bar-mode';
export type {MatProgressBarConfig} from './progress-bar-config';
export {MAT_PROGRESS_BAR_CONFIG} from './progress-bar-config';
export {MatProgressBar, type MatProgressBarProps} from './mat-progress-bar';
```

- [ ] **Step 2: Replace the empty stub in `src/qwik-material/progress-bar/index.ts`**

Replace the entire file (was `export {};` from Task 1) with:

```ts
export * from './public-api';
```

- [ ] **Step 3: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. No Rollup `Illegal reassignment of import` errors (progress-bar has no module-level mutable state — the `clamp()` helper is a pure function).

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify the emitted d.ts export surface**

```bash
grep -nE "^export " src/qwik-material/dist/progress-bar/public-api.d.ts
```

Expected: 5 export lines covering `MatProgressBarColor`, `MatProgressBarMode`, `MatProgressBarConfig` (types), `MAT_PROGRESS_BAR_CONFIG` (value), and `MatProgressBar` + `MatProgressBarProps` type.

Confirm no leaked classes:

```bash
grep -nE "^export declare class" src/qwik-material/dist/progress-bar/public-api.d.ts
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/progress-bar/public-api.ts src/qwik-material/progress-bar/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): finalize qwik-material/progress-bar public API

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Vitest scenario port

### Task 9: Vitest scenario port from `src/material/progress-bar/progress-bar.spec.ts`

**Reference source:** `src/material/progress-bar/progress-bar.spec.ts` (346 LOC). Most tests exercise Angular DI (`MatProgressBarDefaultOptions`, `MAT_PROGRESS_BAR_LOCATION`, `NgZone`, `EventEmitter.subscribe`) or upstream template internals; the shipped port covers the rest via Playwright.

**Files:**
- Create: `src/qwik-material/progress-bar/mat-progress-bar-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 8.
- Produces: consolidated scenario coverage documenting upstream test intent.

- [ ] **Step 1: Write the scenario spec**

Contents:

```tsx
/**
 * MatProgressBar scenario port from src/material/progress-bar/progress-bar.spec.ts.
 *
 * Upstream has ~30 `it()` blocks — mostly host classes/attrs + value clamping +
 * Angular DI (EventEmitter.subscribe, MAT_PROGRESS_BAR_LOCATION, NgZone,
 * MAT_PROGRESS_BAR_DEFAULT_OPTIONS injection). Restructured:
 *
 *   - Live sanity tests (7): typeof + type unions + MAT_PROGRESS_BAR_CONFIG.id +
 *     props-shape smoke.
 *   - describe.skip DOM-rendered (15): host classes/attrs + mode reflection +
 *     value clamping + primary transform + buffer flex-basis + buffer-dots
 *     conditional + aria-* forwarding + onAnimationEnd$ callback firing.
 *     Deferred to Playwright Task 10.
 *   - describe.skip Angular-only (10): NgZone/Renderer2/ChangeDetectorRef,
 *     MAT_PROGRESS_BAR_LOCATION, _getAnimationsState, EventEmitter.subscribe,
 *     numberAttribute transform, DI-injected defaults, providedIn:'root'
 *     factory. Deferred forever per design spec §6 deviations.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-progress-bar/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_PROGRESS_BAR_CONFIG,
  MatProgressBar,
  type MatProgressBarColor,
  type MatProgressBarConfig,
  type MatProgressBarMode,
  type MatProgressBarProps,
} from './public-api';

describe('MatProgressBar — sanity', () => {
  it('MatProgressBar is exported', () => {
    expect(MatProgressBar).toBeDefined();
    expect(typeof MatProgressBar).toBe('function');
  });

  it('MAT_PROGRESS_BAR_CONFIG carries the expected context id', () => {
    expect(MAT_PROGRESS_BAR_CONFIG.id).toBe('qwik-material/progress-bar-config');
  });

  it('MatProgressBarColor accepts the three documented values', () => {
    const values: MatProgressBarColor[] = ['primary', 'accent', 'warn'];
    expect(values).toEqual(['primary', 'accent', 'warn']);
  });

  it('MatProgressBarMode accepts all four documented values', () => {
    const values: MatProgressBarMode[] = ['determinate', 'indeterminate', 'buffer', 'query'];
    expect(values).toHaveLength(4);
  });

  it('MatProgressBarConfig accepts an empty config', () => {
    const cfg: MatProgressBarConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatProgressBarProps accepts numeric + mode + color surface', () => {
    const p: MatProgressBarProps = {
      value: 50,
      bufferValue: 75,
      color: 'accent',
      mode: 'buffer',
    };
    expect(p.value).toBe(50);
  });

  it('MatProgressBarProps accepts aria + onAnimationEnd surface', () => {
    const p: MatProgressBarProps = {
      'aria-label': 'Uploading',
      'aria-labelledby': 'upload-heading',
      'aria-describedby': 'upload-tips',
    };
    expect(p['aria-label']).toBe('Uploading');
  });
});

describe.skip('MatProgressBar DOM-rendered scenarios — deferred to Playwright Task 10', () => {
  it('should apply .mat-mdc-progress-bar and .mdc-linear-progress classes', () => {});
  it('should apply .mat-<color> class per color prop', () => {});
  it('should apply ._mat-animation-noopable when matAnimationsDisabled is true', () => {});
  it('should apply .mdc-linear-progress--animation-ready when animations enabled', () => {});
  it('should apply .mdc-linear-progress--indeterminate in indeterminate/query modes', () => {});
  it('should reflect mode via the `mode` attribute', () => {});
  it('should emit role="progressbar" + tabindex="-1"', () => {});
  it('should omit aria-valuenow in indeterminate/query modes', () => {});
  it('should emit aria-valuenow in determinate/buffer modes', () => {});
  it('should clamp value to 0-100', () => {});
  it('should apply transform: scaleX(value/100) to primary bar in determinate/buffer', () => {});
  it('should apply flex-basis to buffer bar per bufferValue in buffer mode', () => {});
  it('should render buffer-dots div only when mode === "buffer"', () => {});
  it('should forward aria-label / aria-labelledby / aria-describedby', () => {});
  it('should fire onAnimationEnd$ on primary-bar transitionend in determinate/buffer', () => {});
});

describe.skip('MatProgressBar — Angular-only tests', () => {
  it('should inject NgZone.runOutsideAngular for transitionend listener', () => {
    // Qwik uses useVisibleTask$ — §6 deviation #6.
  });
  it('should use Renderer2.listen for transitionend', () => {
    // Qwik uses direct addEventListener inside useVisibleTask$ — §6 deviation #6.
  });
  it('should trigger ChangeDetectorRef.markForCheck on setter mutation', () => {
    // Qwik's reactivity handles this natively — §6 deviation #6.
  });
  it('should detect MAT_PROGRESS_BAR_LOCATION via DI factory', () => {
    // MAT_PROGRESS_BAR_LOCATION omitted — §6 deviation #5.
  });
  it('should read _getAnimationsState() di-disabled', () => {
    // Replaced by MAT_ANIMATIONS_DISABLED context — §6 deviation #3.
  });
  it('should apply .mat-progress-bar-reduced-motion class via matchMedia', () => {
    // SCSS @media handles it — §6 deviation #4.
  });
  it('should notify animationEnd subscribers via EventEmitter', () => {
    // EventEmitter → onAnimationEnd$ QRL prop — §6 deviation #2.
  });
  it('should transform value via numberAttribute decorator', () => {
    // Port accepts JSX number and clamps — §6 deviation #9.
  });
  it('should apply MAT_PROGRESS_BAR_DEFAULT_OPTIONS via DI', () => {
    // Provider flow verified in Task 7 + Task 10 dev-app.
  });
  it('should register MAT_PROGRESS_BAR_LOCATION via providedIn: "root"', () => {
    // Angular DI-specific — no equivalent needed.
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
pnpm -C src/qwik-material test progress-bar/mat-progress-bar-scenarios
```

Expected: 7 passing + 25 skipped, exit 0.

- [ ] **Step 3: Run the full qwik-material suite for regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-9 total + 7 passing + 25 skipped, zero failures.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/progress-bar/mat-progress-bar-scenarios.spec.tsx
git commit -m "$(cat <<'EOF'
test(multiple): port MatProgressBar scenarios from upstream progress-bar.spec.ts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Dev-app + Playwright parity

### Task 10: 8 mat-progress-bar dev-app routes + index tile + root.tsx CSS import + 8 Playwright parity specs

**Reference source:** existing dev-app + Playwright patterns from Icon port at `src/qwik-cdk-dev-app/src/routes/mat-icon/` and `src/qwik-cdk-parity-tests/specs/material-icon/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add progress-bar-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Progress bars" section with 8 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/determinate/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/indeterminate/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/buffer/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/query/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/colors/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/animation-end/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/aria-labeled/index.tsx`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-bar/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-bar/determinate.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-bar/indeterminate.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-bar/buffer.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-bar/query.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-bar/colors.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-bar/animation-end.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-bar/aria-labeled.spec.ts`

**Interfaces:**
- Consumes: `@angular-community/qwik-material/progress-bar` (Task 8).
- Produces: 8 dev-app routes + 8 Playwright specs asserting host tag + classes + attrs + inner DOM.

- [ ] **Step 1: Add the progress-bar-prebuilt.css import to `src/qwik-cdk-dev-app/src/root.tsx`**

Read the current file. Append the progress-bar CSS import after the icon one:

```tsx
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/card-prebuilt.css';
import '@angular-community/qwik-material/toolbar-prebuilt.css';
import '@angular-community/qwik-material/badge-prebuilt.css';
import '@angular-community/qwik-material/icon-prebuilt.css';
import '@angular-community/qwik-material/progress-bar-prebuilt.css';
```

- [ ] **Step 2: Add a "Progress bars" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert after the existing "Icons" section:

```tsx
<section>
  <h2>Progress bars</h2>
  <ul>
    <li><a href="/mat-progress-bar/basic/">basic</a></li>
    <li><a href="/mat-progress-bar/determinate/">determinate</a></li>
    <li><a href="/mat-progress-bar/indeterminate/">indeterminate</a></li>
    <li><a href="/mat-progress-bar/buffer/">buffer</a></li>
    <li><a href="/mat-progress-bar/query/">query</a></li>
    <li><a href="/mat-progress-bar/colors/">colors</a></li>
    <li><a href="/mat-progress-bar/animation-end/">animation-end</a></li>
    <li><a href="/mat-progress-bar/aria-labeled/">aria-labeled</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar value={50} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `determinate/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar mode="determinate" value={75} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `indeterminate/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar mode="indeterminate" />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create `buffer/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar mode="buffer" value={30} bufferValue={65} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `query/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar mode="query" />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create `colors/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar color="primary" value={25} />
    <MatProgressBar color="accent" value={50} />
    <MatProgressBar color="warn" value={75} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Create `animation-end/index.tsx`**

Note: this route demonstrates the `onAnimationEnd$` QRL. The transitionend event fires only after the primary bar's CSS transition completes, so the initial value=100 render itself doesn't trigger it (no transition on first paint). To exercise the callback, the route toggles value from 0 → 100 in a `useVisibleTask$` on mount.

```tsx
import {$, component$, useSignal, useVisibleTask$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => {
  const value = useSignal(0);
  const fired = useSignal(false);

  useVisibleTask$(() => {
    // Kick the value from 0 to 100 on next tick to trigger a transition.
    queueMicrotask(() => {
      value.value = 100;
    });
  });

  return (
    <>
      <MatProgressBar
        value={value.value}
        onAnimationEnd$={$((v: number) => {
          fired.value = true;
          console.log('animationEnd', v);
        })}
      />
      <div data-animation-end={fired.value ? 'fired' : 'pending'}>{fired.value ? 'fired' : 'pending'}</div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
```

- [ ] **Step 10: Create `aria-labeled/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar value={25} aria-label="Uploading" />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 11: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Confirm client + SSR builds succeed. Verify 8 mat-progress-bar routes in the manifest:

```bash
grep -oE 'mat-progress-bar/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `8`.

List them explicitly:

```bash
grep -oE 'mat-progress-bar/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u
```

Expected:
```
mat-progress-bar/animation-end
mat-progress-bar/aria-labeled
mat-progress-bar/basic
mat-progress-bar/buffer
mat-progress-bar/colors
mat-progress-bar/determinate
mat-progress-bar/indeterminate
mat-progress-bar/query
```

- [ ] **Step 12: Create `basic.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/basic — <mat-progress-bar> with default determinate mode, primary color, aria-valuenow=50, 3-div inner template', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toBeVisible();
  await expect(bar).toHaveClass(/mat-mdc-progress-bar/);
  await expect(bar).toHaveClass(/mdc-linear-progress/);
  await expect(bar).toHaveClass(/mat-primary/);
  await expect(bar).toHaveAttribute('role', 'progressbar');
  await expect(bar).toHaveAttribute('aria-valuemin', '0');
  await expect(bar).toHaveAttribute('aria-valuemax', '100');
  await expect(bar).toHaveAttribute('aria-valuenow', '50');
  await expect(bar).toHaveAttribute('tabindex', '-1');
  await expect(bar).toHaveAttribute('mode', 'determinate');

  await expect(bar.locator('.mdc-linear-progress__buffer')).toBeAttached();
  await expect(bar.locator('.mdc-linear-progress__primary-bar')).toBeAttached();
  await expect(bar.locator('.mdc-linear-progress__secondary-bar')).toBeAttached();
});
```

- [ ] **Step 13: Create `determinate.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/determinate — mode="determinate" value=75, aria-valuenow=75, primary bar transform scaleX(0.75)', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/determinate/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toHaveAttribute('mode', 'determinate');
  await expect(bar).toHaveAttribute('aria-valuenow', '75');
  await expect(bar).not.toHaveClass(/mdc-linear-progress--indeterminate/);

  const primary = bar.locator('.mdc-linear-progress__primary-bar');
  await expect(primary).toHaveAttribute('style', /scaleX\(0\.75\)/);
});
```

- [ ] **Step 14: Create `indeterminate.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/indeterminate — .mdc-linear-progress--indeterminate class + no aria-valuenow + mode attribute reflected', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/indeterminate/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toHaveClass(/mdc-linear-progress--indeterminate/);
  await expect(bar).toHaveAttribute('mode', 'indeterminate');
  await expect(bar).not.toHaveAttribute('aria-valuenow', /./);
});
```

- [ ] **Step 15: Create `buffer.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/buffer — mode="buffer" value=30 bufferValue=65, buffer-dots div present, buffer-bar flex-basis=65%', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/buffer/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toHaveAttribute('mode', 'buffer');
  await expect(bar).toHaveAttribute('aria-valuenow', '30');
  await expect(bar).not.toHaveClass(/mdc-linear-progress--indeterminate/);

  const primary = bar.locator('.mdc-linear-progress__primary-bar');
  await expect(primary).toHaveAttribute('style', /scaleX\(0\.3\)/);

  const bufferBar = bar.locator('.mdc-linear-progress__buffer-bar');
  await expect(bufferBar).toHaveAttribute('style', /flex-basis:\s*65%/);

  const bufferDots = bar.locator('.mdc-linear-progress__buffer-dots');
  await expect(bufferDots).toBeAttached();
});
```

- [ ] **Step 16: Create `query.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/query — mode="query" adds .mdc-linear-progress--indeterminate class + omits aria-valuenow + no buffer-dots div', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/query/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toHaveAttribute('mode', 'query');
  await expect(bar).toHaveClass(/mdc-linear-progress--indeterminate/);
  await expect(bar).not.toHaveAttribute('aria-valuenow', /./);
  await expect(bar.locator('.mdc-linear-progress__buffer-dots')).toHaveCount(0);
});
```

- [ ] **Step 17: Create `colors.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/colors — 3 bars with distinct .mat-{primary,accent,warn} classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/colors/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bars = page.locator('mat-progress-bar');
  await expect(bars).toHaveCount(3);

  await expect(bars.nth(0)).toHaveClass(/mat-primary/);
  await expect(bars.nth(0)).toHaveAttribute('aria-valuenow', '25');
  await expect(bars.nth(1)).toHaveClass(/mat-accent/);
  await expect(bars.nth(1)).toHaveAttribute('aria-valuenow', '50');
  await expect(bars.nth(2)).toHaveClass(/mat-warn/);
  await expect(bars.nth(2)).toHaveAttribute('aria-valuenow', '75');
});
```

- [ ] **Step 18: Create `animation-end.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/animation-end — onAnimationEnd$ QRL fires on primary-bar transitionend, sets data-animation-end="fired"', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/animation-end/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toBeAttached();

  // The route flips value from 0 to 100 on mount, triggering a transition.
  // Wait for the callback to flip the marker.
  const marker = page.locator('[data-animation-end]');
  await expect(marker).toHaveAttribute('data-animation-end', 'fired', {timeout: 5000});
});
```

- [ ] **Step 19: Create `aria-labeled.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/aria-labeled — <mat-progress-bar> carries aria-label="Uploading" alongside role="progressbar"', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('role', 'progressbar');
  await expect(bar).toHaveAttribute('aria-label', 'Uploading');
  await expect(bar).toHaveAttribute('aria-valuenow', '25');
});
```

- [ ] **Step 20: Do NOT run Playwright**

Chromium install + preview server are human-managed steps. Skip execution — Task 11 documents the manual verification step.

- [ ] **Step 21: Commit**

```bash
git add \
  src/qwik-cdk-dev-app/src/root.tsx \
  src/qwik-cdk-dev-app/src/routes/index.tsx \
  src/qwik-cdk-dev-app/src/routes/mat-progress-bar/ \
  src/qwik-cdk-parity-tests/specs/material-progress-bar/
git commit -m "$(cat <<'EOF'
feat(multiple): mat-progress-bar dev-app routes (8) + Playwright parity specs (8)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 10 — Finalisation

### Task 11: SYNC.md + pipeline verification

**Reference source:** `src/qwik-material/icon/SYNC.md` (existing SYNC pattern from Icon port).

**Files:**
- Create: `src/qwik-material/progress-bar/SYNC.md`

**Interfaces:**
- Consumes: everything from Tasks 1-10.
- Produces: `SYNC.md` documenting the progress-bar port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/progress-bar/SYNC.md`**

Contents:

```markdown
# qwik-material/progress-bar sync log

Tracks the sync state between this port and `src/material/progress-bar/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, and `src/qwik-material/icon/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `progress-bar/mat-progress-bar.tsx` | `src/material/progress-bar/progress-bar.ts` (MatProgressBar component + progress-bar.html template) | ported | Directive→component$; JSX template inlined; transitionend handler moved into useVisibleTask$ (reads props at fire time) |
| `progress-bar/progress-bar-color.ts` | `src/material/progress-bar/progress-bar.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union |
| `progress-bar/progress-bar-mode.ts` | `src/material/progress-bar/progress-bar.ts` (ProgressBarMode type) | ported | Verbatim 4-value union |
| `progress-bar/progress-bar-config.ts` | `src/material/progress-bar/progress-bar.ts` (MatProgressBarDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matProgressBarConfig |
| `scss/progress-bar/progress-bar.scss` | `src/material/progress-bar/progress-bar.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — only `cdk.high-contrast` is called and `_cdk-stub.scss` defines it. Same rewrite as dialog + button + card + toolbar + badge ports. |
| `scss/progress-bar/_progress-bar-theme.scss` | `src/material/progress-bar/_progress-bar-theme.scss` | synced | byte-identical copy |
| `scss/progress-bar/_m2-progress-bar.scss` | `src/material/progress-bar/_m2-progress-bar.scss` | synced | byte-identical copy |
| `scss/progress-bar/_m3-progress-bar.scss` | `src/material/progress-bar/_m3-progress-bar.scss` | synced | byte-identical copy |
| `scss/progress-bar/progress-bar-prebuilt.scss` | (qwik-material-specific) | new | @use progress-bar.scss + M3 :root defaults matching emitted --mat-progress-bar-* references |

## Removed upstream files

- `progress-bar-module.ts` → Qwik has no module concept
- `progress-bar.html` → template inlined as JSX inside `mat-progress-bar.tsx`
- `testing/` (MatProgressBarTestingModule + harness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (see `public-api.ts`)
- `progress-bar.spec.ts` → ported to `mat-progress-bar-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-progress-bar>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation, widened to include the `mode` custom attribute (mirrors upstream's `[attr.mode]` host binding). Consistent with the CMS-parity constraint.
2. **`animationEnd: EventEmitter<{value: number}>` Output** → `onAnimationEnd$?: QRL<(value: number) => void>` prop, attached via `useVisibleTask$` + `addEventListener('transitionend')`. Filtered exactly like upstream's `_transitionendHandler`: target's classList contains `mdc-linear-progress__primary-bar` AND `mode ∈ {determinate, buffer}`.
3. **`_getAnimationsState()` `di-disabled` branch** replaced by `animationsDisabled = useContext(MAT_ANIMATIONS_DISABLED)` reading a `Signal<boolean>` from `QwikMaterialProvider`. Established at Dialog port.
4. **`.mat-progress-bar-reduced-motion` class omitted.** Upstream's constructor detects reduced-motion via `_getAnimationsState()`. The port relies on the SCSS's own `@media (prefers-reduced-motion: reduce)` selectors to handle motion-reduced rendering. No client-side matchMedia.
5. **`MAT_PROGRESS_BAR_LOCATION` context omitted.** SSR-hostile Safari SPA-nav workaround; irrelevant to Qwik's resume model.
6. **`Renderer2` / `NgZone.runOutsideAngular` / `ChangeDetectorRef` omitted.** Qwik's reactivity + `useVisibleTask$` cover the same ground.
7. **`ProgressAnimationEnd` interface omitted.** Its only field (`{value: number}`) is inlined into the QRL signature.
8. **`ThemePalette` narrowed** to `MatProgressBarColor = 'primary' | 'accent' | 'warn'`.
9. **`numberAttribute` transform omitted.** Port accepts JSX `number` and clamps at render time via top-level `clamp()`.
10. **`MAT_PROGRESS_BAR_CONFIG` folded into `QwikMaterialProvider.matProgressBarConfig`.** 8th `useContextProvider` call.
11. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatProgressBarProps` and forwarded to `<mat-progress-bar>`. Icon-precedent adjudication.
12. **`intrinsic-elements.d.ts` widens `<mat-progress-bar>` to `QwikIntrinsicElements['div'] & {mode?: string}`.** The `mode` custom attribute mirrors upstream's `[attr.mode]` host binding. Same widening pattern as Icon's `fontIcon` attr.
13. **`useVisibleTask$` transitionend handler reads live prop values via the Qwik props proxy at fire time**, not render-time-derived locals. Ensures mid-animation `mode` swaps are respected in the filter.

## Stub inventory delta

No new stubs — the progress-bar SCSS chain calls only `cdk.high-contrast`, already provided by `_cdk-stub.scss` from prior ports. No additions to any existing stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/progress-bar/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar.
```

- [ ] **Step 2: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** all 7 prebuilt CSS files emit; JS + d.ts under `dist/{dialog,button,card,toolbar,badge,icon,progress-bar}/`.
- **Vitest:** all specs pass across 7 entry-points.
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 3: Verify the class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/progress-bar/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 4: Verify no SSR globals in the progress-bar entry-point outside `useVisibleTask$`**

```bash
grep -RnE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/progress-bar/ | grep -v '\.spec\.'
```

Expected: no output. (The `addEventListener` call in mat-progress-bar.tsx is on `Element` — not on `document` / `window` — and lives inside `useVisibleTask$`; SSR safety is fine.)

- [ ] **Step 5: Verify no `isBrowser` import**

```bash
grep -RnE "from '@builder\.io/qwik/build'" src/qwik-material/progress-bar/
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/progress-bar/SYNC.md
git commit -m "$(cat <<'EOF'
docs(multiple): finalize qwik-material/progress-bar SYNC.md + pipeline verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Layout

```
src/qwik-material/
  progress-bar/
    progress-bar-color.ts              — MatProgressBarColor type (Task 3)
    progress-bar-color.spec.ts
    progress-bar-mode.ts               — MatProgressBarMode type (Task 4)
    progress-bar-mode.spec.ts
    progress-bar-config.ts             — MatProgressBarConfig + MAT_PROGRESS_BAR_CONFIG (Task 5)
    progress-bar-config.spec.ts
    mat-progress-bar.tsx               — <MatProgressBar> (Task 6)
    mat-progress-bar.spec.tsx          — smoke (Task 6)
    mat-progress-bar-scenarios.spec.tsx — upstream scenario port (Task 9)
    intrinsic-elements.d.ts            — <mat-progress-bar> JSX augmentation + mode attr (Task 1)
    public-api.ts                      — consumer-facing re-exports (Task 8)
    index.ts                           — `export * from './public-api'` (Task 1 stub / Task 8 real)
    SYNC.md                            — deviation + stub log (Task 11)
  dialog/
    qwik-material-provider.tsx         — MODIFIED in Task 7 (adds matProgressBarConfig)
    qwik-material-provider-progress-bar.spec.tsx — new spec (Task 7)
  scss/
    progress-bar/                      — 4 upstream SCSS files (progress-bar.scss with cdk-stub rewrite) + progress-bar-prebuilt.scss (Task 2)
  package.json                         — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                       — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                           — MODIFIED in Task 10 (progress-bar-prebuilt.css import)
    routes/
      index.tsx                        — MODIFIED in Task 10 (Progress bars section)
      mat-progress-bar/                — 8 new route files (Task 10)

src/qwik-cdk-parity-tests/
  specs/
    material-progress-bar/             — 8 new Playwright specs (Task 10)
```

## Per-entry-point state

The `progress-bar` entry-point becomes the seventh after `dialog` + `button` + `card` + `toolbar` + `badge` + `icon` in the qwik-material package. All seven live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` (from earlier ports) is the only intersection, extended in Task 7.

## Sync recipe

To re-sync a specific file from upstream `src/material/progress-bar/`:

1. Locate the upstream file's counterpart in the `progress-bar/SYNC.md` sync table.
2. If "synced" state: `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "synced with one deviation" state: `cp` then re-apply the recorded rewrite; verify with `diff` to catch any other upstream changes.
4. If "ported" state: manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change to the `mat-progress-bar.tsx` file, update the corresponding `.spec.tsx`.
5. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck)
- 8 dev-app routes at `/mat-progress-bar/*` render visibly in browser preview
- 8 Playwright specs pass locally when run against the built dev-app preview
- Every Playwright spec asserts on the `<mat-progress-bar>` custom-element tag AT LEAST ONCE — regression that drops the tag fails loudly
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/progress-bar/` returns nothing)
- Zero SSR-leak violations
- SYNC.md populated with all 13 deviations + stub delta
