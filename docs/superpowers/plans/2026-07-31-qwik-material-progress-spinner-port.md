# qwik-material Progress Spinner Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/progress-spinner/` (219-LOC component + 40-LOC template + 4 SCSS files + 457-LOC spec) into a `qwik-material/progress-spinner` entry-point that ships TWO components: `<MatProgressSpinner>` renders `<mat-progress-spinner>` with `mode='determinate'` default; `<MatSpinner>` renders `<mat-spinner>` with `mode='indeterminate'` default. Both share a top-level `createSpinner()` factory.

**Architecture:** Single top-level `createSpinner(hostTag, defaultMode)` factory produces both `component$`s with the two tag-specific values baked in. Component reads `MAT_PROGRESS_SPINNER_CONFIG` + `MAT_ANIMATIONS_DISABLED` from context, resolves each prop through the fallback chain, computes SVG geometry (viewBox / radius / circumference / dashoffset / stroke-width%) from `diameter` + `strokeWidth` + `value`, and renders the upstream MDC circular-progress DOM: host + 2 containers (determinate always-present + indeterminate always-present, 3 clipper divs inside) + 4 SVG copies via an internal `SpinnerCircle` helper.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./progress-spinner`. New prebuilt CSS entry: `./progress-spinner-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths in this plan are relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-07-31-qwik-material-progress-spinner-port-design.md](../specs/2026-07-31-qwik-material-progress-spinner-port-design.md). Read §2 (Public API), §3 (Internal architecture including §3.6 factory + §3.7 SpinnerCircle helper), §5 (CSS delivery), §6 (Deviations catalog) before starting any port task.
- **Material source reference:** `src/material/progress-spinner/`. Every port task names the exact source file(s) it mirrors.
- **DOM parity — custom-element tags:** upstream registers TWO selectors (`mat-progress-spinner`, `mat-spinner`) on the same class. The port ships TWO real components, each rendering a distinct tag. External CMS stylesheets may target either tag as an element selector.
- **DOM parity — class ladder:** upstream host bindings emit `mat-mdc-progress-spinner mdc-circular-progress` (static), `mat-<color>`, `_mat-animation-noopable` (when disabled), `mdc-circular-progress--indeterminate` (in indeterminate mode). The port's class ladder matches exactly.
- **DOM parity — host attributes:** `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow` (omitted in indeterminate), `tabindex="-1"`, `mode`. Plus 3 aria-* passthroughs (`aria-label` / `aria-labelledby` / `aria-describedby`) declared upfront.
- **DOM parity — host inline style:** `width: ${diameter}px`, `height: ${diameter}px`, `--mat-progress-spinner-size: ${diameter}px`, `--mat-progress-spinner-active-indicator-width: ${diameter}px`. All four MUST appear in the emitted DOM's inline style.
- **DOM parity — template:** two containers always rendered regardless of mode. Determinate container has 1 `<svg><circle/></svg>`; indeterminate container has 3 clipper divs each containing an identical `<svg><circle/></svg>`. Every container `aria-hidden="true"`.
- **qwik-cdk peer:** progress-spinner does not consume qwik-cdk at runtime.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. E.g. `progress-spinner.ts` → `mat-progress-spinner.tsx`. Component files use `.tsx`.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/progress-spinner/SYNC.md`.
- **No RxJS.**
- **No `HttpClient` / XHR access anywhere in the port.**
- **No exported classes** in the consumer surface. `progress-spinner/public-api.ts` must not contain `export class`.
- **SSR safety:** every `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` call must be inside `useVisibleTask$` OR guarded by `typeof <global> !== 'undefined'`. Do NOT use `isBrowser` from `@builder.io/qwik/build`. Progress-spinner has ZERO browser globals — it's pure computation from props.
- **No `useVisibleTask$`** required — spinner has no transitionend/animation-end callback surface (unlike Progress Bar).
- **Commit message scope:** the upstream repo's commit-msg hook does not know `qwik-material`; use scope `multiple` for every commit.
- **Pnpm version:** the repo pins `pnpm@11.7.0`. Don't change it.
- **Node version:** pinned via `.nvmrc`. Don't change it.
- **No Bazel changes.**
- **No upstream CI integration.**
- **Class-list cast pattern (established across all prior ports):** use `.filter(Boolean) as string[]`. The type `(string | ReadonlyArray<string>)[]` fails typecheck against Qwik's `ClassList` type.
- **Top-level helper functions (Rollup safety):** all computation helpers (`clampValue`, `circleRadius`, `viewBoxSide`, `strokeCircumference`, `strokeDashOffset`, `circleStrokeWidthPct`) MUST be top-level functions. Precedent: Badge Task 5's inline `_idSeq++` triggered a Rollup "Illegal reassignment of import" error.
- **Spec files use smoke variant:** every prior port confirmed `createDOM(<component$/>)` hangs the Qwik optimizer worker. Progress-spinner `.spec.tsx` files use module-import assertions. Real DOM assertions live in Task 10's Playwright parity specs.
- **`stroke-dashoffset` conditional emission:** in determinate mode the determinate circle's inline style INCLUDES `stroke-dashoffset: ${dashOffset}px`; in indeterminate mode it OMITS the property entirely (Qwik drops `undefined` values from style objects). Matches upstream's `[style.stroke-dashoffset.px]="_strokeDashOffset()"` where `_strokeDashOffset()` returns `null` in indeterminate mode.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `progress-spinner` entry-point into the existing qwik-material package

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from earlier ports).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/progress-spinner/intrinsic-elements.d.ts`
- Create: `src/qwik-material/progress-spinner/index.ts` (empty stub — Task 8 replaces)

**Interfaces:**
- Consumes: existing package scaffolding.
- Produces: `pnpm -C src/qwik-material build` still succeeds (existing 7 prebuilt CSS files still emit; no progress-spinner CSS yet). Type resolution for `@angular-community/qwik-material/progress-spinner` returns an empty module. Both `<mat-progress-spinner>` and `<mat-spinner>` are legal JSX elements with an accepted `mode` string attribute.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./progress-spinner` after `./progress-bar`, and `./progress-spinner-prebuilt.css` after `./progress-bar-prebuilt.css`. Final relevant block:

```json
"./progress-bar": {
  "qwik": "./progress-bar/index.ts",
  "types": "./dist/progress-bar/index.d.ts",
  "import": "./dist/progress-bar/index.js"
},
"./progress-spinner": {
  "qwik": "./progress-spinner/index.ts",
  "types": "./dist/progress-spinner/index.d.ts",
  "import": "./dist/progress-spinner/index.js"
},
"./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
"./button-prebuilt.css": "./dist/button-prebuilt.css",
"./card-prebuilt.css": "./dist/card-prebuilt.css",
"./toolbar-prebuilt.css": "./dist/toolbar-prebuilt.css",
"./badge-prebuilt.css": "./dist/badge-prebuilt.css",
"./icon-prebuilt.css": "./dist/icon-prebuilt.css",
"./progress-bar-prebuilt.css": "./dist/progress-bar-prebuilt.css",
"./progress-spinner-prebuilt.css": "./dist/progress-spinner-prebuilt.css",
"./scss/*": "./scss/*"
```

- [ ] **Step 2: Extend `src/qwik-material/vite.config.ts` `entries` array + `sassEntries` list**

Read the file. `entries` currently reads `['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar']`. Append `'progress-spinner'`:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar', 'progress-spinner'];
```

`sassEntries` currently ends with `['scss/progress-bar/progress-bar-prebuilt.scss', 'dist/progress-bar-prebuilt.css']`. Append the progress-spinner pair:

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
];
```

- [ ] **Step 3: Create `src/qwik-material/progress-spinner/intrinsic-elements.d.ts`**

Both `<mat-progress-spinner>` and `<mat-spinner>` custom-element tags are used inline as block-level indicators. Type BOTH as `QwikIntrinsicElements['div']` and widen with a `mode` custom attribute (mirrors upstream's `[attr.mode]` host binding; without this the port's own component would fail typecheck on `mode={mode}` — same pattern as Progress Bar Task 1's `mode` widening and Icon Task 5's `fontIcon` widening). Contents:

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Progress Spinner's custom-element
 * tag names. Upstream renders <mat-progress-spinner> AND <mat-spinner> as actual
 * custom elements with a reflected `mode` attribute; external CMS styles may
 * target either tag directly (not just the .mat-mdc-progress-spinner class).
 * See design spec
 * docs/superpowers/specs/2026-07-31-qwik-material-progress-spinner-port-design.md
 * §3.1 + §6 deviation #13.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-progress-spinner': QwikIntrinsicElements['div'] & {mode?: string};
      'mat-spinner': QwikIntrinsicElements['div'] & {mode?: string};
    }
  }
}
```

- [ ] **Step 4: Create `src/qwik-material/progress-spinner/index.ts`** (empty stub)

Contents:

```ts
export {};
```

Task 8 replaces this with `export * from './public-api';`.

- [ ] **Step 5: Run the build to confirm the stub compiles**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. The dts plugin generates `dist/progress-spinner/index.d.ts` with `export {};`. The Sass pipeline logs a `skipping scss/progress-spinner/progress-spinner-prebuilt.scss — not yet present.` warning (ENOENT-tolerant guard); this is EXPECTED — Task 2 creates the SCSS file. Confirm the existing 7 prebuilt CSS files still emit:

```bash
ls src/qwik-material/dist/*.css
```

Expected: `dialog-prebuilt.css`, `button-prebuilt.css`, `card-prebuilt.css`, `toolbar-prebuilt.css`, `badge-prebuilt.css`, `icon-prebuilt.css`, `progress-bar-prebuilt.css`. NOT `progress-spinner-prebuilt.css` yet.

`ls src/qwik-material/dist/progress-spinner/`:

```bash
ls src/qwik-material/dist/progress-spinner/
```

Expected: `index.d.ts`, `index.js`, `index.js.map`. `dist/progress-spinner/index.d.ts` contents: `export {};`.

- [ ] **Step 6: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. The `intrinsic-elements.d.ts` from Step 3 makes both `<mat-progress-spinner>` and `<mat-spinner>` legal JSX elements with a `mode` string attribute.

- [ ] **Step 7: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/progress-spinner/intrinsic-elements.d.ts \
  src/qwik-material/progress-spinner/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): wire qwik-material/progress-spinner entry-point + <mat-progress-spinner>/<mat-spinner> JSX augmentation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SCSS + prebuilt CSS

### Task 2: Copy Progress Spinner SCSS + `@angular/cdk` rewrite + iterative `:root` variable-name verification + prebuilt CSS

**Reference source:** `src/material/progress-spinner/*.scss` (4 files, ~379 total LOC). `progress-spinner.scss` has `@use '@angular/cdk';` at line 1 (grep-confirmed) with `cdk.high-contrast` calls at 2 sites (grep-confirmed). Applies the established `@use '../cdk-stub' as cdk` rewrite (same as Dialog / Button / Card / Toolbar / Badge / Progress Bar). The 3 partials are byte-identical copies.

**Files:**
- Create: `src/qwik-material/scss/progress-spinner/progress-spinner.scss` (copy with `@use '@angular/cdk'` → `@use '../cdk-stub' as cdk` rewrite)
- Create: `src/qwik-material/scss/progress-spinner/_progress-spinner-theme.scss` (byte-identical)
- Create: `src/qwik-material/scss/progress-spinner/_m2-progress-spinner.scss` (byte-identical)
- Create: `src/qwik-material/scss/progress-spinner/_m3-progress-spinner.scss` (byte-identical)
- Create: `src/qwik-material/scss/progress-spinner/progress-spinner-prebuilt.scss` (new — `@use` + `:root` M3 defaults)

**Interfaces:**
- Consumes: existing SCSS ecosystem — the sass compiler picks up `scss/progress-spinner/progress-spinner-prebuilt.scss` from Task 1's vite.config.ts change. `_cdk-stub.scss` from prior ports already provides `high-contrast`.
- Produces: `dist/progress-spinner-prebuilt.css` after `pnpm -C src/qwik-material build`. Every `--mat-progress-spinner-*` and `--mat-sys-*` reference emitted by the compiled CSS has a matching `:root` declaration.

- [ ] **Step 1: Byte-identical copy of the 3 partial SCSS files**

```bash
cp src/material/progress-spinner/_progress-spinner-theme.scss src/qwik-material/scss/progress-spinner/_progress-spinner-theme.scss
cp src/material/progress-spinner/_m2-progress-spinner.scss    src/qwik-material/scss/progress-spinner/_m2-progress-spinner.scss
cp src/material/progress-spinner/_m3-progress-spinner.scss    src/qwik-material/scss/progress-spinner/_m3-progress-spinner.scss
```

Verify byte-identical:

```bash
diff -q src/material/progress-spinner/_progress-spinner-theme.scss src/qwik-material/scss/progress-spinner/_progress-spinner-theme.scss
diff -q src/material/progress-spinner/_m2-progress-spinner.scss    src/qwik-material/scss/progress-spinner/_m2-progress-spinner.scss
diff -q src/material/progress-spinner/_m3-progress-spinner.scss    src/qwik-material/scss/progress-spinner/_m3-progress-spinner.scss
```

Expected: no output on any (empty stdout for each).

- [ ] **Step 2: Copy `progress-spinner.scss` with the `@angular/cdk` rewrite**

```bash
cp src/material/progress-spinner/progress-spinner.scss src/qwik-material/scss/progress-spinner/progress-spinner.scss
```

Then edit `src/qwik-material/scss/progress-spinner/progress-spinner.scss` — replace line 1 exactly:

```
-@use '@angular/cdk';
+@use '../cdk-stub' as cdk;
```

Verify only that line changed:

```bash
diff src/material/progress-spinner/progress-spinner.scss src/qwik-material/scss/progress-spinner/progress-spinner.scss
```

Expected: exactly the one-line replacement above, no other lines changed.

Verify all `cdk.*` calls in the rewritten file resolve to symbols in `_cdk-stub.scss`:

```bash
grep -nE "cdk\." src/qwik-material/scss/progress-spinner/progress-spinner.scss
```

Expected: only `cdk.high-contrast` calls (2 sites — `_cdk-stub.scss` from prior ports defines it). If any other `cdk.` symbol appears, STOP and report BLOCKED.

- [ ] **Step 3: Create the initial `src/qwik-material/scss/progress-spinner/progress-spinner-prebuilt.scss`**

Start with a candidate `:root` block based on the tokens `_m3-progress-spinner.scss` + `progress-spinner.scss` reference. This is a CANDIDATE — Step 5 iterates. Contents:

```scss
// Progress spinner prebuilt CSS. Wraps the port's progress-spinner.scss with
// :root defaults for every --mat-progress-spinner-* variable it emits. See
// design spec §5.

@use './progress-spinner';

:root {
  // M3 sys-color tokens.
  --mat-sys-primary: #6750a4;

  // Progress-spinner-specific tokens (emitted by _m3-progress-spinner.scss +
  // progress-spinner.scss inline structural defaults).
  --mat-progress-spinner-size: 48px;
  --mat-progress-spinner-active-indicator-width: 4px;
  --mat-progress-spinner-active-indicator-color: var(--mat-sys-primary, #6750a4);
  --mat-progress-spinner-animation-multiplier: 1;
}
```

Sass syntax note: `@use './progress-spinner';` MUST come before the `:root` block (Sass requires `@use` first). The candidate above already places `@use` first — do NOT reorder.

- [ ] **Step 4: Run the build to emit `dist/progress-spinner-prebuilt.css`**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. `dist/progress-spinner-prebuilt.css` present:

```bash
ls src/qwik-material/dist/progress-spinner-prebuilt.css
```

Expected: file listed.

- [ ] **Step 5: Grep the emitted CSS for every `--mat-*` reference and reconcile against the `:root` block**

The KEY step. The candidate is a plan-author's guess; the compiled CSS is the source of truth (Icon Task 2 precedent — plan said `--mat-icon-icon-color` but real emitted was `--mat-icon-color`; Progress Bar Task 2 discovered `--mat-progress-bar-animation-multiplier` + `--mat-sys-corner-none` beyond the candidate).

```bash
# What the compiled CSS actually references
grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/progress-spinner-prebuilt.css | sort -u
```

Compare to what the `:root` block declares:

```bash
grep -oE '^\s*--mat-[a-z-]+' src/qwik-material/scss/progress-spinner/progress-spinner-prebuilt.scss | sort -u
```

For every `var(--mat-*)` reference NOT covered by a `:root` line:
- Look up the token in `src/material/core/tokens/m3/_md-sys-color.scss` (for `--mat-sys-color-*`), `_md-sys-typescale.scss`, `_md-sys-shape.scss`, or `_m3-progress-spinner.scss` itself.
- Add a `:root` declaration with the correct M3 default. Prefer `var(--mat-sys-<upstream-name>, <literal-fallback>)` wrap; if no sys equivalent, use the literal M3 value.

For every `:root` declaration NOT actually referenced: remove it (phantom variable).

Rebuild after every edit until the diff is empty:

```bash
diff \
  <(grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/progress-spinner-prebuilt.css | sed 's/var(//' | sort -u) \
  <(grep -oE '^\s*--mat-[a-z-]+' src/qwik-material/scss/progress-spinner/progress-spinner-prebuilt.scss | sed 's/^\s*//' | sort -u)
```

Expected: no output.

- [ ] **Step 6: Confirm the `.mat-mdc-progress-spinner` and `.mdc-circular-progress` structural rules survived**

```bash
grep -cE "^\.mat-mdc-progress-spinner|^\.mdc-circular-progress" src/qwik-material/dist/progress-spinner-prebuilt.css
```

Expected: at least `2` (top-level `.mat-mdc-progress-spinner` block + `.mdc-circular-progress` block + potentially more via `--indeterminate`, `__determinate-container`, `__indeterminate-container`, `__spinner-layer`, etc.). Higher is fine.

- [ ] **Step 7: Confirm existing 7 prebuilt CSS files still emit**

```bash
ls src/qwik-material/dist/*.css
```

Expected: 8 files (dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner).

- [ ] **Step 8: Commit**

```bash
git add \
  src/qwik-material/scss/progress-spinner/progress-spinner.scss \
  src/qwik-material/scss/progress-spinner/_progress-spinner-theme.scss \
  src/qwik-material/scss/progress-spinner/_m2-progress-spinner.scss \
  src/qwik-material/scss/progress-spinner/_m3-progress-spinner.scss \
  src/qwik-material/scss/progress-spinner/progress-spinner-prebuilt.scss
git commit -m "$(cat <<'EOF'
feat(multiple): copy Progress Spinner SCSS chain + progress-spinner-prebuilt.css defaults

3 upstream partial .scss files copied byte-identical (_progress-spinner-theme,
_m2-progress-spinner, _m3-progress-spinner). progress-spinner.scss copied
with one deviation: @use '@angular/cdk' rewritten to @use '../cdk-stub' as
cdk — same rewrite as dialog/button/card/toolbar/badge/progress-bar ports.
Only cdk.high-contrast is called (2 sites), already provided by existing
_cdk-stub.scss.

progress-spinner-prebuilt.scss adds :root defaults for every
--mat-progress-spinner-* and --mat-sys-* variable the compiled CSS
references. Verified by grepping dist/progress-spinner-prebuilt.css and
reconciling against the :root block until the diff is empty.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Types

### Task 3: `MatProgressSpinnerColor` type file

**Reference source:** `src/material/progress-spinner/progress-spinner.ts:19` (ThemePalette import) + line 72's `mat-<color>` class binding.

**Files:**
- Create: `src/qwik-material/progress-spinner/progress-spinner-color.ts`
- Create: `src/qwik-material/progress-spinner/progress-spinner-color.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MatProgressSpinnerColor` type — narrowed 3-value union.

- [ ] **Step 1: Create `src/qwik-material/progress-spinner/progress-spinner-color.ts`**

Contents:

```ts
/**
 * MatProgressSpinner color variants applied via the `.mat-<color>` class.
 * Narrowed from upstream's ThemePalette (see
 * src/material/progress-spinner/progress-spinner.ts:19) to the three values
 * Angular Material actually uses for progress spinners.
 */
export type MatProgressSpinnerColor = 'primary' | 'accent' | 'warn';
```

- [ ] **Step 2: Create `src/qwik-material/progress-spinner/progress-spinner-color.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import type {MatProgressSpinnerColor} from './progress-spinner-color';

describe('MatProgressSpinnerColor', () => {
  it('accepts the three documented values', () => {
    const a: MatProgressSpinnerColor = 'primary';
    const b: MatProgressSpinnerColor = 'accent';
    const c: MatProgressSpinnerColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test progress-spinner/progress-spinner-color
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/progress-spinner/progress-spinner-color.ts src/qwik-material/progress-spinner/progress-spinner-color.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatProgressSpinnerColor type (primary | accent | warn)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `MatProgressSpinnerMode` type file

**Reference source:** `src/material/progress-spinner/progress-spinner.ts:23` (ProgressSpinnerMode type).

**Files:**
- Create: `src/qwik-material/progress-spinner/progress-spinner-mode.ts`
- Create: `src/qwik-material/progress-spinner/progress-spinner-mode.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MatProgressSpinnerMode` type — verbatim 2-value union.

- [ ] **Step 1: Create `src/qwik-material/progress-spinner/progress-spinner-mode.ts`**

Contents:

```ts
/**
 * MatProgressSpinner mode. Verbatim port of upstream's ProgressSpinnerMode
 * (src/material/progress-spinner/progress-spinner.ts:23).
 *
 *   determinate  — value-driven arc via stroke-dasharray/stroke-dashoffset
 *   indeterminate — continuous rotation via CSS keyframes, aria-valuenow omitted
 */
export type MatProgressSpinnerMode = 'determinate' | 'indeterminate';
```

- [ ] **Step 2: Create `src/qwik-material/progress-spinner/progress-spinner-mode.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import type {MatProgressSpinnerMode} from './progress-spinner-mode';

describe('MatProgressSpinnerMode', () => {
  it('accepts the two documented values', () => {
    const a: MatProgressSpinnerMode = 'determinate';
    const b: MatProgressSpinnerMode = 'indeterminate';
    expect([a, b]).toEqual(['determinate', 'indeterminate']);
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test progress-spinner/progress-spinner-mode
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/progress-spinner/progress-spinner-mode.ts src/qwik-material/progress-spinner/progress-spinner-mode.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatProgressSpinnerMode type (determinate | indeterminate)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Config token

### Task 5: `MatProgressSpinnerConfig` + `MAT_PROGRESS_SPINNER_CONFIG` context token

**Reference source:** `src/material/progress-spinner/progress-spinner.ts:26-51` (MatProgressSpinnerDefaultOptions interface + MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS injection token).

**Files:**
- Create: `src/qwik-material/progress-spinner/progress-spinner-config.ts`
- Create: `src/qwik-material/progress-spinner/progress-spinner-config.spec.ts`

**Interfaces:**
- Consumes: `MatProgressSpinnerColor` from Task 3.
- Produces:
  - `interface MatProgressSpinnerConfig { color?: MatProgressSpinnerColor; diameter?: number; strokeWidth?: number; }`
  - `const MAT_PROGRESS_SPINNER_CONFIG: ContextId<MatProgressSpinnerConfig>` with id `'qwik-material/progress-spinner-config'`

- [ ] **Step 1: Create `src/qwik-material/progress-spinner/progress-spinner-config.ts`**

Contents:

```ts
import {createContextId} from '@builder.io/qwik';
import type {MatProgressSpinnerColor} from './progress-spinner-color';

/**
 * Defaults applied to every <MatProgressSpinner> / <MatSpinner> in a subtree.
 * Consumers provide this via <QwikMaterialProvider matProgressSpinnerConfig={...}>.
 * Mirrors upstream MatProgressSpinnerDefaultOptions
 * (src/material/progress-spinner/progress-spinner.ts:26-44), minus the obscure
 * `_forceAnimations` DI toggle (§6 deviation #5).
 */
export interface MatProgressSpinnerConfig {
  /** Default M2 palette color. Adds the `.mat-<color>` class if set. */
  color?: MatProgressSpinnerColor;
  /** Default pixel diameter of the spinner. Falls back to 100 at render time. */
  diameter?: number;
  /** Default pixel stroke width. Falls back to diameter / 10 at render time. */
  strokeWidth?: number;
}

/**
 * Context id used by <MatProgressSpinner> and <MatSpinner> to read config. The
 * id string is exposed publicly and MUST remain stable across releases —
 * consumers may inject it directly in advanced scenarios.
 */
export const MAT_PROGRESS_SPINNER_CONFIG = createContextId<MatProgressSpinnerConfig>(
  'qwik-material/progress-spinner-config',
);
```

- [ ] **Step 2: Create `src/qwik-material/progress-spinner/progress-spinner-config.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import {MAT_PROGRESS_SPINNER_CONFIG, type MatProgressSpinnerConfig} from './progress-spinner-config';

describe('MAT_PROGRESS_SPINNER_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_PROGRESS_SPINNER_CONFIG.id).toBe('qwik-material/progress-spinner-config');
  });

  it('MatProgressSpinnerConfig accepts an empty object', () => {
    const cfg: MatProgressSpinnerConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatProgressSpinnerConfig accepts every documented field', () => {
    const cfg: MatProgressSpinnerConfig = {color: 'accent', diameter: 40, strokeWidth: 3};
    expect(cfg.color).toBe('accent');
    expect(cfg.diameter).toBe(40);
    expect(cfg.strokeWidth).toBe(3);
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test progress-spinner/progress-spinner-config
```

Expected: 3/3 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/progress-spinner/progress-spinner-config.ts src/qwik-material/progress-spinner/progress-spinner-config.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatProgressSpinnerConfig + MAT_PROGRESS_SPINNER_CONFIG context token

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Component

### Task 6: `<MatProgressSpinner>` + `<MatSpinner>` components via shared `createSpinner()` factory

**Reference source:** `src/material/progress-spinner/progress-spinner.ts:63-219` (component + host bindings + computed getters + template) + `src/material/progress-spinner/progress-spinner.html` (5-div template with 4 SVG copies).

**Files:**
- Create: `src/qwik-material/progress-spinner/mat-progress-spinner.tsx`
- Create: `src/qwik-material/progress-spinner/mat-progress-spinner.spec.tsx`

**Interfaces:**
- Consumes:
  - `MatProgressSpinnerColor` (Task 3)
  - `MatProgressSpinnerMode` (Task 4)
  - `MAT_PROGRESS_SPINNER_CONFIG` + `MatProgressSpinnerConfig` (Task 5)
  - `MAT_ANIMATIONS_DISABLED` from `../dialog/mat-dialog-tokens` (established at Dialog port — a `Signal<boolean>`)
- Produces:
  - `interface MatProgressSpinnerProps` — 10 optional fields per spec §2.3
  - `type MatSpinnerProps = MatProgressSpinnerProps`
  - `const MatProgressSpinner: Component<MatProgressSpinnerProps>` (renders `<mat-progress-spinner>`, default `mode='determinate'`)
  - `const MatSpinner: Component<MatSpinnerProps>` (renders `<mat-spinner>`, default `mode='indeterminate'`)

- [ ] **Step 1: Create `src/qwik-material/progress-spinner/mat-progress-spinner.tsx`**

Contents (implements spec §3 in full — factory + geometry helpers + SpinnerCircle internal component + both exports):

```tsx
import {component$, useContext, type Component, type FunctionComponent} from '@builder.io/qwik';
import type {MatProgressSpinnerColor} from './progress-spinner-color';
import type {MatProgressSpinnerMode} from './progress-spinner-mode';
import {
  MAT_PROGRESS_SPINNER_CONFIG,
  type MatProgressSpinnerConfig,
} from './progress-spinner-config';
import {MAT_ANIMATIONS_DISABLED} from '../dialog/mat-dialog-tokens';

/**
 * Props for <MatProgressSpinner> and <MatSpinner>. Both components accept the
 * same surface; they differ only in host tag and default mode. See design spec
 * §2.3 for prop docs and §3 for rendered DOM shape.
 */
export interface MatProgressSpinnerProps {
  /** Progress percentage 0-100 (clamped). Ignored in indeterminate mode. */
  value?: number;
  /** Pixel diameter. Defaults to config.diameter, then 100. */
  diameter?: number;
  /** Pixel stroke width. Defaults to config.strokeWidth, then diameter / 10. */
  strokeWidth?: number;
  color?: MatProgressSpinnerColor;
  /** Explicit mode. Overrides the component's per-tag default. */
  mode?: MatProgressSpinnerMode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/** MatSpinner accepts the same props — it's a real component with a different tag + default mode. */
export type MatSpinnerProps = MatProgressSpinnerProps;

const BASE_SIZE = 100;
const BASE_STROKE_WIDTH = 10;
const DEFAULTS: MatProgressSpinnerConfig = {};

function clampValue(v: number): number {
  return Math.max(0, Math.min(100, v || 0));
}

function circleRadius(diameter: number): number {
  return (diameter - BASE_STROKE_WIDTH) / 2;
}

function viewBoxSide(diameter: number, strokeWidth: number): number {
  return circleRadius(diameter) * 2 + strokeWidth;
}

function strokeCircumference(diameter: number): number {
  return 2 * Math.PI * circleRadius(diameter);
}

function strokeDashOffset(diameter: number, value: number): number {
  return (strokeCircumference(diameter) * (100 - value)) / 100;
}

function circleStrokeWidthPct(diameter: number, strokeWidth: number): number {
  return (strokeWidth / diameter) * 100;
}

interface SpinnerCircleProps {
  variant: 'determinate' | 'indeterminate';
  viewBox: string;
  radius: number;
  circumference: number;
  /** stroke-dashoffset in px; omitted from inline style when undefined. */
  dashOffset: number | undefined;
  strokeWidthPct: number;
}

/**
 * Internal reusable <svg><circle/></svg>. Replaces upstream's <ng-template
 * #circle> shared template (§6 deviation #6). Rendered 4× per <MatProgressSpinner>
 * instance (1 determinate + 3 indeterminate clippers).
 */
const SpinnerCircle = component$<SpinnerCircleProps>(props => {
  const svgClass =
    props.variant === 'determinate'
      ? 'mdc-circular-progress__determinate-circle-graphic'
      : 'mdc-circular-progress__indeterminate-circle-graphic';
  const circleClass =
    props.variant === 'determinate' ? 'mdc-circular-progress__determinate-circle' : undefined;

  // Build the circle's inline style object. Omit stroke-dashoffset when undefined
  // so Qwik drops it from the emitted DOM (matches upstream's null handling).
  const circleStyle: Record<string, string> = {
    strokeDasharray: `${props.circumference}px`,
    strokeWidth: `${props.strokeWidthPct}%`,
  };
  if (props.dashOffset !== undefined) {
    circleStyle.strokeDashoffset = `${props.dashOffset}px`;
  }

  return (
    <svg
      viewBox={props.viewBox}
      class={svgClass}
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <circle r={props.radius} style={circleStyle} class={circleClass} cx="50%" cy="50%" />
    </svg>
  );
});

function createSpinner(
  hostTag: 'mat-progress-spinner' | 'mat-spinner',
  defaultMode: MatProgressSpinnerMode,
): Component<MatProgressSpinnerProps> {
  return component$<MatProgressSpinnerProps>(props => {
    const config = useContext(MAT_PROGRESS_SPINNER_CONFIG, DEFAULTS);
    const animationsDisabled = useContext(MAT_ANIMATIONS_DISABLED);

    const color = props.color ?? config.color ?? 'primary';
    const mode = props.mode ?? defaultMode;
    const diameter = props.diameter ?? config.diameter ?? BASE_SIZE;
    const strokeWidth = props.strokeWidth ?? config.strokeWidth ?? diameter / 10;
    const value = clampValue(props.value ?? 0);

    const isIndeterminate = mode === 'indeterminate';
    const noopable = animationsDisabled.value;
    const vb = viewBoxSide(diameter, strokeWidth);
    const viewBox = `0 0 ${vb} ${vb}`;
    const radius = circleRadius(diameter);
    const circumference = strokeCircumference(diameter);
    const determinateDashOffset = isIndeterminate
      ? undefined
      : strokeDashOffset(diameter, value);
    const indeterminateDashOffset = circumference / 2;
    const strokeWidthPct = circleStrokeWidthPct(diameter, strokeWidth);

    const classes = [
      'mat-mdc-progress-spinner',
      'mdc-circular-progress',
      `mat-${color}`,
      noopable && '_mat-animation-noopable',
      isIndeterminate && 'mdc-circular-progress--indeterminate',
      props.class,
    ].filter(Boolean) as string[];

    // Render the dynamic host tag via a FunctionComponent-typed alias.
    // See implementer note in the plan brief.
    const HostTag = hostTag as unknown as FunctionComponent<Record<string, unknown>>;

    return (
      <HostTag
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
        style={{
          width: `${diameter}px`,
          height: `${diameter}px`,
          '--mat-progress-spinner-size': `${diameter}px`,
          '--mat-progress-spinner-active-indicator-width': `${diameter}px`,
        }}
      >
        <div class="mdc-circular-progress__determinate-container" aria-hidden="true">
          <SpinnerCircle
            variant="determinate"
            viewBox={viewBox}
            radius={radius}
            circumference={circumference}
            dashOffset={determinateDashOffset}
            strokeWidthPct={strokeWidthPct}
          />
        </div>
        <div class="mdc-circular-progress__indeterminate-container" aria-hidden="true">
          <div class="mdc-circular-progress__spinner-layer">
            <div class="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-left">
              <SpinnerCircle
                variant="indeterminate"
                viewBox={viewBox}
                radius={radius}
                circumference={circumference}
                dashOffset={indeterminateDashOffset}
                strokeWidthPct={strokeWidthPct}
              />
            </div>
            <div class="mdc-circular-progress__gap-patch">
              <SpinnerCircle
                variant="indeterminate"
                viewBox={viewBox}
                radius={radius}
                circumference={circumference}
                dashOffset={indeterminateDashOffset}
                strokeWidthPct={strokeWidthPct}
              />
            </div>
            <div class="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-right">
              <SpinnerCircle
                variant="indeterminate"
                viewBox={viewBox}
                radius={radius}
                circumference={circumference}
                dashOffset={indeterminateDashOffset}
                strokeWidthPct={strokeWidthPct}
              />
            </div>
          </div>
        </div>
      </HostTag>
    );
  });
}

/** Renders <mat-progress-spinner>; `mode` defaults to 'determinate'. */
export const MatProgressSpinner = createSpinner('mat-progress-spinner', 'determinate');

/** Renders <mat-spinner>; `mode` defaults to 'indeterminate'. Non-deprecated alias per upstream. */
export const MatSpinner = createSpinner('mat-spinner', 'indeterminate');
```

Notes for the implementer:

- **All computation helpers are top-level pure functions.** Do NOT inline `Math.max(...Math.min(...))` inside `component$` or the factory — Rollup safety precedent from Badge Task 5.
- **The `HostTag` cast pattern.** Qwik's JSX doesn't natively accept a dynamic tag-name string. The `FunctionComponent<Record<string, unknown>>` cast works because Qwik processes function-typed JSX identifiers as components. If typecheck FAILS on the `<HostTag>` usage, fall back to hard-coding two return blocks (one per component export, ~30 LOC extra). Log the outcome in the report; if you take the fallback, note it as a scope-clean deviation from spec §3.6's factory sketch.
- **`stroke-dashoffset` conditional emission.** The `SpinnerCircle` helper builds its inline style object conditionally — only including `strokeDashoffset` when `dashOffset !== undefined`. This matches upstream's `[style.stroke-dashoffset.px]="_strokeDashOffset()"` where `null` omits the property. Verify by inspecting the emitted DOM at Task 10 that the indeterminate mode's determinate circle has NO `stroke-dashoffset` in its inline style.
- **Both containers ALWAYS render.** Do NOT wrap either in `{!isIndeterminate && ...}` or `{isIndeterminate && ...}`. Upstream renders both unconditionally; CSS toggles visibility via the `mdc-circular-progress--indeterminate` class.
- **CSS custom properties in the style object.** `'--mat-progress-spinner-size'` and `'--mat-progress-spinner-active-indicator-width'` are legit CSS custom-property keys. Qwik accepts them in the style object as string-key entries.

- [ ] **Step 2: Create `src/qwik-material/progress-spinner/mat-progress-spinner.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatProgressSpinner, MatSpinner} from './mat-progress-spinner';

describe('MatProgressSpinner / MatSpinner (smoke)', () => {
  it('MatProgressSpinner is exported and is a function-shaped component', () => {
    expect(MatProgressSpinner).toBeDefined();
    expect(typeof MatProgressSpinner).toBe('function');
  });

  it('MatSpinner is exported and is a function-shaped component', () => {
    expect(MatSpinner).toBeDefined();
    expect(typeof MatSpinner).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test progress-spinner/mat-progress-spinner
```

Expected: 2/2 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. Task 1's `intrinsic-elements.d.ts` makes both `<mat-progress-spinner>` and `<mat-spinner>` legal JSX elements with `mode` attribute.

If the `HostTag` cast pattern fails typecheck with a Qwik JSX intrinsics error, apply the fallback (two hard-coded return blocks, one per component) and document the reason in the report.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/progress-spinner/mat-progress-spinner.tsx
```

Expected: no matches.

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/progress-spinner/mat-progress-spinner.tsx
```

Expected: no matches (`isBrowser` import banned per Global Constraints).

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/progress-spinner/mat-progress-spinner.tsx src/qwik-material/progress-spinner/mat-progress-spinner.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatProgressSpinner + MatSpinner components via createSpinner factory

Both components share a top-level createSpinner(hostTag, defaultMode) factory
that produces the component$ with the tag-specific values baked in.
MatProgressSpinner renders <mat-progress-spinner> with mode='determinate'
default; MatSpinner renders <mat-spinner> with mode='indeterminate' default.
Internal SpinnerCircle helper replaces upstream's <ng-template #circle>. All
geometry helpers are top-level pure functions. Zero SSR-global access, no
useVisibleTask$ needed (spinner has no callback surface).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Provider extension

### Task 7: Extend `<QwikMaterialProvider>` with `matProgressSpinnerConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (currently ships 8 `useContextProvider` calls after Progress Bar). Adding progress-spinner makes it 9.

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-progress-spinner.spec.tsx`

**Interfaces:**
- Consumes: `MatProgressSpinnerConfig` + `MAT_PROGRESS_SPINNER_CONFIG` from Task 5.
- Produces: an extended `QwikMaterialProviderProps.matProgressSpinnerConfig?: MatProgressSpinnerConfig` field + a 9th `useContextProvider(MAT_PROGRESS_SPINNER_CONFIG, ...)` call. All 8 pre-existing provider calls unchanged.

- [ ] **Step 1: Extend the imports at the top of `qwik-material-provider.tsx`**

Read the file's current import block. Add two import lines after the progress-bar import block:

```tsx
import type {MatProgressSpinnerConfig} from '../progress-spinner/progress-spinner-config';
import {MAT_PROGRESS_SPINNER_CONFIG} from '../progress-spinner/progress-spinner-config';
```

- [ ] **Step 2: Extend `QwikMaterialProviderProps` with the `matProgressSpinnerConfig?` field**

Append to the interface body (after `matProgressBarConfig`), with a doc comment:

```tsx
  /** Defaults applied to every MatProgressSpinner / MatSpinner in this subtree. */
  matProgressSpinnerConfig?: MatProgressSpinnerConfig;
```

- [ ] **Step 3: Add the 9th `useContextProvider` call at the end of the component body**

Append AFTER the `useContextProvider(MAT_PROGRESS_BAR_CONFIG, props.matProgressBarConfig ?? {});` line and BEFORE the `return <Slot />;`:

```tsx
  // MatProgressSpinnerConfig is a plain object with primitive fields — no noSerialize needed.
  // Spinners outside a provider get the DEFAULTS declared in createSpinner; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_PROGRESS_SPINNER_CONFIG, props.matProgressSpinnerConfig ?? {});
```

Verify all 8 pre-existing `useContextProvider` calls are untouched. Do NOT change their order or arguments.

- [ ] **Step 4: Create the provider-progress-spinner smoke spec `qwik-material-provider-progress-spinner.spec.tsx`**

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatProgressSpinnerConfig} from '../progress-spinner/progress-spinner-config';

describe('QwikMaterialProvider — matProgressSpinnerConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts a matProgressSpinnerConfig field', () => {
    const cfg: MatProgressSpinnerConfig = {color: 'accent', diameter: 40, strokeWidth: 3};
    const props: QwikMaterialProviderProps = {matProgressSpinnerConfig: cfg};
    expect(props.matProgressSpinnerConfig?.color).toBe('accent');
    expect(props.matProgressSpinnerConfig?.diameter).toBe(40);
    expect(props.matProgressSpinnerConfig?.strokeWidth).toBe(3);
  });

  it('QwikMaterialProviderProps.matProgressSpinnerConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matProgressSpinnerConfig).toBeUndefined();
  });
});
```

- [ ] **Step 5: Run the provider spec**

```bash
pnpm -C src/qwik-material test qwik-material-provider-progress-spinner
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
  src/qwik-material/dialog/qwik-material-provider-progress-spinner.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): extend QwikMaterialProvider with matProgressSpinnerConfig

Adds the 9th useContextProvider call (after MAT_PROGRESS_BAR_CONFIG). All 8
pre-existing provider calls preserved unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Public API

### Task 8: `progress-spinner/public-api.ts` + `progress-spinner/index.ts` + build verification

**Reference source:** design spec §2.5.

**Files:**
- Create: `src/qwik-material/progress-spinner/public-api.ts`
- Modify: `src/qwik-material/progress-spinner/index.ts` (was empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Tasks 3, 4, 5, 6.
- Produces: the exact public export surface consumers see when they import from `@angular-community/qwik-material/progress-spinner`.

- [ ] **Step 1: Create `src/qwik-material/progress-spinner/public-api.ts`**

Contents (matches design spec §2.5 verbatim):

```ts
// Public API for @angular-community/qwik-material/progress-spinner.
// See docs/superpowers/specs/2026-07-31-qwik-material-progress-spinner-port-design.md §2.

export type {MatProgressSpinnerColor} from './progress-spinner-color';
export type {MatProgressSpinnerMode} from './progress-spinner-mode';
export type {MatProgressSpinnerConfig} from './progress-spinner-config';
export {MAT_PROGRESS_SPINNER_CONFIG} from './progress-spinner-config';
export {
  MatProgressSpinner,
  MatSpinner,
  type MatProgressSpinnerProps,
  type MatSpinnerProps,
} from './mat-progress-spinner';
```

- [ ] **Step 2: Replace the empty stub in `src/qwik-material/progress-spinner/index.ts`**

Replace the entire file (was `export {};` from Task 1) with:

```ts
export * from './public-api';
```

- [ ] **Step 3: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. No Rollup `Illegal reassignment of import` errors (progress-spinner has no module-level mutable state — all helpers are pure functions).

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify the emitted d.ts export surface**

```bash
grep -nE "^export " src/qwik-material/dist/progress-spinner/public-api.d.ts
```

Expected: at least 5 export lines covering `MatProgressSpinnerColor`, `MatProgressSpinnerMode`, `MatProgressSpinnerConfig` (types), `MAT_PROGRESS_SPINNER_CONFIG` (value), and `MatProgressSpinner` + `MatSpinner` + `MatProgressSpinnerProps` + `MatSpinnerProps`. TypeScript may split the combined re-export into multiple emitted lines; the key check is that all listed symbols appear.

Confirm no leaked classes:

```bash
grep -nE "^export declare class" src/qwik-material/dist/progress-spinner/public-api.d.ts
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/progress-spinner/public-api.ts src/qwik-material/progress-spinner/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): finalize qwik-material/progress-spinner public API

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Vitest scenario port

### Task 9: Vitest scenario port from `src/material/progress-spinner/progress-spinner.spec.ts`

**Reference source:** `src/material/progress-spinner/progress-spinner.spec.ts` (457 LOC, ~25 upstream `it()` blocks). Most tests exercise Angular DI (`MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS`, `_getAnimationsState`, `numberAttribute` transforms) or template internals; the shipped port covers the observable behaviors via Playwright.

**Files:**
- Create: `src/qwik-material/progress-spinner/mat-progress-spinner-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 8.
- Produces: consolidated scenario coverage documenting upstream test intent.

- [ ] **Step 1: Write the scenario spec**

Contents:

```tsx
/**
 * MatProgressSpinner scenario port from
 * src/material/progress-spinner/progress-spinner.spec.ts.
 *
 * Upstream has ~25 `it()` blocks — mostly host classes/attrs + geometry
 * computation + Angular DI (MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS injection,
 * _getAnimationsState, numberAttribute transforms). Restructured:
 *
 *   - Live sanity tests (8): typeof both components + type unions +
 *     MAT_PROGRESS_SPINNER_CONFIG.id + props-shape smoke.
 *   - describe.skip DOM-rendered (15): host classes/attrs/inline-style +
 *     viewBox/stroke-dasharray/stroke-dashoffset computation + 4 SVG copies +
 *     mat-spinner tag emission + default mode per component + aria-*
 *     forwarding + value clamping + explicit mode override. Deferred to
 *     Playwright Task 10.
 *   - describe.skip Angular-only (10): NgTemplateOutlet, ViewChild,
 *     MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS DI factory, _getAnimationsState,
 *     _forceAnimations, numberAttribute, ThemePalette full union,
 *     _defaultColor mutation, providedIn:'root' factory, const-alias
 *     MatSpinner = MatProgressSpinner pattern. Deferred forever per design
 *     spec §6 deviations.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-progress-spinner/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_PROGRESS_SPINNER_CONFIG,
  MatProgressSpinner,
  MatSpinner,
  type MatProgressSpinnerColor,
  type MatProgressSpinnerConfig,
  type MatProgressSpinnerMode,
  type MatProgressSpinnerProps,
  type MatSpinnerProps,
} from './public-api';

describe('MatProgressSpinner / MatSpinner — sanity', () => {
  it('MatProgressSpinner is exported', () => {
    expect(MatProgressSpinner).toBeDefined();
    expect(typeof MatProgressSpinner).toBe('function');
  });

  it('MatSpinner is exported', () => {
    expect(MatSpinner).toBeDefined();
    expect(typeof MatSpinner).toBe('function');
  });

  it('MAT_PROGRESS_SPINNER_CONFIG carries the expected context id', () => {
    expect(MAT_PROGRESS_SPINNER_CONFIG.id).toBe('qwik-material/progress-spinner-config');
  });

  it('MatProgressSpinnerColor accepts the three documented values', () => {
    const values: MatProgressSpinnerColor[] = ['primary', 'accent', 'warn'];
    expect(values).toEqual(['primary', 'accent', 'warn']);
  });

  it('MatProgressSpinnerMode accepts both documented values', () => {
    const values: MatProgressSpinnerMode[] = ['determinate', 'indeterminate'];
    expect(values).toHaveLength(2);
  });

  it('MatProgressSpinnerConfig accepts an empty config + every documented field', () => {
    const empty: MatProgressSpinnerConfig = {};
    const full: MatProgressSpinnerConfig = {color: 'accent', diameter: 40, strokeWidth: 3};
    expect(empty).toBeDefined();
    expect(full.diameter).toBe(40);
  });

  it('MatProgressSpinnerProps accepts the numeric + geometry + color surface', () => {
    const p: MatProgressSpinnerProps = {
      value: 50,
      diameter: 40,
      strokeWidth: 3,
      color: 'accent',
      mode: 'determinate',
      'aria-label': 'Loading',
    };
    expect(p.value).toBe(50);
  });

  it('MatSpinnerProps is structurally identical to MatProgressSpinnerProps', () => {
    const p: MatSpinnerProps = {value: 25, diameter: 24};
    // Type-level: MatSpinnerProps === MatProgressSpinnerProps. Cross-assign both ways.
    const q: MatProgressSpinnerProps = p;
    const r: MatSpinnerProps = q;
    expect(r.diameter).toBe(24);
  });
});

describe.skip('MatProgressSpinner DOM-rendered scenarios — deferred to Playwright Task 10', () => {
  it('should apply .mat-mdc-progress-spinner and .mdc-circular-progress classes', () => {});
  it('should apply .mat-<color> class per color prop', () => {});
  it('should apply ._mat-animation-noopable when matAnimationsDisabled is true', () => {});
  it('should apply .mdc-circular-progress--indeterminate in indeterminate mode', () => {});
  it('should emit role="progressbar" + tabindex="-1"', () => {});
  it('should omit aria-valuenow in indeterminate mode', () => {});
  it('should emit aria-valuenow in determinate mode', () => {});
  it('should reflect mode via the `mode` attribute', () => {});
  it('should emit inline width/height/CSS-custom-property style for diameter', () => {});
  it('should compute viewBox / stroke-dasharray / stroke-dashoffset / stroke-width% from diameter+strokeWidth+value', () => {});
  it('should render 4 SVG copies (1 determinate + 3 indeterminate clippers)', () => {});
  it('should render both containers regardless of mode', () => {});
  it('should render <mat-spinner> tag when using MatSpinner', () => {});
  it('should render <mat-progress-spinner> tag when using MatProgressSpinner', () => {});
  it('should forward aria-label / aria-labelledby / aria-describedby', () => {});
});

describe.skip('MatProgressSpinner — Angular-only tests', () => {
  it('should reuse the same <ng-template #circle> across 4 render sites', () => {
    // NgTemplateOutlet omitted — §6 deviation #6 (replaced by SpinnerCircle helper).
  });
  it('should expose the determinate spinner via @ViewChild', () => {
    // ViewChild omitted — §6 deviation #7.
  });
  it('should inject MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS via DI factory', () => {
    // Config folded into QwikMaterialProvider — §6 deviation #9.
  });
  it('should read _getAnimationsState() di-disabled', () => {
    // Replaced by MAT_ANIMATIONS_DISABLED context — §6 deviation #3.
  });
  it('should apply .mat-progress-spinner-reduced-motion class via matchMedia', () => {
    // SCSS @media handles it — §6 deviation #4.
  });
  it('should honor the _forceAnimations DI toggle', () => {
    // Omitted — §6 deviation #5.
  });
  it('should transform value/diameter/strokeWidth via numberAttribute decorator', () => {
    // Port accepts JSX number — §6 deviation #8.
  });
  it('should accept arbitrary ThemePalette strings', () => {
    // Narrowed to 3-value union — §6 deviation #11.
  });
  it('should expose MatSpinner as a const alias of MatProgressSpinner', () => {
    // Port ships MatSpinner as a real distinct component — §6 deviation #12.
  });
  it('should register MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS via providedIn: "root"', () => {
    // Angular DI-specific — no equivalent needed.
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
pnpm -C src/qwik-material test progress-spinner/mat-progress-spinner-scenarios
```

Expected: 8 passing + 25 skipped, exit 0.

- [ ] **Step 3: Run the full qwik-material suite for regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-9 total + 8 passing + 25 skipped, zero failures.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/progress-spinner/mat-progress-spinner-scenarios.spec.tsx
git commit -m "$(cat <<'EOF'
test(multiple): port MatProgressSpinner scenarios from upstream progress-spinner.spec.ts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Dev-app + Playwright parity

### Task 10: 8 mat-progress-spinner dev-app routes + index tile + root.tsx CSS import + 8 Playwright parity specs

**Reference source:** existing dev-app + Playwright patterns from Progress Bar port at `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/` and `src/qwik-cdk-parity-tests/specs/material-progress-bar/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add progress-spinner-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Progress spinners" section with 8 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/determinate/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/indeterminate/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/mat-spinner-alias/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/colors/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/custom-diameter/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/custom-stroke/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/aria-labeled/index.tsx`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-spinner/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-spinner/determinate.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-spinner/indeterminate.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-spinner/mat-spinner-alias.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-spinner/colors.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-spinner/custom-diameter.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-spinner/custom-stroke.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-progress-spinner/aria-labeled.spec.ts`

**Interfaces:**
- Consumes: `@angular-community/qwik-material/progress-spinner` (Task 8).
- Produces: 8 dev-app routes + 8 Playwright specs asserting host tag + classes + attrs + inline style + inner DOM.

- [ ] **Step 1: Add the progress-spinner-prebuilt.css import to `src/qwik-cdk-dev-app/src/root.tsx`**

Read the current file. Append the progress-spinner CSS import after the progress-bar one:

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
```

- [ ] **Step 2: Add a "Progress spinners" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert after the existing "Progress bars" section:

```tsx
<section>
  <h2>Progress spinners</h2>
  <ul>
    <li><a href="/mat-progress-spinner/basic/">basic</a></li>
    <li><a href="/mat-progress-spinner/determinate/">determinate</a></li>
    <li><a href="/mat-progress-spinner/indeterminate/">indeterminate</a></li>
    <li><a href="/mat-progress-spinner/mat-spinner-alias/">mat-spinner-alias</a></li>
    <li><a href="/mat-progress-spinner/colors/">colors</a></li>
    <li><a href="/mat-progress-spinner/custom-diameter/">custom-diameter</a></li>
    <li><a href="/mat-progress-spinner/custom-stroke/">custom-stroke</a></li>
    <li><a href="/mat-progress-spinner/aria-labeled/">aria-labeled</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner value={50} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `determinate/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner mode="determinate" value={75} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `indeterminate/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner mode="indeterminate" />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create `mat-spinner-alias/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatSpinner />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `colors/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner color="primary" value={25} />
    <MatProgressSpinner color="accent" value={50} />
    <MatProgressSpinner color="warn" value={75} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create `custom-diameter/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner value={50} diameter={40} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Create `custom-stroke/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner value={50} diameter={40} strokeWidth={3} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 10: Create `aria-labeled/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner value={25} aria-label="Loading" />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 11: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Confirm client + SSR builds succeed. Verify 8 mat-progress-spinner routes in the manifest:

```bash
grep -oE 'mat-progress-spinner/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `8`.

List them explicitly:

```bash
grep -oE 'mat-progress-spinner/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u
```

Expected:
```
mat-progress-spinner/aria-labeled
mat-progress-spinner/basic
mat-progress-spinner/colors
mat-progress-spinner/custom-diameter
mat-progress-spinner/custom-stroke
mat-progress-spinner/determinate
mat-progress-spinner/indeterminate
mat-progress-spinner/mat-spinner-alias
```

- [ ] **Step 12: Create `basic.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/basic — <mat-progress-spinner> with default determinate mode, primary color, aria-valuenow=50, both containers rendered', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveClass(/mat-mdc-progress-spinner/);
  await expect(spinner).toHaveClass(/mdc-circular-progress/);
  await expect(spinner).toHaveClass(/mat-primary/);
  await expect(spinner).not.toHaveClass(/mdc-circular-progress--indeterminate/);
  await expect(spinner).toHaveAttribute('role', 'progressbar');
  await expect(spinner).toHaveAttribute('aria-valuemin', '0');
  await expect(spinner).toHaveAttribute('aria-valuemax', '100');
  await expect(spinner).toHaveAttribute('aria-valuenow', '50');
  await expect(spinner).toHaveAttribute('tabindex', '-1');
  await expect(spinner).toHaveAttribute('mode', 'determinate');

  await expect(spinner).toHaveAttribute('style', /width:\s*100px/);
  await expect(spinner).toHaveAttribute('style', /height:\s*100px/);
  await expect(spinner).toHaveAttribute('style', /--mat-progress-spinner-size:\s*100px/);

  await expect(spinner.locator('.mdc-circular-progress__determinate-container')).toBeAttached();
  await expect(spinner.locator('.mdc-circular-progress__indeterminate-container')).toBeAttached();
});
```

- [ ] **Step 13: Create `determinate.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/determinate — mode="determinate" value=75, aria-valuenow=75, determinate circle has stroke-dashoffset inline style', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/determinate/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toHaveAttribute('mode', 'determinate');
  await expect(spinner).toHaveAttribute('aria-valuenow', '75');
  await expect(spinner).not.toHaveClass(/mdc-circular-progress--indeterminate/);

  // Determinate circle carries a computed stroke-dashoffset value in its inline style.
  const determinateCircle = spinner.locator('.mdc-circular-progress__determinate-circle');
  await expect(determinateCircle).toBeAttached();
  await expect(determinateCircle).toHaveAttribute('style', /stroke-dashoffset:/);
});
```

- [ ] **Step 14: Create `indeterminate.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/indeterminate — .mdc-circular-progress--indeterminate class + no aria-valuenow + determinate circle has no stroke-dashoffset', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/indeterminate/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toHaveClass(/mdc-circular-progress--indeterminate/);
  await expect(spinner).toHaveAttribute('mode', 'indeterminate');
  await expect(spinner).not.toHaveAttribute('aria-valuenow', /./);

  // Determinate container still renders (both containers always present).
  await expect(spinner.locator('.mdc-circular-progress__determinate-container')).toBeAttached();

  // Determinate circle's inline style OMITS stroke-dashoffset in indeterminate mode.
  const determinateCircle = spinner.locator('.mdc-circular-progress__determinate-circle');
  await expect(determinateCircle).not.toHaveAttribute('style', /stroke-dashoffset:/);

  // 3 clipper divs inside the indeterminate container.
  await expect(spinner.locator('.mdc-circular-progress__circle-clipper.mdc-circular-progress__circle-left')).toBeAttached();
  await expect(spinner.locator('.mdc-circular-progress__gap-patch')).toBeAttached();
  await expect(spinner.locator('.mdc-circular-progress__circle-clipper.mdc-circular-progress__circle-right')).toBeAttached();
});
```

- [ ] **Step 15: Create `mat-spinner-alias.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/mat-spinner-alias — <mat-spinner> tag with default indeterminate mode, no aria-valuenow', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/mat-spinner-alias/`);
  await page.waitForSelector('[data-scenario-ready]');

  // Locator uses the <mat-spinner> tag specifically.
  const spinner = page.locator('mat-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveClass(/mat-mdc-progress-spinner/);
  await expect(spinner).toHaveClass(/mdc-circular-progress--indeterminate/);
  await expect(spinner).toHaveAttribute('role', 'progressbar');
  await expect(spinner).toHaveAttribute('mode', 'indeterminate');
  await expect(spinner).not.toHaveAttribute('aria-valuenow', /./);

  // The <mat-progress-spinner> tag should NOT be present on this route.
  await expect(page.locator('mat-progress-spinner')).toHaveCount(0);
});
```

- [ ] **Step 16: Create `colors.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/colors — 3 spinners with distinct .mat-{primary,accent,warn} classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/colors/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinners = page.locator('mat-progress-spinner');
  await expect(spinners).toHaveCount(3);

  await expect(spinners.nth(0)).toHaveClass(/mat-primary/);
  await expect(spinners.nth(0)).toHaveAttribute('aria-valuenow', '25');
  await expect(spinners.nth(1)).toHaveClass(/mat-accent/);
  await expect(spinners.nth(1)).toHaveAttribute('aria-valuenow', '50');
  await expect(spinners.nth(2)).toHaveClass(/mat-warn/);
  await expect(spinners.nth(2)).toHaveAttribute('aria-valuenow', '75');
});
```

- [ ] **Step 17: Create `custom-diameter.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/custom-diameter — diameter=40 reflected in inline width/height/CSS-custom-props', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/custom-diameter/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveAttribute('style', /width:\s*40px/);
  await expect(spinner).toHaveAttribute('style', /height:\s*40px/);
  await expect(spinner).toHaveAttribute('style', /--mat-progress-spinner-size:\s*40px/);
  await expect(spinner).toHaveAttribute('style', /--mat-progress-spinner-active-indicator-width:\s*40px/);
});
```

- [ ] **Step 18: Create `custom-stroke.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/custom-stroke — diameter=40 strokeWidth=3 reflected in inline style + SVG stroke-width%', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/custom-stroke/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveAttribute('style', /width:\s*40px/);

  // Determinate circle carries the computed stroke-width%.
  // circleStrokeWidthPct(40, 3) = (3/40)*100 = 7.5%.
  const determinateCircle = spinner.locator('.mdc-circular-progress__determinate-circle');
  await expect(determinateCircle).toHaveAttribute('style', /stroke-width:\s*7\.5%/);
});
```

- [ ] **Step 19: Create `aria-labeled.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/aria-labeled — <mat-progress-spinner> carries aria-label="Loading" alongside role="progressbar"', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveAttribute('role', 'progressbar');
  await expect(spinner).toHaveAttribute('aria-label', 'Loading');
  await expect(spinner).toHaveAttribute('aria-valuenow', '25');
});
```

- [ ] **Step 20: Do NOT run Playwright**

Chromium install + preview server are human-managed steps. Skip execution — Task 11 documents the manual verification step.

- [ ] **Step 21: Commit**

```bash
git add \
  src/qwik-cdk-dev-app/src/root.tsx \
  src/qwik-cdk-dev-app/src/routes/index.tsx \
  src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/ \
  src/qwik-cdk-parity-tests/specs/material-progress-spinner/
git commit -m "$(cat <<'EOF'
feat(multiple): mat-progress-spinner dev-app routes (8) + Playwright parity specs (8)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 10 — Finalisation

### Task 11: SYNC.md + pipeline verification

**Reference source:** `src/qwik-material/progress-bar/SYNC.md` (existing SYNC pattern from Progress Bar port).

**Files:**
- Create: `src/qwik-material/progress-spinner/SYNC.md`

**Interfaces:**
- Consumes: everything from Tasks 1-10.
- Produces: `SYNC.md` documenting the progress-spinner port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/progress-spinner/SYNC.md`**

Contents:

```markdown
# qwik-material/progress-spinner sync log

Tracks the sync state between this port and `src/material/progress-spinner/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`, and
`src/qwik-material/progress-bar/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `progress-spinner/mat-progress-spinner.tsx` | `src/material/progress-spinner/progress-spinner.ts` (MatProgressSpinner component + progress-spinner.html template) | ported | Directive→component$ factory; JSX template inlined; NgTemplateOutlet replaced by internal SpinnerCircle helper; MatSpinner ships as second real component (not const alias); all geometry helpers hoisted to top-level pure functions |
| `progress-spinner/progress-spinner-color.ts` | `src/material/progress-spinner/progress-spinner.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union |
| `progress-spinner/progress-spinner-mode.ts` | `src/material/progress-spinner/progress-spinner.ts` (ProgressSpinnerMode type) | ported | Verbatim 2-value union |
| `progress-spinner/progress-spinner-config.ts` | `src/material/progress-spinner/progress-spinner.ts` (MatProgressSpinnerDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matProgressSpinnerConfig; `_forceAnimations` field omitted |
| `scss/progress-spinner/progress-spinner.scss` | `src/material/progress-spinner/progress-spinner.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — only `cdk.high-contrast` is called (2 sites) and `_cdk-stub.scss` defines it. Same rewrite as dialog + button + card + toolbar + badge + progress-bar ports. |
| `scss/progress-spinner/_progress-spinner-theme.scss` | `src/material/progress-spinner/_progress-spinner-theme.scss` | synced | byte-identical copy |
| `scss/progress-spinner/_m2-progress-spinner.scss` | `src/material/progress-spinner/_m2-progress-spinner.scss` | synced | byte-identical copy |
| `scss/progress-spinner/_m3-progress-spinner.scss` | `src/material/progress-spinner/_m3-progress-spinner.scss` | synced | byte-identical copy |
| `scss/progress-spinner/progress-spinner-prebuilt.scss` | (qwik-material-specific) | new | @use progress-spinner.scss + M3 :root defaults matching emitted --mat-progress-spinner-* references |

## Removed upstream files

- `progress-spinner-module.ts` → Qwik has no module concept
- `progress-spinner.html` → template inlined as JSX inside `mat-progress-spinner.tsx` (with NgTemplateOutlet replaced by internal SpinnerCircle helper)
- `testing/` (MatProgressSpinnerTestingModule + harness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (§2.5)
- `progress-spinner.spec.ts` → ported to `mat-progress-spinner-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-progress-spinner>` AND `<mat-spinner>` custom-element tags both preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation — both tags widened to `QwikIntrinsicElements['div'] & {mode?: string}`.
2. **`MatSpinner` shipped as a separate real component**, NOT `export const MatSpinner = MatProgressSpinner` as upstream does. Qwik cannot sniff host tag name at constructor time; two components sharing a `createSpinner()` factory produce the same DOM shape with different host tag + different default mode.
3. **`_getAnimationsState()` `di-disabled` branch** replaced by `animationsDisabled = useContext(MAT_ANIMATIONS_DISABLED)` reading a `Signal<boolean>` from `QwikMaterialProvider`. Established at Dialog port.
4. **`.mat-progress-spinner-reduced-motion` class omitted.** SCSS `@media (prefers-reduced-motion: reduce)` handles it. No client-side matchMedia.
5. **`_forceAnimations` config field omitted.** Obscure Angular DI toggle; `matAnimationsDisabled` context already gives consumers the escape hatch.
6. **`NgTemplateOutlet` template mechanism replaced by an internal `SpinnerCircle` helper component.** Upstream reuses one `<ng-template #circle>` across 4 render sites (1 determinate + 3 indeterminate clippers); the port inlines an internal component with the same output.
7. **`ViewChild('determinateSpinner')` reference omitted.** Port doesn't need reactive DOM node access.
8. **`numberAttribute` transforms omitted.** Port accepts JSX `number` and clamps `value` at render time via top-level `clampValue()`.
9. **`MAT_PROGRESS_SPINNER_CONFIG` folded into `QwikMaterialProvider.matProgressSpinnerConfig`.** 9th `useContextProvider` call.
10. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatProgressSpinnerProps` (and re-used by `MatSpinnerProps`) and forwarded to both host tags.
11. **`ThemePalette` narrowed** to `MatProgressSpinnerColor = 'primary' | 'accent' | 'warn'`.
12. **Deprecated Angular `MatSpinner` const alias** (`export const MatSpinner = MatProgressSpinner`) replaced by a first-class real component with distinct DOM tag (`<mat-spinner>`) and distinct default mode (`indeterminate`).
13. **`intrinsic-elements.d.ts` widens BOTH `<mat-progress-spinner>` AND `<mat-spinner>` to `QwikIntrinsicElements['div'] & {mode?: string}`.** Both tag types need the widening because both components emit the `mode` custom attribute.

## Stub inventory delta

No new stubs — the progress-spinner SCSS chain calls only `cdk.high-contrast` (2 sites), already provided by `_cdk-stub.scss` from prior ports. No additions to any existing stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/progress-spinner/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner.
```

- [ ] **Step 2: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** all 8 prebuilt CSS files emit; JS + d.ts under `dist/{dialog,button,card,toolbar,badge,icon,progress-bar,progress-spinner}/`.
- **Vitest:** all specs pass across 8 entry-points.
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 3: Verify the class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/progress-spinner/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 4: Verify no SSR globals in the progress-spinner entry-point**

```bash
grep -RnE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/progress-spinner/ | grep -v '\.spec\.'
```

Expected: no output. (Progress-spinner has no `useVisibleTask$` and no browser globals — it's pure computation from props.)

- [ ] **Step 5: Verify no `isBrowser` import**

```bash
grep -RnE "from '@builder\.io/qwik/build'" src/qwik-material/progress-spinner/
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/progress-spinner/SYNC.md
git commit -m "$(cat <<'EOF'
docs(multiple): finalize qwik-material/progress-spinner SYNC.md + pipeline verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Layout

```
src/qwik-material/
  progress-spinner/
    progress-spinner-color.ts              — MatProgressSpinnerColor type (Task 3)
    progress-spinner-color.spec.ts
    progress-spinner-mode.ts               — MatProgressSpinnerMode type (Task 4)
    progress-spinner-mode.spec.ts
    progress-spinner-config.ts             — MatProgressSpinnerConfig + MAT_PROGRESS_SPINNER_CONFIG (Task 5)
    progress-spinner-config.spec.ts
    mat-progress-spinner.tsx               — createSpinner() factory + MatProgressSpinner + MatSpinner + SpinnerCircle internal (Task 6)
    mat-progress-spinner.spec.tsx          — smoke (Task 6)
    mat-progress-spinner-scenarios.spec.tsx — upstream scenario port (Task 9)
    intrinsic-elements.d.ts                — <mat-progress-spinner> + <mat-spinner> JSX augmentation + mode attr (Task 1)
    public-api.ts                          — consumer-facing re-exports (Task 8)
    index.ts                               — `export * from './public-api'` (Task 1 stub / Task 8 real)
    SYNC.md                                — deviation + stub log (Task 11)
  dialog/
    qwik-material-provider.tsx             — MODIFIED in Task 7 (adds matProgressSpinnerConfig)
    qwik-material-provider-progress-spinner.spec.tsx — new spec (Task 7)
  scss/
    progress-spinner/                      — 4 upstream SCSS files (progress-spinner.scss with cdk-stub rewrite) + progress-spinner-prebuilt.scss (Task 2)
  package.json                             — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                           — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                               — MODIFIED in Task 10 (progress-spinner-prebuilt.css import)
    routes/
      index.tsx                            — MODIFIED in Task 10 (Progress spinners section)
      mat-progress-spinner/                — 8 new route files (Task 10)

src/qwik-cdk-parity-tests/
  specs/
    material-progress-spinner/             — 8 new Playwright specs (Task 10)
```

## Per-entry-point state

The `progress-spinner` entry-point becomes the eighth after `dialog` + `button` + `card` + `toolbar` + `badge` + `icon` + `progress-bar` in the qwik-material package. All eight live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` (from earlier ports) is the only intersection, extended in Task 7.

## Sync recipe

To re-sync a specific file from upstream `src/material/progress-spinner/`:

1. Locate the upstream file's counterpart in the `progress-spinner/SYNC.md` sync table.
2. If "synced" state: `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "synced with one deviation" state: `cp` then re-apply the recorded rewrite; verify with `diff` to catch any other upstream changes.
4. If "ported" state: manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change to the `mat-progress-spinner.tsx` file, update the corresponding `.spec.tsx`.
5. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck)
- 8 dev-app routes at `/mat-progress-spinner/*` render visibly in browser preview
- 8 Playwright specs pass locally when run against the built dev-app preview
- Every Playwright spec asserts on the correct custom-element tag AT LEAST ONCE (`mat-progress-spinner` for 7 routes, `mat-spinner` for the alias route)
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/progress-spinner/` returns nothing)
- Zero SSR-leak violations
- SYNC.md populated with all 13 deviations + stub delta
