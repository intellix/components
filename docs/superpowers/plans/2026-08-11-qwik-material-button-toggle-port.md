# qwik-material Button Toggle Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/button-toggle` into a `qwik-material/button-toggle` entry-point: 2 components — `MatButtonToggleGroup` (container, controlled component with `value` + `onChange$` in single mode or `values` + `onValuesChange$` in multi mode) and `MatButtonToggle` (child, computes its own checked state from group context, or owns local state when standalone). First port on the branch with a reactive per-instance state context + QRL prop callbacks — precedent-setting for future forms-tier ports (checkbox, radio, slide-toggle). Native Tab per button for keyboard nav (no arrow-key handler, no focus manager, SSR-safe).

**Architecture:** Consumer owns selection state via signals; group takes `value`/`values` + `onChange$`/`onValuesChange$` QRLs. Group publishes a per-instance `MAT_BUTTON_TOGGLE_GROUP_STATE` context carrying the current selection + mode + a single `onToggle` QRL that internally forks by mode. Children read the context (with SSR-safe DEFAULTS fallback), compute their own `checked` state, and fire `state.onToggle(myValue, !checked)` on click. Standalone `<MatButtonToggle>` detects the DEFAULTS via identity comparison on the no-op `onToggle` and falls back to owning its own local `useSignal(false)` for checked state.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./button-toggle`. New prebuilt CSS entry: `./button-toggle-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-08-11-qwik-material-button-toggle-port-design.md](../specs/2026-08-11-qwik-material-button-toggle-port-design.md). Read §2 (Architecture — controlled-component pattern), §3 (Component API + context topology), §4 (SCSS strategy), §5 (10 deviations) before starting any port task.
- **Material source reference:** `src/material/button-toggle/`. Every port task names the exact source file(s) it mirrors (or explicitly removes).
- **DOM parity — custom-element tags:** upstream renders `<mat-button-toggle-group>` and `<mat-button-toggle>` as real custom elements. Port preserves both via JSX augmentation in `intrinsic-elements.d.ts` typed as `QwikIntrinsicElements['div']`. No custom-attribute widening needed (no numeric attrs like grid-list's `cols`/`rowspan`/`colspan`; `type` on the inner `<button>` is native).
- **DOM parity — class ladders:**
  - `<mat-button-toggle-group>` = `mat-button-toggle-group mat-button-toggle-standard` (+ `mat-button-toggle-group-multiple` in multi mode)
  - `<mat-button-toggle>` = `mat-button-toggle` (+ `mat-button-toggle-checked` when selected)
  - Inner `<button>` = `mat-button-toggle-button`
  - Inner `<span>` around content = `mat-button-toggle-label-content`
- **DOM parity — role logic (MatButtonToggle):** `role="radio"` in single-mode group, `role="checkbox"` in multi-mode group, `role="button"` standalone. `aria-checked` in group modes; `aria-pressed` standalone. Consumer `role` prop on the GROUP overrides the default; not overridable on the individual toggle.
- **DOM parity — role logic (MatButtonToggleGroup):** `role="radiogroup"` in single mode, `role="group"` in multi mode. Consumer `role` prop overrides.
- **DOM parity — inner structure:** each `<mat-button-toggle>` renders `<button type="button" class="mat-button-toggle-button" tabindex="-1"><span class="mat-button-toggle-label-content"><Slot /></span></button>`. Optional hidden `<input type="hidden">` sibling only when `group.name` is set AND the toggle is checked.
- **Keyboard nav:** each `<mat-button-toggle>` has `tabindex="0"` on the host; the inner `<button>` has `tabindex="-1"` (absorbs clicks but not Tab focus). NO arrow-key handler, NO roving tabindex.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. `button-toggle.ts` → split into `mat-button-toggle-group.tsx` + `mat-button-toggle.tsx`.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/button-toggle/SYNC.md`.
- **No RxJS.** **No `HttpClient` / XHR.** **No `useVisibleTask$`** — state derived from props each render. **No `useStore`, no `useTask$`** — plain function-scoped derivations.
- **No exported classes** in `button-toggle/public-api.ts` or anywhere else in `src/qwik-material/button-toggle/`.
- **SSR safety:** No `document.` / `window.` / `navigator.` / `getComputedStyle(` / `requestAnimationFrame(` in non-spec files. No `isBrowser` import from `@builder.io/qwik/build`.
- **Every `useContext` call carries a defaults fallback** (Progress Bar / Progress Spinner lesson): `useContext(MAT_BUTTON_TOGGLE_CONFIG, CONFIG_DEFAULTS)` in the group; `useContext(MAT_BUTTON_TOGGLE_GROUP_STATE, MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS)` in each child toggle.
- **Commit message scope:** `multiple` for every commit (hook enforced — no `--no-verify`, no hook bypass).
- **Pnpm version:** `pnpm@11.7.0`. Don't change.
- **No Bazel changes.** **No upstream CI integration.**
- **Class-list cast pattern (established):** `.filter(Boolean) as string[]` for Qwik's `ClassList` type quirk.
- **No `BooleanInput` / `NumberInput` coercion.** Qwik JSX passes booleans and numbers directly.
- **`box-sizing: border-box` explicitly required** on `.mat-button-toggle` AND `.mat-button-toggle-button` in the rewritten SCSS — list-port Task 2 lesson (missing box-sizing caused 16px height regressions caught only at final Playwright review).
- **No @angular/cdk SCSS rewrite** expected (list-port precedent — one orphaned reference may surface, document without a rewrite). Task 2 verifies via grep.
- **Spec files use smoke variant:** `createDOM(<component$/>)` hangs the Qwik optimizer worker under vitest. All button-toggle `.spec.tsx` files use module-import assertions. Real DOM assertions live in Task 9's Playwright parity specs, verified live at Task 11.
- **Standalone toggle detection:** `MatButtonToggle` compares `state.onToggle === MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle` (identity check). If true, allocate local `useSignal(false)` for checked state; clicks flip it locally. If false, checked is derived from context and clicks route through `state.onToggle`.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `button-toggle` entry-point into the existing qwik-material package

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from earlier ports — list is the most recent addition).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/button-toggle/intrinsic-elements.d.ts`
- Create: `src/qwik-material/button-toggle/index.ts` (empty stub — Task 7 replaces)

**Interfaces:**
- Consumes: existing package scaffolding (12 entry-points as of list port).
- Produces: `pnpm -C src/qwik-material build` still succeeds (existing 11 prebuilt CSS files still emit; no button-toggle CSS yet). Type resolution for `@angular-community/qwik-material/button-toggle` returns an empty module. `<mat-button-toggle-group>` and `<mat-button-toggle>` are legal JSX elements.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./button-toggle` after `./list`, and `./button-toggle-prebuilt.css` after `./list-prebuilt.css`. Final relevant block:

```json
"./list": {
  "qwik": "./list/index.ts",
  "types": "./dist/list/index.d.ts",
  "import": "./dist/list/index.js"
},
"./button-toggle": {
  "qwik": "./button-toggle/index.ts",
  "types": "./dist/button-toggle/index.d.ts",
  "import": "./dist/button-toggle/index.js"
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
"./button-toggle-prebuilt.css": "./dist/button-toggle-prebuilt.css",
"./scss/*": "./scss/*"
```

- [ ] **Step 2: Extend `src/qwik-material/vite.config.ts` `entries` array + `sassEntries` list**

Read the file. `entries` currently ends with `'list'`. Append `'button-toggle'`:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar', 'badge', 'icon', 'progress-bar', 'progress-spinner', 'divider', 'grid-list', 'list', 'button-toggle'];
```

`sassEntries` currently ends with `['scss/list/list-prebuilt.scss', 'dist/list-prebuilt.css']`. Append the button-toggle pair:

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
  ['scss/button-toggle/button-toggle-prebuilt.scss', 'dist/button-toggle-prebuilt.css'],
];
```

- [ ] **Step 3: Create `src/qwik-material/button-toggle/intrinsic-elements.d.ts`**

Both custom elements type as `QwikIntrinsicElements['div']` — no custom camelCase or numeric attrs need widening. The inner `<button type="button">` is a native HTML element that Qwik types natively. Contents:

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Button Toggle's custom-element
 * tag names. Upstream renders <mat-button-toggle-group> and <mat-button-toggle>
 * as actual custom elements; external CMS styles may target the tags directly
 * (not just the .mat-button-toggle-* classes). Both type as
 * QwikIntrinsicElements['div'] — no custom camelCase attrs need widening
 * (unlike grid-list's cols/rowspan/colspan). See design spec §5 deviation #10.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-button-toggle-group': QwikIntrinsicElements['div'];
      'mat-button-toggle': QwikIntrinsicElements['div'];
    }
  }
}
```

- [ ] **Step 4: Create `src/qwik-material/button-toggle/index.ts`** (empty stub)

Contents:

```ts
export {};
```

Task 7 replaces this with `export * from './public-api';`.

- [ ] **Step 5: Run the build to confirm the stub compiles**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. The dts plugin generates `dist/button-toggle/index.d.ts` with `export {};`. The Sass pipeline logs a `skipping scss/button-toggle/button-toggle-prebuilt.scss — not yet present.` warning (ENOENT-tolerant guard); this is EXPECTED — Task 2 creates the SCSS file. Confirm the existing 11 prebuilt CSS files still emit:

```bash
ls src/qwik-material/dist/*.css
```

Expected: `dialog-prebuilt.css`, `button-prebuilt.css`, `card-prebuilt.css`, `toolbar-prebuilt.css`, `badge-prebuilt.css`, `icon-prebuilt.css`, `progress-bar-prebuilt.css`, `progress-spinner-prebuilt.css`, `divider-prebuilt.css`, `grid-list-prebuilt.css`, `list-prebuilt.css`. NOT `button-toggle-prebuilt.css` yet.

`ls src/qwik-material/dist/button-toggle/`:

```bash
ls src/qwik-material/dist/button-toggle/
```

Expected: `index.d.ts`, `index.js`, `index.js.map`. `dist/button-toggle/index.d.ts` contents: `export {};`.

- [ ] **Step 6: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. The `intrinsic-elements.d.ts` from Step 3 makes `<mat-button-toggle-group>` and `<mat-button-toggle>` legal JSX elements.

- [ ] **Step 7: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/button-toggle/intrinsic-elements.d.ts \
  src/qwik-material/button-toggle/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): wire qwik-material/button-toggle entry-point + 2 custom-element JSX augmentations

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SCSS + prebuilt CSS

### Task 2: Copy 3 SCSS partials byte-identical + rewrite `button-toggle.scss` (~100 LOC) + new `button-toggle-prebuilt.scss`

**Reference source:** `src/material/button-toggle/*.scss` (4 files, ~610 total LOC). Confirmed at this step via `grep '@angular/cdk' src/material/button-toggle/*.scss`: zero references expected. NO `@use '../cdk-stub' as cdk` rewrite needed — matches Icon + Divider + Grid List + List precedent.

**Files:**
- Create: `src/qwik-material/scss/button-toggle/_button-toggle-theme.scss` (byte-identical copy)
- Create: `src/qwik-material/scss/button-toggle/_m2-button-toggle.scss` (byte-identical copy)
- Create: `src/qwik-material/scss/button-toggle/_m3-button-toggle.scss` (byte-identical copy)
- Create: `src/qwik-material/scss/button-toggle/button-toggle.scss` (heavily REWRITTEN — ~100 LOC of CSS-grid-free segmented layout; drops ripple/state-layer/focus-indicator/pseudo-checkbox/legacy variant/vertical mode)
- Create: `src/qwik-material/scss/button-toggle/button-toggle-prebuilt.scss` (new — `:root` var defaults)

**Interfaces:**
- Consumes: existing SCSS ecosystem — sass compiler picks up `scss/button-toggle/button-toggle-prebuilt.scss` from Task 1's vite.config.ts change.
- Produces: `dist/button-toggle-prebuilt.css` after `pnpm -C src/qwik-material build`. Compiled CSS contains `.mat-button-toggle-group`, `.mat-button-toggle`, `.mat-button-toggle-button`, `.mat-button-toggle-label-content` rules with `box-sizing: border-box` and checked/disabled state variants. Every `--mat-*` reference has a matching `:root` declaration.

- [ ] **Step 1: Byte-identical copy of the 3 SCSS partials that don't need rewriting**

```bash
cp src/material/button-toggle/_button-toggle-theme.scss  src/qwik-material/scss/button-toggle/_button-toggle-theme.scss
cp src/material/button-toggle/_m2-button-toggle.scss     src/qwik-material/scss/button-toggle/_m2-button-toggle.scss
cp src/material/button-toggle/_m3-button-toggle.scss     src/qwik-material/scss/button-toggle/_m3-button-toggle.scss
```

Verify byte-identical:

```bash
diff -q src/material/button-toggle/_button-toggle-theme.scss  src/qwik-material/scss/button-toggle/_button-toggle-theme.scss
diff -q src/material/button-toggle/_m2-button-toggle.scss     src/qwik-material/scss/button-toggle/_m2-button-toggle.scss
diff -q src/material/button-toggle/_m3-button-toggle.scss     src/qwik-material/scss/button-toggle/_m3-button-toggle.scss
```

Expected: no output on any (empty stdout for each).

- [ ] **Step 2: Sanity-check ALL 4 upstream SCSS files for `@angular/cdk` references**

```bash
grep -RnE "@use '@angular/cdk'" src/material/button-toggle/*.scss
```

Expected: no output. This confirms no `cdk-stub` rewrite is needed. If ONE upstream partial contains `@use '@angular/cdk'` but is NOT referenced from `button-toggle.scss`'s rewritten chain (list-port precedent found this in `_list-item-hcm-indicator.scss`), document it as an orphan in the SYNC.md sync-state row in Task 10 rather than adding a stub.

- [ ] **Step 3: Create the rewritten `src/qwik-material/scss/button-toggle/button-toggle.scss`**

Upstream is 381 LOC with the `.mat-button-toggle-appearance-standard` vs legacy branching, ripple positioning, state-layer, focus-indicator, pseudo-checkbox styling, and vertical mode overrides. Replaced by ~100 LOC of CSS per spec §4. Contents:

```scss
// qwik-material button-toggle styling — segmented control (standard appearance only).
// Upstream ships two appearance variants (legacy + standard), ripple + state-layer
// hooks, focus-indicator, pseudo-checkbox indicator, and vertical mode. All are
// dropped entirely (spec §5 deviations #6, #7, #8) — this file ships the modern
// standard appearance in horizontal mode only.
//
// `box-sizing: border-box` is EXPLICITLY set on both .mat-button-toggle and
// .mat-button-toggle-button per the list-port lesson (Task 2 rewrite of list.scss
// omitted it and Playwright caught 16px height regressions at final review).

@use './m3-button-toggle';
@use '../core/tokens/token-utils';

$fallbacks: m3-button-toggle.get-tokens();

// Segmented group container — horizontal row with unified border.
.mat-button-toggle-group {
  display: inline-flex;
  flex-direction: row;
  align-items: stretch;
  border-radius: token-utils.slot(
    button-toggle-shape, $fallbacks, calc(var(--mat-button-toggle-height, 40px) / 2)
  );
  border: 1px solid var(--mat-button-toggle-divider-color, rgba(0, 0, 0, 0.12));
  overflow: hidden;
  background: var(--mat-button-toggle-background-color, transparent);

  &[aria-disabled='true'] .mat-button-toggle {
    pointer-events: none;
    opacity: 0.38;
  }
}

// Individual toggle host.
.mat-button-toggle {
  box-sizing: border-box;
  display: inline-flex;
  position: relative;
  color: var(--mat-button-toggle-text-color, rgba(0, 0, 0, 0.87));
  font-size: token-utils.slot(button-toggle-label-text-size, $fallbacks);
  line-height: 1;
  min-height: 40px;

  // Divider between siblings.
  & + .mat-button-toggle {
    border-left: 1px solid var(--mat-button-toggle-divider-color, rgba(0, 0, 0, 0.12));
  }

  // Selected state — background fill; no checkmark indicator per spec §5
  // deviation #7 (dropped MatPseudoCheckbox).
  &.mat-button-toggle-checked {
    background: var(--mat-button-toggle-selected-state-background-color, rgba(0, 0, 0, 0.08));
    color: var(--mat-button-toggle-selected-state-text-color, rgba(0, 0, 0, 0.87));
  }

  // Individual-button disabled state (in addition to group-level cascade).
  &[aria-disabled='true'] {
    pointer-events: none;
    opacity: 0.38;
  }
}

// The actual clickable inner <button> — absorbs clicks; tabindex=-1 so Tab
// navigates between hosts not into the inner button.
.mat-button-toggle-button {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  min-height: 100%;
  min-width: 100%;
  font: inherit;
  color: inherit;

  &:focus-visible {
    outline: 2px solid var(--mat-button-toggle-focus-outline-color, rgba(0, 0, 0, 0.87));
    outline-offset: -2px;
  }
}

// Label wrapper — matches upstream class name for CSS-selector parity.
.mat-button-toggle-label-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
```

Notes for the implementer:
- `@use './m3-button-toggle';` remains for M3 typography token access via `token-utils.slot(...)`.
- `box-sizing: border-box` on BOTH `.mat-button-toggle` and `.mat-button-toggle-button` is REQUIRED per the list-port lesson. Do not omit either.
- Do NOT `@use '../cdk-stub' as cdk` — the upstream `.scss` uses only `token-utils` from `../core/`, none of which come from `@angular/cdk`.
- Token names in `token-utils.slot(...)` calls (`button-toggle-shape`, `button-toggle-label-text-size`) are best-effort guesses from the upstream `_m3-button-toggle.scss`. Step 6 verifies against compiled CSS.

- [ ] **Step 4: Create the initial `src/qwik-material/scss/button-toggle/button-toggle-prebuilt.scss`**

Start with a candidate `:root` block for the CSS custom properties the rewritten `button-toggle.scss` reads. Contents (candidate — Step 6 verifies + expands as needed):

```scss
// Button toggle prebuilt CSS. Wraps the port's button-toggle.scss with :root
// defaults for every --mat-button-toggle-* variable it emits. See design spec §4.

@use './button-toggle';

:root {
  --mat-button-toggle-text-color: rgba(0, 0, 0, 0.87);
  --mat-button-toggle-divider-color: rgba(0, 0, 0, 0.12);
  --mat-button-toggle-selected-state-background-color: rgba(0, 0, 0, 0.08);
  --mat-button-toggle-selected-state-text-color: rgba(0, 0, 0, 0.87);
  --mat-button-toggle-focus-outline-color: rgba(0, 0, 0, 0.87);
  --mat-button-toggle-background-color: transparent;
  --mat-button-toggle-height: 40px;
}
```

Note: `@use './button-toggle';` MUST come before the `:root` block (Sass requires `@use` first).

- [ ] **Step 5: Run the build to emit `dist/button-toggle-prebuilt.css`**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. `dist/button-toggle-prebuilt.css` present:

```bash
ls src/qwik-material/dist/button-toggle-prebuilt.css
```

Expected: file listed.

- [ ] **Step 6: Grep the emitted CSS for every `--mat-*` reference and reconcile against the `:root` block**

The KEY step. The candidate is a plan-author's guess; the compiled CSS is the source of truth. Prior ports found real drift (Icon: `--mat-icon-icon-color` vs actual `--mat-icon-color`; List: 3 text-size vars beyond candidate).

```bash
# What the compiled CSS actually references
grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/button-toggle-prebuilt.css | sort -u
```

Compare to what the `:root` block declares:

```bash
grep -oE '^\s*--mat-[a-z-]+' src/qwik-material/scss/button-toggle/button-toggle-prebuilt.scss | sort -u
```

For every `var(--mat-*)` reference NOT covered by a `:root` line:
- If it's a `--mat-button-toggle-*` var → look up the token default in `_m3-button-toggle.scss` and add a `:root` declaration with the correct M3 default.
- If it's a `--mat-sys-*` var → add a `:root` declaration with the M3 system-color default from `src/material/core/tokens/m3/_md-sys-color.scss`.

For every `:root` declaration NOT actually referenced in the compiled CSS: remove it (phantom variable).

Rebuild after every edit until the diff is empty:

```bash
diff \
  <(grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/button-toggle-prebuilt.css | sed 's/var(//' | sort -u) \
  <(grep -oE '^[[:space:]]*--mat-[a-z-]+' src/qwik-material/scss/button-toggle/button-toggle-prebuilt.scss | sed 's/^[[:space:]]*//' | sort -u)
```

Expected: no output.

- [ ] **Step 7: Confirm the structural CSS rules survived**

```bash
grep -cE '^\.mat-button-toggle-group' src/qwik-material/dist/button-toggle-prebuilt.css
```

Expected: at least `1`.

```bash
grep -cE '\.mat-button-toggle' src/qwik-material/dist/button-toggle-prebuilt.css
```

Expected: at least `5` — top-level `.mat-button-toggle` + `.mat-button-toggle-group` + `.mat-button-toggle-button` + `.mat-button-toggle-label-content` + `.mat-button-toggle-checked`.

```bash
grep -cE 'box-sizing:\s*border-box' src/qwik-material/dist/button-toggle-prebuilt.css
```

Expected: at least `2` — the two `box-sizing` declarations on `.mat-button-toggle` and `.mat-button-toggle-button`.

```bash
grep -E 'inline-flex' src/qwik-material/dist/button-toggle-prebuilt.css | head -5
```

Expected: at least 2 hits (`.mat-button-toggle-group` and `.mat-button-toggle`).

- [ ] **Step 8: Confirm existing 11 prebuilt CSS files still emit**

```bash
ls src/qwik-material/dist/*.css
```

Expected: 12 files (dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list + button-toggle).

- [ ] **Step 9: Commit**

```bash
git add \
  src/qwik-material/scss/button-toggle/_button-toggle-theme.scss \
  src/qwik-material/scss/button-toggle/_m2-button-toggle.scss \
  src/qwik-material/scss/button-toggle/_m3-button-toggle.scss \
  src/qwik-material/scss/button-toggle/button-toggle.scss \
  src/qwik-material/scss/button-toggle/button-toggle-prebuilt.scss
git commit -m "$(cat <<'EOF'
feat(multiple): button-toggle SCSS chain (3 partials synced + rewritten button-toggle.scss + prebuilt defaults)

3 upstream partials copied byte-identical (_button-toggle-theme, _m2-button-toggle,
_m3-button-toggle). button-toggle.scss REWRITTEN to ~100 LOC of standard-only
segmented control — drops MDC state-layer/ripple/focus-indicator/pseudo-checkbox/
legacy variant/vertical mode per spec §5 deviations #6, #7, #8. Includes
explicit box-sizing: border-box on .mat-button-toggle and .mat-button-toggle-button
per the list-port lesson (missing box-sizing caused 16px regressions at final review).

button-toggle-prebuilt.scss declares :root defaults for every --mat-button-toggle-*
variable the compiled CSS references. Reconciled via grep loop against
dist/button-toggle-prebuilt.css until the diff is empty.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Config + state contexts

### Task 3: `MatButtonToggleConfig` + `MatButtonToggleGroupState` + context tokens

**Reference source:** design spec §3.3 (config) + §3.4 (state). Upstream `MatButtonToggleDefaultOptions` interface + `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` `InjectionToken` are folded into the empty `MatButtonToggleConfig` (family shape). Upstream `MatButtonToggleGroup` internal state is externalized into a per-instance context so Qwik children can subscribe.

**Files:**
- Create: `src/qwik-material/button-toggle/button-toggle-config.ts`
- Create: `src/qwik-material/button-toggle/button-toggle-group-state.ts`
- Create: `src/qwik-material/button-toggle/button-toggle-state.spec.ts` (combined smoke — 5 it() covering both files)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface MatButtonToggleConfig {}` (empty)
  - `const MAT_BUTTON_TOGGLE_CONFIG: ContextId<MatButtonToggleConfig>` with id `'qwik-material/button-toggle-config'`
  - `type MatButtonToggleGroupMode = 'single' | 'multi'`
  - `interface MatButtonToggleGroupState` — 6 fields: `mode`, `value`, `values`, `disabled`, `name`, `onToggle`
  - `const MAT_BUTTON_TOGGLE_GROUP_STATE: ContextId<MatButtonToggleGroupState>` with id `'qwik-material/button-toggle-group-state'`
  - `const MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS: MatButtonToggleGroupState` — sensible defaults with no-op `onToggle` QRL

- [ ] **Step 1: Create `src/qwik-material/button-toggle/button-toggle-config.ts`**

Contents:

```ts
import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every MatButtonToggleGroup / MatButtonToggle in a subtree.
 * Consumers provide this via <QwikMaterialProvider matButtonToggleConfig={...}>.
 * Currently empty — the port has no consumer-configurable defaults today. Kept
 * for family shape parity with divider / grid-list / list and to allow future
 * fields (e.g. re-adding an appearance variant) without an API break.
 */
export interface MatButtonToggleConfig {}

/**
 * Context id used by MatButtonToggleGroup to read config. The id string is
 * exposed publicly and MUST remain stable across releases — consumers may
 * inject it directly in advanced scenarios.
 */
export const MAT_BUTTON_TOGGLE_CONFIG = createContextId<MatButtonToggleConfig>(
  'qwik-material/button-toggle-config',
);
```

- [ ] **Step 2: Create `src/qwik-material/button-toggle/button-toggle-group-state.ts`**

Contents:

```ts
import {$, createContextId, type QRL} from '@builder.io/qwik';

/**
 * Selection mode for MatButtonToggleGroup. Drives the child's role
 * (radio/checkbox) and the group's default role (radiogroup/group).
 */
export type MatButtonToggleGroupMode = 'single' | 'multi';

/**
 * Per-instance context published by <MatButtonToggleGroup> and consumed by
 * every descendant <MatButtonToggle>. Carries the current selection, mode,
 * cascading disabled state, form-control name, and the child's click handler.
 *
 * First port on the branch to carry a QRL callback in a per-instance context.
 * Precedent-setting for future forms-tier ports (checkbox, radio, slide-toggle).
 * See design spec §3.4.
 */
export interface MatButtonToggleGroupState {
  /** Which of the 2 modes is active. */
  mode: MatButtonToggleGroupMode;
  /** In single mode: currently-selected value (or undefined if none).
   *  In multi mode: undefined (children read `values` instead). */
  value: unknown;
  /** In multi mode: currently-selected values (readonly to signal
   *  consumer-owned state).
   *  In single mode: empty ReadonlyArray. */
  values: readonly unknown[];
  /** Group-level disabled — cascades to every child. */
  disabled: boolean;
  /** Form-control name for hidden inputs. Empty string = no hidden input. */
  name: string;
  /** Child's click handler. Group routes to onChange$ (single mode) or
   *  onValuesChange$ (multi mode) internally. */
  onToggle: QRL<(itemValue: unknown, checked: boolean) => void>;
}

/**
 * Context id used by <MatButtonToggle> to read its parent's group state.
 * Stable id string.
 */
export const MAT_BUTTON_TOGGLE_GROUP_STATE = createContextId<MatButtonToggleGroupState>(
  'qwik-material/button-toggle-group-state',
);

/**
 * Sensible defaults so a standalone <MatButtonToggle> (used outside a
 * <MatButtonToggleGroup> ancestor) still renders. The child does an identity
 * check on `onToggle` — if it matches the DEFAULTS' no-op, the toggle owns
 * its own local `useSignal(false)` for checked state. Mirrors upstream's
 * `buttonToggleGroup: MatButtonToggleGroup` (uninjected) optional pattern.
 *
 * Every useContext(MAT_BUTTON_TOGGLE_GROUP_STATE, ...) call MUST pass these
 * defaults as the second argument. A bare useContext without a fallback
 * would throw QError_notFoundContext (Code 13) when a toggle is rendered
 * standalone. See Progress Bar / Progress Spinner post-mortem.
 */
export const MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS: MatButtonToggleGroupState = {
  mode: 'single',
  value: undefined,
  values: [],
  disabled: false,
  name: '',
  onToggle: $((_value: unknown, _checked: boolean) => {
    // No-op — standalone toggle owns its own local state via useSignal.
    // MatButtonToggle detects this identity to know it's standalone.
  }),
};
```

- [ ] **Step 3: Create `src/qwik-material/button-toggle/button-toggle-state.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import {MAT_BUTTON_TOGGLE_CONFIG, type MatButtonToggleConfig} from './button-toggle-config';
import {
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
  type MatButtonToggleGroupState,
  type MatButtonToggleGroupMode,
} from './button-toggle-group-state';

describe('MAT_BUTTON_TOGGLE_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_BUTTON_TOGGLE_CONFIG.id).toBe('qwik-material/button-toggle-config');
  });

  it('MatButtonToggleConfig accepts an empty object', () => {
    const cfg: MatButtonToggleConfig = {};
    expect(cfg).toBeDefined();
  });
});

describe('MAT_BUTTON_TOGGLE_GROUP_STATE', () => {
  it('has the expected context id string', () => {
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE.id).toBe('qwik-material/button-toggle-group-state');
  });

  it('MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS has all 6 fields with sensible values', () => {
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.mode).toBe('single');
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.value).toBeUndefined();
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.values).toEqual([]);
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.disabled).toBe(false);
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.name).toBe('');
    expect(typeof MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle).toBe('function');
  });

  it('MatButtonToggleGroupState accepts a well-formed object', () => {
    const inst: MatButtonToggleGroupState = {
      mode: 'multi' satisfies MatButtonToggleGroupMode,
      value: undefined,
      values: ['a', 'b'],
      disabled: false,
      name: 'perms',
      onToggle: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle,
    };
    expect(inst.mode).toBe('multi');
    expect(inst.values).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 4: Run the spec**

```bash
pnpm -C src/qwik-material test button-toggle/button-toggle-state
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
  src/qwik-material/button-toggle/button-toggle-config.ts \
  src/qwik-material/button-toggle/button-toggle-group-state.ts \
  src/qwik-material/button-toggle/button-toggle-state.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatButtonToggleConfig + MAT_BUTTON_TOGGLE_GROUP_STATE per-instance context

MatButtonToggleConfig is intentionally empty (family-shape parity token).
MatButtonToggleGroupState is a per-instance context published by
MatButtonToggleGroup and consumed by every descendant MatButtonToggle —
carries the parent's selection state (value in single mode, values in
multi mode), cascading disabled, form-control name, and the child's
click handler as a QRL. First port on the branch to carry a QRL
callback in a per-instance context; precedent-setting for future
forms-tier ports.

MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS provides SSR-safe fallback for
standalone toggles (child detects the no-op onToggle via identity check
and switches to owning its own useSignal-backed checked state).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Group component

### Task 4: `<MatButtonToggleGroup>` container component

**Reference source:** `src/material/button-toggle/button-toggle.ts` `MatButtonToggleGroup` class (lines 124-547). Ports the controlled-component surface — `value` / `values` / `onChange$` / `onValuesChange$` / `multiple` / `disabled` / `name` — dropping SelectionModel, ControlValueAccessor, FocusMonitor, keyboard nav, EventEmitter, and @ContentChildren per spec §5 deviations.

**Files:**
- Create: `src/qwik-material/button-toggle/mat-button-toggle-group.tsx`
- Create: `src/qwik-material/button-toggle/mat-button-toggle-group.spec.tsx`

**Interfaces:**
- Consumes:
  - `MAT_BUTTON_TOGGLE_CONFIG` + `MatButtonToggleConfig` from Task 3
  - `MAT_BUTTON_TOGGLE_GROUP_STATE` + `MatButtonToggleGroupState` + `MatButtonToggleGroupMode` from Task 3
- Produces:
  - `interface MatButtonToggleGroupProps` — 12 fields per spec §3.1
  - `const MatButtonToggleGroup: Component<MatButtonToggleGroupProps>`
  - Publishes `MAT_BUTTON_TOGGLE_GROUP_STATE` via `useContextProvider` so descendant `<MatButtonToggle>` can read parent state.

- [ ] **Step 1: Create `src/qwik-material/button-toggle/mat-button-toggle-group.tsx`**

Contents:

```tsx
import {$, component$, Slot, useContext, useContextProvider, type QRL} from '@builder.io/qwik';
import {MAT_BUTTON_TOGGLE_CONFIG, type MatButtonToggleConfig} from './button-toggle-config';
import {
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  type MatButtonToggleGroupMode,
  type MatButtonToggleGroupState,
} from './button-toggle-group-state';

/**
 * Props for <MatButtonToggleGroup>. Controlled component pair with
 * <MatButtonToggle> — consumer owns selection state via signals; the group
 * takes value/values + onChange$/onValuesChange$ QRLs. See design spec §3.1
 * for rendered DOM shape.
 */
export interface MatButtonToggleGroupProps {
  /** Selection mode. `false` (default) = single-select; `true` = multi-select. */
  multiple?: boolean;

  // ── SINGLE mode props ──
  /** Currently-selected value. Consumer owns the state. */
  value?: unknown;
  /** Fires when a child toggle is clicked. Receives the new selected value
   *  (or undefined if the clicked toggle was the currently-selected one being
   *  deselected — matches upstream). */
  onChange$?: QRL<(value: unknown) => void>;

  // ── MULTI mode props ──
  /** Currently-selected values. Consumer owns the state. */
  values?: readonly unknown[];
  /** Fires when a child toggle is clicked. Receives the new set of selected
   *  values (already deduped, order preserved). */
  onValuesChange$?: QRL<(values: readonly unknown[]) => void>;

  // ── Shared ──
  /** Disables the whole group; cascades to every child via context. */
  disabled?: boolean;
  /** Form-control name — set on hidden `<input>` inside each checked button so
   *  the group participates in standard HTML form submission. */
  name?: string;
  /** ARIA role override. Defaults to "radiogroup" (single) or "group" (multi). */
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const CONFIG_DEFAULTS: MatButtonToggleConfig = {};

export const MatButtonToggleGroup = component$<MatButtonToggleGroupProps>(props => {
  // Read config for family-shape consistency, even though it currently has
  // no fields to resolve. DEFAULTS fallback is REQUIRED (Progress Bar /
  // Progress Spinner post-mortem — bare useContext throws Code 13 when
  // rendered outside <QwikMaterialProvider>).
  useContext(MAT_BUTTON_TOGGLE_CONFIG, CONFIG_DEFAULTS);

  const mode: MatButtonToggleGroupMode = props.multiple ? 'multi' : 'single';
  const onChange$ = props.onChange$;
  const onValuesChange$ = props.onValuesChange$;
  const propValue = props.value;
  const propValues = props.values;

  // Route-once QRL that children fire — internally forks by mode. Captured
  // props are re-resolved each render, so mode switches and callback swaps
  // just work.
  const onToggle = $((itemValue: unknown, checked: boolean) => {
    if (mode === 'single') {
      // Clicking the currently-selected item deselects it (matches upstream).
      const newValue = checked ? itemValue : undefined;
      onChange$?.(newValue);
    } else {
      const current = propValues ?? [];
      const next = checked
        ? [...current, itemValue]
        : current.filter(v => v !== itemValue);
      onValuesChange$?.(next);
    }
  });

  // Derive state fresh each render — Qwik's fine-grained reactivity re-runs
  // this component when consumer-owned value/values signals change.
  const state: MatButtonToggleGroupState = {
    mode,
    value: mode === 'single' ? propValue : undefined,
    values: mode === 'multi' ? (propValues ?? []) : [],
    disabled: props.disabled ?? false,
    name: props.name ?? '',
    onToggle,
  };
  useContextProvider(MAT_BUTTON_TOGGLE_GROUP_STATE, state);

  const classes = [
    'mat-button-toggle-group',
    mode === 'multi' && 'mat-button-toggle-group-multiple',
    'mat-button-toggle-standard',
    props.class,
  ].filter(Boolean) as string[];

  const role = props.role ?? (mode === 'single' ? 'radiogroup' : 'group');

  return (
    <mat-button-toggle-group
      id={props.id}
      class={classes}
      role={role}
      aria-disabled={props.disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-button-toggle-group>
  );
});
```

Notes for the implementer:
- **`useContext(MAT_BUTTON_TOGGLE_CONFIG, CONFIG_DEFAULTS)` with DEFAULTS fallback** — required per Global Constraints (Progress Bar/Spinner lesson).
- **`useContextProvider(MAT_BUTTON_TOGGLE_GROUP_STATE, state)`** — the state object is a plain literal with primitive fields + one QRL, no `noSerialize` needed.
- **`onToggle` created with `$(...)` inline** — Qwik hoists it as a QRL. Captured `mode`, `onChange$`, `onValuesChange$`, `propValues` are re-resolved each render, so callback swaps work.
- **Consumer `role` prop overrides the mode default** — matches divider/list role-prop pattern.
- **`mat-button-toggle-standard` class always emitted** — no other appearance variant in this port (spec §5 deviation #8), but the class hook is preserved for CSS-selector parity with upstream stylesheets.
- **Class ladder cast pattern** — `.filter(Boolean) as string[]` for Qwik's `ClassList` type quirk.

- [ ] **Step 2: Create `src/qwik-material/button-toggle/mat-button-toggle-group.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatButtonToggleGroup} from './mat-button-toggle-group';

describe('MatButtonToggleGroup (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatButtonToggleGroup).toBeDefined();
    expect(typeof MatButtonToggleGroup).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test button-toggle/mat-button-toggle-group
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/button-toggle/mat-button-toggle-group.tsx
```

Expected: no matches.

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/button-toggle/mat-button-toggle-group.tsx
```

Expected: no matches.

- [ ] **Step 6: Verify no useVisibleTask$ / useStore / useTask$**

```bash
grep -nE "useVisibleTask|useStore|useTask" src/qwik-material/button-toggle/mat-button-toggle-group.tsx
```

Expected: no matches. State is derived fresh each render.

- [ ] **Step 7: Full-suite regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: full suite passes; total = pre-Task-4 total + 1 passing (this task's smoke), zero failures.

- [ ] **Step 8: Commit**

```bash
git add src/qwik-material/button-toggle/mat-button-toggle-group.tsx src/qwik-material/button-toggle/mat-button-toggle-group.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatButtonToggleGroup container (controlled component + per-instance state context)

Controlled component pair with MatButtonToggle. Group takes value +
onChange$ (single mode) or values + onValuesChange$ (multi mode) via QRL
callbacks. Creates a single onToggle QRL that internally forks by mode,
then publishes it (along with current selection + cascading disabled +
form name) via useContextProvider(MAT_BUTTON_TOGGLE_GROUP_STATE, ...).

Reads MAT_BUTTON_TOGGLE_CONFIG with CONFIG_DEFAULTS fallback (SSR-safe
per Progress Bar/Spinner lesson). Default role is 'radiogroup' (single)
or 'group' (multi); consumer prop overrides. Class ladder includes
mat-button-toggle-group-multiple only in multi mode. No lifecycle,
no useVisibleTask$, no useStore — state derived from props each render.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Toggle component

### Task 5: `<MatButtonToggle>` child component

**Reference source:** `src/material/button-toggle/button-toggle.ts` `MatButtonToggle` class (lines 548-793) + `button-toggle.html` (36 LOC template inlined). Reads parent state via context; standalone toggles own their own local checked state via useSignal (identity check on onToggle detects standalone mode).

**Files:**
- Create: `src/qwik-material/button-toggle/mat-button-toggle.tsx`
- Create: `src/qwik-material/button-toggle/mat-button-toggle.spec.tsx`

**Interfaces:**
- Consumes:
  - `MAT_BUTTON_TOGGLE_GROUP_STATE` + `MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS` from Task 3
- Produces:
  - `interface MatButtonToggleProps` — 8 fields per spec §3.2
  - `const MatButtonToggle: Component<MatButtonToggleProps>`

- [ ] **Step 1: Create `src/qwik-material/button-toggle/mat-button-toggle.tsx`**

Contents:

```tsx
import {component$, Slot, useContext, useSignal, $} from '@builder.io/qwik';
import {
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
} from './button-toggle-group-state';

/**
 * Props for <MatButtonToggle>. Rendered as <mat-button-toggle> with an inner
 * <button type="button"> wrapper matching upstream's template for CSS-selector
 * parity. Reads parent group state via MAT_BUTTON_TOGGLE_GROUP_STATE (or falls
 * back to DEFAULTS when standalone). See design spec §3.2 for rendered DOM.
 */
export interface MatButtonToggleProps {
  /** The value this button represents in the group's selection. Required. */
  value: unknown;
  /** Individually disables this button (in addition to group-level disabled). */
  disabled?: boolean;
  /** Optional id. If omitted, no id is emitted (no auto-generated `mat-button-toggle-N`
   *  — spec §5 deviation #10 dropped _IdGenerator). */
  id?: string;
  /** Individual name override — falls back to group's `name` prop. */
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
}

export const MatButtonToggle = component$<MatButtonToggleProps>(props => {
  // Read parent state; SSR-safe fallback for standalone toggles.
  const state = useContext(MAT_BUTTON_TOGGLE_GROUP_STATE, MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS);

  // Standalone detection — identity check on the no-op onToggle. If the
  // context returned the DEFAULTS, this toggle is not inside a group; own
  // local checked state via useSignal (initial value: false).
  const isStandalone = state.onToggle === MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle;
  const localChecked = useSignal(false);

  // Compute effective checked state.
  const checked = isStandalone
    ? localChecked.value
    : state.mode === 'single'
      ? state.value === props.value
      : state.values.includes(props.value);

  // Compute effective disabled (group + individual).
  const effectiveDisabled = state.disabled || (props.disabled ?? false);

  // Compute effective role.
  const role = isStandalone
    ? 'button'
    : state.mode === 'single'
      ? 'radio'
      : 'checkbox';

  // Class ladder.
  const classes = [
    'mat-button-toggle',
    checked && 'mat-button-toggle-checked',
    props.class,
  ].filter(Boolean) as string[];

  // Form-name: individual name overrides group name.
  const effectiveName = props.name ?? state.name;

  // Click handler — routes through parent's onToggle QRL when grouped,
  // or flips local signal when standalone.
  const onClick$ = $(async () => {
    if (effectiveDisabled) return;
    if (isStandalone) {
      localChecked.value = !localChecked.value;
    } else {
      await state.onToggle(props.value, !checked);
    }
  });

  return (
    <mat-button-toggle
      id={props.id}
      class={classes}
      role={role}
      aria-checked={!isStandalone ? (checked ? 'true' : 'false') : undefined}
      aria-pressed={isStandalone ? (checked ? 'true' : 'false') : undefined}
      aria-disabled={effectiveDisabled ? 'true' : 'false'}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
      tabIndex={0}
    >
      <button
        type="button"
        class="mat-button-toggle-button"
        tabIndex={-1}
        onClick$={onClick$}
      >
        <span class="mat-button-toggle-label-content">
          <Slot />
        </span>
      </button>
      {!isStandalone && effectiveName && checked && (
        <input type="hidden" name={effectiveName} value={String(props.value)} />
      )}
    </mat-button-toggle>
  );
});
```

Notes for the implementer:
- **`useContext(MAT_BUTTON_TOGGLE_GROUP_STATE, MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS)`** — required DEFAULTS fallback. Standalone toggles get the DEFAULTS.
- **Standalone detection via identity check** — `state.onToggle === MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle`. If true, allocate `useSignal(false)` for local checked. Otherwise derive from context.
- **`useSignal(false)` is always called** — must be at the top of the render function per Qwik's rules-of-hooks equivalent. When grouped, the signal is unused but declaring it keeps the render function deterministic. Cheap.
- **`role="button"` when standalone; `role="radio"` in single-mode group; `role="checkbox"` in multi-mode group** — matches spec §3.2.
- **`aria-checked` only in group modes (radio/checkbox); `aria-pressed` only standalone (button)** — mutually exclusive per ARIA spec.
- **`aria-disabled` always emitted** — reflects `state.disabled || props.disabled`.
- **`tabIndex={0}` on the host, `tabIndex={-1}` on the inner `<button>`** — native Tab moves between hosts; inner button absorbs clicks but not Tab focus. Matches spec keyboard nav decision (Q2 → native Tab per button).
- **Inner `<button type="button">` prevents form-submit** when nested inside a `<form>` (upstream uses the same `type="button"`).
- **Hidden `<input>` rendered only when NOT standalone AND `effectiveName` non-empty AND `checked`** — matches spec §3.2. `String(props.value)` for the serialized form-value (consumers using non-string values should stringify themselves).
- **Click handler uses `$(...)` with await** — `state.onToggle` is a QRL, so calling it requires await. `localChecked.value = !localChecked.value` in the standalone branch is synchronous.

- [ ] **Step 2: Create `src/qwik-material/button-toggle/mat-button-toggle.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatButtonToggle} from './mat-button-toggle';

describe('MatButtonToggle (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatButtonToggle).toBeDefined();
    expect(typeof MatButtonToggle).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test button-toggle/mat-button-toggle
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/button-toggle/mat-button-toggle.tsx
```

Expected: no matches.

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/button-toggle/mat-button-toggle.tsx
```

Expected: no matches.

- [ ] **Step 6: Verify no useVisibleTask$ / useStore / useTask$**

```bash
grep -nE "useVisibleTask|useStore|useTask" src/qwik-material/button-toggle/mat-button-toggle.tsx
```

Expected: no matches. Local checked state uses `useSignal` only.

- [ ] **Step 7: Full-suite regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: full suite passes; total = pre-Task-5 total + 1 passing, zero failures.

- [ ] **Step 8: Commit**

```bash
git add src/qwik-material/button-toggle/mat-button-toggle.tsx src/qwik-material/button-toggle/mat-button-toggle.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatButtonToggle child (reads group state, computes checked, fires onToggle)

Reads MAT_BUTTON_TOGGLE_GROUP_STATE with DEFAULTS fallback (SSR-safe).
Standalone detection via identity check on onToggle — if the toggle got
the DEFAULTS, it owns its own local useSignal(false) for checked state;
otherwise checked is derived from context (state.value === props.value
in single mode, state.values.includes(props.value) in multi mode).

Role: 'radio' (single-mode group), 'checkbox' (multi-mode group), 'button'
(standalone). aria-checked in group modes; aria-pressed standalone.
tabIndex=0 on host + tabIndex=-1 on inner <button> for native Tab per
button (no arrow-key handler per spec §5 deviation #5).

Hidden <input> rendered inside checked toggles only when group.name is
set — participates in native HTML form submission without CVA.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Provider extension

### Task 6: Extend `<QwikMaterialProvider>` with `matButtonToggleConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (currently ships 12 `useContextProvider` calls after List). Adding button-toggle makes it 13.

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-button-toggle.spec.tsx`

**Interfaces:**
- Consumes: `MatButtonToggleConfig` + `MAT_BUTTON_TOGGLE_CONFIG` from Task 3.
- Produces: an extended `QwikMaterialProviderProps.matButtonToggleConfig?: MatButtonToggleConfig` field + a 13th `useContextProvider(MAT_BUTTON_TOGGLE_CONFIG, ...)` call. All 12 pre-existing provider calls unchanged.

- [ ] **Step 1: Extend the imports at the top of `qwik-material-provider.tsx`**

Read the file's current import block. Add two import lines after the list import block:

```tsx
import type {MatButtonToggleConfig} from '../button-toggle/button-toggle-config';
import {MAT_BUTTON_TOGGLE_CONFIG} from '../button-toggle/button-toggle-config';
```

- [ ] **Step 2: Extend `QwikMaterialProviderProps` with the `matButtonToggleConfig?` field**

Append to the interface body (after `matListConfig`), with a doc comment:

```tsx
  /** Defaults applied to every MatButtonToggleGroup / MatButtonToggle in this subtree. */
  matButtonToggleConfig?: MatButtonToggleConfig;
```

- [ ] **Step 3: Add the 13th `useContextProvider` call at the end of the component body**

Append AFTER the `useContextProvider(MAT_LIST_CONFIG, props.matListConfig ?? {});` line and BEFORE the `return <Slot />;`:

```tsx
  // MatButtonToggleConfig is a plain object (currently empty) — no noSerialize
  // needed. Button toggles outside a provider get the CONFIG_DEFAULTS declared
  // in MatButtonToggleGroup; providing an empty object is equivalent to
  // accepting all defaults.
  useContextProvider(MAT_BUTTON_TOGGLE_CONFIG, props.matButtonToggleConfig ?? {});
```

Verify all 12 pre-existing `useContextProvider` calls are untouched (in order: MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_ANIMATIONS_DISABLED, MAT_BUTTON_CONFIG, MAT_CARD_CONFIG, MAT_BADGE_CONFIG, MAT_ICON_CONFIG, MAT_PROGRESS_BAR_CONFIG, MAT_PROGRESS_SPINNER_CONFIG, MAT_DIVIDER_CONFIG, MAT_GRID_LIST_CONFIG, MAT_LIST_CONFIG).

- [ ] **Step 4: Create the provider-button-toggle smoke spec `qwik-material-provider-button-toggle.spec.tsx`**

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatButtonToggleConfig} from '../button-toggle/button-toggle-config';

describe('QwikMaterialProvider — matButtonToggleConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts an empty matButtonToggleConfig', () => {
    const cfg: MatButtonToggleConfig = {};
    const props: QwikMaterialProviderProps = {matButtonToggleConfig: cfg};
    expect(props.matButtonToggleConfig).toBeDefined();
  });

  it('QwikMaterialProviderProps.matButtonToggleConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matButtonToggleConfig).toBeUndefined();
  });
});
```

- [ ] **Step 5: Run the provider spec**

```bash
pnpm -C src/qwik-material test qwik-material-provider-button-toggle
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
  src/qwik-material/dialog/qwik-material-provider-button-toggle.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): extend QwikMaterialProvider with matButtonToggleConfig

Adds the 13th useContextProvider call (after MAT_LIST_CONFIG). All 12
pre-existing provider calls preserved unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Public API

### Task 7: `button-toggle/public-api.ts` + `button-toggle/index.ts` + build verification

**Reference source:** design spec §3.6 (10 exports total).

**Files:**
- Create: `src/qwik-material/button-toggle/public-api.ts`
- Modify: `src/qwik-material/button-toggle/index.ts` (was empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Tasks 3, 4, 5.
- Produces: the exact public export surface consumers see when they import from `@angular-community/qwik-material/button-toggle`. **10 total exports:** 5 types + 3 values + 2 components.

- [ ] **Step 1: Create `src/qwik-material/button-toggle/public-api.ts`**

Contents (matches design spec §3.6 verbatim):

```ts
// Public API for @angular-community/qwik-material/button-toggle.
// See docs/superpowers/specs/2026-08-11-qwik-material-button-toggle-port-design.md §3.

export type {MatButtonToggleConfig} from './button-toggle-config';
export {MAT_BUTTON_TOGGLE_CONFIG} from './button-toggle-config';

export type {
  MatButtonToggleGroupState,
  MatButtonToggleGroupMode,
} from './button-toggle-group-state';
export {
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
} from './button-toggle-group-state';

export {
  MatButtonToggleGroup,
  type MatButtonToggleGroupProps,
} from './mat-button-toggle-group';

export {
  MatButtonToggle,
  type MatButtonToggleProps,
} from './mat-button-toggle';
```

- [ ] **Step 2: Replace the empty stub in `src/qwik-material/button-toggle/index.ts`**

Replace the entire file (was `export {};` from Task 1) with:

```ts
export * from './public-api';
```

- [ ] **Step 3: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. No Rollup `Illegal reassignment of import` errors (button-toggle components are pure — no module-level mutable state).

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify all 10 symbols are present in the emitted d.ts**

```bash
for sym in MatButtonToggleConfig MAT_BUTTON_TOGGLE_CONFIG \
           MatButtonToggleGroupState MatButtonToggleGroupMode \
           MAT_BUTTON_TOGGLE_GROUP_STATE MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS \
           MatButtonToggleGroup MatButtonToggleGroupProps \
           MatButtonToggle MatButtonToggleProps; do
  count=$(grep -c "\b${sym}\b" src/qwik-material/dist/button-toggle/public-api.d.ts 2>/dev/null || echo 0)
  echo "$sym: $count"
done
```

Expected: each symbol reports `1` or greater.

Confirm no leaked classes:

```bash
grep -nE "^export declare class" src/qwik-material/dist/button-toggle/public-api.d.ts
```

Expected: no output.

Confirm `CONFIG_DEFAULTS` from `mat-button-toggle-group.tsx` is NOT leaked:

```bash
grep -nE "\bCONFIG_DEFAULTS\b" src/qwik-material/dist/button-toggle/public-api.d.ts
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/button-toggle/public-api.ts src/qwik-material/button-toggle/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): finalize qwik-material/button-toggle public API

10 exports total: MatButtonToggleConfig type + MAT_BUTTON_TOGGLE_CONFIG
value + MatButtonToggleGroupState/Mode types + MAT_BUTTON_TOGGLE_GROUP_STATE
+ MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS values + MatButtonToggleGroup +
MatButtonToggleGroupProps + MatButtonToggle + MatButtonToggleProps.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Vitest scenario port

### Task 8: Vitest scenario port from `src/material/button-toggle/button-toggle.spec.ts`

**Reference source:** `src/material/button-toggle/button-toggle.spec.ts` (1379 LOC — heavy on `SelectionModel` internals, `EventEmitter.emit()` assertions, `FocusMonitor` origin tracking, keyboard arrow-key handlers, ripple, form CVA integration). All of that is moot in the port (spec §5 deviations #1-#9). Restructured per spec §6.1.

**Files:**
- Create: `src/qwik-material/button-toggle/mat-button-toggle-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 7.
- Produces: consolidated scenario coverage documenting upstream test intent.

- [ ] **Step 1: Write the scenario spec**

Contents:

```tsx
/**
 * MatButtonToggle scenario port from src/material/button-toggle/button-toggle.spec.ts.
 *
 * Upstream has ~60+ `it()` blocks — heavy on SelectionModel internals,
 * EventEmitter.emit() assertions, FocusMonitor origin tracking, keyboard
 * arrow-key handlers, ripple, and Angular Forms (CVA) integration. All
 * of that is moot in the port (spec §5 deviations #1-#9). Restructured:
 *
 *   - Live sanity tests (7): typeof + context ids + DEFAULTS shape +
 *     no-op onToggle safety + mode union + props shapes.
 *   - describe.skip DOM-rendered (7): group + child roles, single-mode
 *     toggle + deselect, multi-mode toggle, group-level disabled,
 *     individual disabled, form-name hidden input. Deferred to
 *     Playwright Task 9 + verified live at Task 11.
 *   - describe.skip Angular-only (4): CVA, SelectionModel, FocusMonitor
 *     + arrow keys, ripple + PseudoCheckbox + IdGenerator + niche flags.
 *     Deferred forever per spec §5.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-button-toggle/*.spec.ts,
 * verified against a running Chromium preview in Task 11.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_BUTTON_TOGGLE_CONFIG,
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
  MatButtonToggleGroup,
  MatButtonToggle,
  type MatButtonToggleConfig,
  type MatButtonToggleGroupState,
  type MatButtonToggleGroupMode,
  type MatButtonToggleGroupProps,
  type MatButtonToggleProps,
} from './public-api';

describe('MatButtonToggle surface — sanity', () => {
  it('MatButtonToggleGroup and MatButtonToggle are exported and function-shaped', () => {
    expect(typeof MatButtonToggleGroup).toBe('function');
    expect(typeof MatButtonToggle).toBe('function');
  });

  it('MAT_BUTTON_TOGGLE_CONFIG carries the expected context id + empty config accepts {}', () => {
    expect(MAT_BUTTON_TOGGLE_CONFIG.id).toBe('qwik-material/button-toggle-config');
    const cfg: MatButtonToggleConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MAT_BUTTON_TOGGLE_GROUP_STATE carries expected id + DEFAULTS has all 6 fields', () => {
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE.id).toBe('qwik-material/button-toggle-group-state');
    expect(MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS).toEqual({
      mode: 'single',
      value: undefined,
      values: [],
      disabled: false,
      name: '',
      onToggle: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle,
    });
    expect(typeof MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle).toBe('function');
  });

  it('DEFAULTS.onToggle is a no-op that does not throw when invoked', async () => {
    // The no-op QRL should be safely invokable by a standalone toggle's fallback path.
    await expect(
      MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle('foo', true),
    ).resolves.toBeUndefined();
  });

  it('MatButtonToggleGroupMode union covers exactly "single" | "multi"', () => {
    const single: MatButtonToggleGroupMode = 'single';
    const multi: MatButtonToggleGroupMode = 'multi';
    expect(single).toBe('single');
    expect(multi).toBe('multi');
  });

  it('MatButtonToggleGroupProps accepts full single-mode surface', () => {
    const props: MatButtonToggleGroupProps = {
      multiple: false,
      value: 'bold',
      onChange$: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle as any,
      disabled: false,
      name: 'style',
      role: 'radiogroup',
      'aria-label': 'Text style',
      'aria-labelledby': 'style-heading',
      'aria-describedby': 'style-desc',
      class: 'my-group',
      id: 'style-group',
    };
    expect(props.value).toBe('bold');
    expect(props.multiple).toBe(false);
  });

  it('MatButtonToggleGroupProps accepts multi-mode surface + MatButtonToggleProps accepts full surface', () => {
    const groupProps: MatButtonToggleGroupProps = {
      multiple: true,
      values: ['read', 'write'],
      onValuesChange$: MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle as any,
      disabled: true,
      name: 'perms',
    };
    const toggleProps: MatButtonToggleProps = {
      value: 'bold',
      disabled: false,
      id: 'bold-toggle',
      name: 'style-override',
      'aria-label': 'Bold',
      'aria-labelledby': 'bold-heading',
      'aria-describedby': 'bold-desc',
      class: 'my-toggle',
    };
    expect(groupProps.values).toEqual(['read', 'write']);
    expect(toggleProps.value).toBe('bold');
  });
});

describe.skip('MatButtonToggle DOM-rendered scenarios — deferred to Playwright Task 9', () => {
  it('MatButtonToggleGroup renders <mat-button-toggle-group> with role="radiogroup" in single mode + role="group" + mat-button-toggle-group-multiple class in multi mode', () => {});
  it('MatButtonToggle in single-mode group renders role="radio" + aria-checked; in multi mode renders role="checkbox" + aria-checked; standalone renders role="button" + aria-pressed', () => {});
  it('Clicking a MatButtonToggle in single mode fires onChange$(value); clicking currently-selected toggle fires onChange$(undefined)', () => {});
  it('Clicking a MatButtonToggle in multi mode adds/removes from values array via onValuesChange$', () => {});
  it('Group-level disabled cascades: all children reflect aria-disabled="true" and are non-interactive', () => {});
  it('Individual-button disabled reflects aria-disabled="true" on that button only; group and siblings unaffected', () => {});
  it('name prop on group: checked toggles emit <input name value>; unchecked do not', () => {});
});

describe.skip('MatButtonToggle — Angular-only tests', () => {
  it('should implement ControlValueAccessor (writeValue / registerOnChange / setDisabledState)', () => {
    // Omitted — Qwik has no forms system (spec §5 deviation #1).
  });
  it('should manage selection via SelectionModel + .selected / .deselect / .toggle API', () => {
    // Replaced by plain arrays + context (spec §5 deviation #2).
  });
  it('should use FocusMonitor + roving tabindex + arrow-key navigation', () => {
    // Native Tab per button; no arrow keys (spec §5 deviations #4, #5).
  });
  it('should integrate ripple + MatPseudoCheckbox + _IdGenerator + legacy appearance + vertical + hideIndicator + disabledInteractive', () => {
    // All out of scope (spec §5 deviations #6, #7, #8).
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
pnpm -C src/qwik-material test button-toggle/mat-button-toggle-scenarios
```

Expected: 7 passing + 11 skipped, exit 0.

- [ ] **Step 3: Run the full qwik-material suite for regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-8 total + 7 passing + 11 skipped, zero failures. Cumulative new passes over the port (Tasks 3-8): 5 (Task 3 state) + 1 (Task 4 group smoke) + 1 (Task 5 toggle smoke) + 3 (Task 6 provider) + 7 (Task 8 scenarios) = 17. Baseline post-list was 235 pass → target after this task is **252 pass** (verify at implementation).

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/button-toggle/mat-button-toggle-scenarios.spec.tsx
git commit -m "$(cat <<'EOF'
test(multiple): port MatButtonToggle scenarios from upstream button-toggle.spec.ts

18 it() blocks total: 7 live sanity + 7 describe.skip DOM stubs (deferred
to Playwright Task 9 + verified live at Task 11) + 4 describe.skip
Angular-only stubs (deferred forever per spec §5). No createDOM —
smoke variant only.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Dev-app + Playwright parity

### Task 9: 7 mat-button-toggle dev-app routes + root.tsx CSS import + routes/index.tsx "Button toggles" section + 7 Playwright parity specs

**Reference source:** existing dev-app + Playwright patterns from List port at `src/qwik-cdk-dev-app/src/routes/mat-list/` and `src/qwik-cdk-parity-tests/specs/material-list/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add button-toggle-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Button toggles" section with 7 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button-toggle/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button-toggle/multi/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button-toggle/disabled-group/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button-toggle/disabled-individual/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button-toggle/preselected/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button-toggle/form-name/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-button-toggle/standalone/index.tsx`
- Create: `src/qwik-cdk-parity-tests/specs/material-button-toggle/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button-toggle/multi.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button-toggle/disabled-group.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button-toggle/disabled-individual.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button-toggle/preselected.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button-toggle/form-name.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-button-toggle/standalone.spec.ts`

**Interfaces:**
- Consumes: `@angular-community/qwik-material/button-toggle` (Task 7).
- Produces: 7 dev-app routes at `/mat-button-toggle/*` + 7 Playwright specs asserting host tags + classes + attrs + interaction outcomes.

- [ ] **Step 1: Add the button-toggle-prebuilt.css import to `src/qwik-cdk-dev-app/src/root.tsx`**

Read the current file. Append the button-toggle CSS import after the list one:

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
import '@angular-community/qwik-material/button-toggle-prebuilt.css';
```

- [ ] **Step 2: Add a "Button toggles" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert after the existing "Lists" section:

```tsx
<section>
  <h2>Button toggles</h2>
  <ul>
    <li><a href="/mat-button-toggle/basic/">basic</a></li>
    <li><a href="/mat-button-toggle/multi/">multi</a></li>
    <li><a href="/mat-button-toggle/disabled-group/">disabled-group</a></li>
    <li><a href="/mat-button-toggle/disabled-individual/">disabled-individual</a></li>
    <li><a href="/mat-button-toggle/preselected/">preselected</a></li>
    <li><a href="/mat-button-toggle/form-name/">form-name</a></li>
    <li><a href="/mat-button-toggle/standalone/">standalone</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx` — single-select 3-toggle group**

```tsx
import {component$, useSignal} from '@builder.io/qwik';
import {MatButtonToggleGroup, MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const style = useSignal<'bold' | 'italic' | 'underline' | undefined>(undefined);

  return (
    <>
      <MatButtonToggleGroup
        value={style.value}
        onChange$={(v: unknown) => {
          style.value = v as 'bold' | 'italic' | 'underline' | undefined;
        }}
        aria-label="Text style"
      >
        <MatButtonToggle value="bold">Bold</MatButtonToggle>
        <MatButtonToggle value="italic">Italic</MatButtonToggle>
        <MatButtonToggle value="underline">Underline</MatButtonToggle>
      </MatButtonToggleGroup>
      <p>Selected: {style.value ?? '(none)'}</p>
      <main data-scenario-ready>ready</main>
    </>
  );
});
```

- [ ] **Step 4: Create `multi/index.tsx` — multi-select 3-toggle group**

```tsx
import {component$, useSignal} from '@builder.io/qwik';
import {MatButtonToggleGroup, MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const perms = useSignal<readonly string[]>([]);

  return (
    <>
      <MatButtonToggleGroup
        multiple
        values={perms.value}
        onValuesChange$={(vs: readonly unknown[]) => {
          perms.value = vs as readonly string[];
        }}
        aria-label="Permissions"
      >
        <MatButtonToggle value="read">Read</MatButtonToggle>
        <MatButtonToggle value="write">Write</MatButtonToggle>
        <MatButtonToggle value="admin">Admin</MatButtonToggle>
      </MatButtonToggleGroup>
      <p>Selected: {perms.value.join(', ') || '(none)'}</p>
      <main data-scenario-ready>ready</main>
    </>
  );
});
```

- [ ] **Step 5: Create `disabled-group/index.tsx`**

```tsx
import {component$, useSignal} from '@builder.io/qwik';
import {MatButtonToggleGroup, MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const style = useSignal<string | undefined>('bold');

  return (
    <>
      <MatButtonToggleGroup
        value={style.value}
        disabled
        onChange$={(v: unknown) => {
          style.value = v as string | undefined;
        }}
        aria-label="Text style (disabled group)"
      >
        <MatButtonToggle value="bold">Bold</MatButtonToggle>
        <MatButtonToggle value="italic">Italic</MatButtonToggle>
        <MatButtonToggle value="underline">Underline</MatButtonToggle>
      </MatButtonToggleGroup>
      <main data-scenario-ready>ready</main>
    </>
  );
});
```

- [ ] **Step 6: Create `disabled-individual/index.tsx`**

```tsx
import {component$, useSignal} from '@builder.io/qwik';
import {MatButtonToggleGroup, MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const style = useSignal<string | undefined>(undefined);

  return (
    <>
      <MatButtonToggleGroup
        value={style.value}
        onChange$={(v: unknown) => {
          style.value = v as string | undefined;
        }}
        aria-label="Text style (middle disabled)"
      >
        <MatButtonToggle value="bold">Bold</MatButtonToggle>
        <MatButtonToggle value="italic" disabled>Italic</MatButtonToggle>
        <MatButtonToggle value="underline">Underline</MatButtonToggle>
      </MatButtonToggleGroup>
      <p>Selected: {style.value ?? '(none)'}</p>
      <main data-scenario-ready>ready</main>
    </>
  );
});
```

- [ ] **Step 7: Create `preselected/index.tsx` — verifies SSR renders initial checked state**

```tsx
import {component$, useSignal} from '@builder.io/qwik';
import {MatButtonToggleGroup, MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  // Initial signal value = 'italic' → SSR should render italic as checked
  // WITHOUT client-side flash. Playwright verifies via first-paint HTML.
  const style = useSignal<string | undefined>('italic');

  return (
    <>
      <MatButtonToggleGroup
        value={style.value}
        onChange$={(v: unknown) => {
          style.value = v as string | undefined;
        }}
        aria-label="Text style (preselected italic)"
      >
        <MatButtonToggle value="bold">Bold</MatButtonToggle>
        <MatButtonToggle value="italic">Italic</MatButtonToggle>
        <MatButtonToggle value="underline">Underline</MatButtonToggle>
      </MatButtonToggleGroup>
      <main data-scenario-ready>ready</main>
    </>
  );
});
```

- [ ] **Step 8: Create `form-name/index.tsx` — verifies hidden `<input>` for form submission**

```tsx
import {component$, useSignal} from '@builder.io/qwik';
import {MatButtonToggleGroup, MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

export default component$(() => {
  const style = useSignal<string | undefined>('bold');

  return (
    <>
      <form>
        <MatButtonToggleGroup
          name="text-style"
          value={style.value}
          onChange$={(v: unknown) => {
            style.value = v as string | undefined;
          }}
          aria-label="Text style (form-name)"
        >
          <MatButtonToggle value="bold">Bold</MatButtonToggle>
          <MatButtonToggle value="italic">Italic</MatButtonToggle>
          <MatButtonToggle value="underline">Underline</MatButtonToggle>
        </MatButtonToggleGroup>
      </form>
      <main data-scenario-ready>ready</main>
    </>
  );
});
```

- [ ] **Step 9: Create `standalone/index.tsx` — no group ancestor, local signal owns state**

```tsx
import {component$} from '@builder.io/qwik';
import {MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

export default component$(() => (
  <>
    <MatButtonToggle value="favorite" aria-label="Favorite">
      ★ Favorite
    </MatButtonToggle>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 10: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Confirm client + SSR builds succeed. Verify 7 mat-button-toggle routes in the manifest:

```bash
grep -oE 'mat-button-toggle/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `7`.

List them explicitly:

```bash
grep -oE 'mat-button-toggle/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u
```

Expected:
```
mat-button-toggle/basic
mat-button-toggle/disabled-group
mat-button-toggle/disabled-individual
mat-button-toggle/form-name
mat-button-toggle/multi
mat-button-toggle/preselected
mat-button-toggle/standalone
```

- [ ] **Step 11: Create `basic.spec.ts` — Playwright**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/basic — <mat-button-toggle-group role="radiogroup"> with 3 radio children; clicking one sets aria-checked + .mat-button-toggle-checked', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-button-toggle-group');
  await expect(group).toBeVisible();
  await expect(group).toHaveAttribute('role', 'radiogroup');
  await expect(group).toHaveClass(/mat-button-toggle-group/);
  await expect(group).toHaveClass(/mat-button-toggle-standard/);

  const toggles = page.locator('mat-button-toggle');
  await expect(toggles).toHaveCount(3);
  await expect(toggles.nth(0)).toHaveAttribute('role', 'radio');

  // Initial state: none checked.
  for (let i = 0; i < 3; i++) {
    await expect(toggles.nth(i)).toHaveAttribute('aria-checked', 'false');
    await expect(toggles.nth(i)).not.toHaveClass(/mat-button-toggle-checked/);
  }

  // Click "italic" (index 1).
  await toggles.nth(1).locator('button.mat-button-toggle-button').click();

  await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(1)).toHaveClass(/mat-button-toggle-checked/);
  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'false');
  await expect(toggles.nth(2)).toHaveAttribute('aria-checked', 'false');
});
```

- [ ] **Step 12: Create `multi.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/multi — role="group" + .mat-button-toggle-group-multiple; role="checkbox" children; click 2 in sequence; click again unchecks', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/multi/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-button-toggle-group');
  await expect(group).toHaveAttribute('role', 'group');
  await expect(group).toHaveClass(/mat-button-toggle-group-multiple/);

  const toggles = page.locator('mat-button-toggle');
  await expect(toggles).toHaveCount(3);
  await expect(toggles.nth(0)).toHaveAttribute('role', 'checkbox');

  // Click "read" then "write".
  await toggles.nth(0).locator('button.mat-button-toggle-button').click();
  await toggles.nth(1).locator('button.mat-button-toggle-button').click();

  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(2)).toHaveAttribute('aria-checked', 'false');

  // Click "read" again — unchecks.
  await toggles.nth(0).locator('button.mat-button-toggle-button').click();
  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'false');
  await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'true');
});
```

- [ ] **Step 13: Create `disabled-group.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/disabled-group — group aria-disabled=true, all children unclickable + opacity 0.38', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/disabled-group/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-button-toggle-group');
  await expect(group).toHaveAttribute('aria-disabled', 'true');

  const toggles = page.locator('mat-button-toggle');
  for (let i = 0; i < 3; i++) {
    const opacity = await toggles.nth(i).evaluate((el) => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeCloseTo(0.38, 1);
  }

  // Preselected "bold" (index 0) — verify it's still shown as checked SSR-side.
  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'true');

  // Attempt to click "italic" — should be no-op (pointer-events: none).
  // Playwright's click bypasses pointer-events by default, so use a force check:
  const italicBox = await toggles.nth(1).locator('button').boundingBox();
  expect(italicBox).not.toBeNull();
  // Direct evaluate to verify pointer-events computed style.
  const pe = await toggles.nth(1).evaluate((el) => getComputedStyle(el).pointerEvents);
  expect(pe).toBe('none');
});
```

- [ ] **Step 14: Create `disabled-individual.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/disabled-individual — middle child aria-disabled=true; others clickable', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/disabled-individual/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toggles = page.locator('mat-button-toggle');
  await expect(toggles.nth(0)).toHaveAttribute('aria-disabled', 'false');
  await expect(toggles.nth(1)).toHaveAttribute('aria-disabled', 'true');
  await expect(toggles.nth(2)).toHaveAttribute('aria-disabled', 'false');

  // Click first (enabled) — sets aria-checked.
  await toggles.nth(0).locator('button.mat-button-toggle-button').click();
  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'true');
});
```

- [ ] **Step 15: Create `preselected.spec.ts` — critical SSR verification**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/preselected — SSR renders italic as checked WITHOUT client-side flash', async ({page}) => {
  // Verify the SSR HTML already contains mat-button-toggle-checked on italic
  // BEFORE waiting for hydration signal. This catches the case where
  // initial checked state is only applied client-side.
  const response = await page.goto(`${BASE_URL}/mat-button-toggle/preselected/`);
  expect(response?.status()).toBe(200);
  const html = await response!.text();

  // The italic toggle's <mat-button-toggle> should carry mat-button-toggle-checked in the raw SSR HTML.
  const italicPattern = /<mat-button-toggle[^>]*mat-button-toggle-checked[^>]*>[^<]*<button[^>]*>[^<]*<span[^>]*>Italic<\/span>/;
  expect(html).toMatch(italicPattern);

  await page.waitForSelector('[data-scenario-ready]');

  // After hydration, italic still checked.
  const toggles = page.locator('mat-button-toggle');
  await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(1)).toHaveClass(/mat-button-toggle-checked/);
});
```

- [ ] **Step 16: Create `form-name.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/form-name — hidden <input name="text-style" value> emitted inside checked toggle only', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/form-name/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toggles = page.locator('mat-button-toggle');

  // Preselected 'bold' — hidden input inside bold.
  const boldHidden = toggles.nth(0).locator('input[type="hidden"]');
  await expect(boldHidden).toHaveAttribute('name', 'text-style');
  await expect(boldHidden).toHaveAttribute('value', 'bold');

  // Non-checked children have no hidden input.
  await expect(toggles.nth(1).locator('input[type="hidden"]')).toHaveCount(0);
  await expect(toggles.nth(2).locator('input[type="hidden"]')).toHaveCount(0);

  // Switch to italic.
  await toggles.nth(1).locator('button.mat-button-toggle-button').click();

  // Hidden input moves to italic.
  await expect(toggles.nth(0).locator('input[type="hidden"]')).toHaveCount(0);
  const italicHidden = toggles.nth(1).locator('input[type="hidden"]');
  await expect(italicHidden).toHaveAttribute('name', 'text-style');
  await expect(italicHidden).toHaveAttribute('value', 'italic');
});
```

- [ ] **Step 17: Create `standalone.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/standalone — <mat-button-toggle role="button" aria-pressed="false">; click flips aria-pressed + .mat-button-toggle-checked via local signal', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/standalone/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toggle = page.locator('mat-button-toggle');
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toHaveAttribute('role', 'button');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).not.toHaveClass(/mat-button-toggle-checked/);

  // Click via inner <button>.
  await toggle.locator('button.mat-button-toggle-button').click();

  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveClass(/mat-button-toggle-checked/);

  // Click again — flips back.
  await toggle.locator('button.mat-button-toggle-button').click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});
```

- [ ] **Step 18: Do NOT run Playwright in this task**

Playwright execution is Task 11's responsibility. This task ships the specs and typechecks them.

- [ ] **Step 19: Verify the parity-tests package typechecks**

```bash
pnpm -C src/qwik-cdk-parity-tests typecheck
```

Expected: exit 0.

- [ ] **Step 20: Commit**

```bash
git add \
  src/qwik-cdk-dev-app/src/root.tsx \
  src/qwik-cdk-dev-app/src/routes/index.tsx \
  src/qwik-cdk-dev-app/src/routes/mat-button-toggle/ \
  src/qwik-cdk-parity-tests/specs/material-button-toggle/
git commit -m "$(cat <<'EOF'
feat(multiple): mat-button-toggle dev-app routes (7) + Playwright parity specs (7)

7 routes: basic (single-select 3 toggles + signal + onChange$), multi
(multi-select 3 toggles + signal + onValuesChange$), disabled-group,
disabled-individual, preselected (SSR renders italic as checked), form-name
(inside <form> — hidden <input name value>), standalone (no group ancestor,
local signal owns state).

7 Playwright specs targeting each route. Tag-based locators
(page.locator('mat-button-toggle-group') / 'mat-button-toggle'). preselected
spec asserts the RAW SSR HTML contains mat-button-toggle-checked class
BEFORE hydration to catch client-flash regressions.

Playwright execution deferred to Task 11 (dedicated runtime verification
task per the list-port lesson).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 10 — Finalisation

### Task 10: SYNC.md + full pipeline verification

**Reference source:** `src/qwik-material/list/SYNC.md` (existing SYNC pattern from the just-completed List port).

**Files:**
- Create: `src/qwik-material/button-toggle/SYNC.md`

**Interfaces:**
- Consumes: everything from Tasks 1-9.
- Produces: `SYNC.md` documenting the button-toggle port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/button-toggle/SYNC.md`**

Contents:

```markdown
# qwik-material/button-toggle sync log

Tracks the sync state between this port and `src/material/button-toggle/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`,
`src/qwik-material/grid-list/SYNC.md`, and
`src/qwik-material/list/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `button-toggle/mat-button-toggle-group.tsx` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggleGroup class, lines 124-547) | ported | Controlled-component surface. Drops SelectionModel/CVA/EventEmitter/FocusMonitor/@ContentChildren; replaces `change`/`valueChange` EventEmitters with `onChange$`/`onValuesChange$` QRLs; publishes per-instance MAT_BUTTON_TOGGLE_GROUP_STATE with the single `onToggle` QRL routed by mode. Reads MAT_BUTTON_TOGGLE_CONFIG with DEFAULTS fallback (SSR-safe). No lifecycle, no useVisibleTask$/useStore/useTask$ |
| `button-toggle/mat-button-toggle.tsx` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggle class, lines 548-793) + `button-toggle.html` (36 LOC template inlined) | ported | Reads MAT_BUTTON_TOGGLE_GROUP_STATE with DEFAULTS fallback; standalone detection via identity check on `onToggle` → useSignal(false) for local checked state. Computes role by mode (radio/checkbox/button). Inner `<button type="button" tabindex="-1">` absorbs clicks; host has `tabindex="0"` for native Tab per button. Hidden `<input>` only when `state.name` set AND checked. No focus indicator, no ripple, no pseudo-checkbox |
| `button-toggle/button-toggle-config.ts` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggleDefaultOptions interface + MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS InjectionToken, lines 62-90) | new | MatButtonToggleConfig = {} interface (empty today) + MAT_BUTTON_TOGGLE_CONFIG context id; folded into QwikMaterialProvider.matButtonToggleConfig for family shape parity. Upstream defaults (appearance/hideIndicator/disabledInteractive) all dropped per §5 deviation #8 |
| `button-toggle/button-toggle-group-state.ts` | (partial — `src/material/button-toggle/button-toggle.ts` MAT_BUTTON_TOGGLE_GROUP InjectionToken + internal group state) | new | Externalizes upstream's group-internal state (mode/value/values/disabled/name + a click handler) into a per-instance context so Qwik children can subscribe. First port on the branch to carry a QRL callback in a per-instance context; precedent-setting for future forms-tier ports |
| `scss/button-toggle/button-toggle.scss` | `src/material/button-toggle/button-toggle.scss` (381 LOC) | rewritten | ~100 LOC of standard-only segmented control; drops MDC state-layer + ripple + focus-indicator + pseudo-checkbox + legacy appearance variant + vertical mode (§5 deviations #6, #7, #8). Includes explicit `box-sizing: border-box` on both `.mat-button-toggle` and `.mat-button-toggle-button` per the list-port lesson. No `@use '@angular/cdk'` rewrite needed (matches Icon + Divider + Grid List + List precedent) |
| `scss/button-toggle/_button-toggle-theme.scss` | `src/material/button-toggle/_button-toggle-theme.scss` | synced | byte-identical copy; theme mixin inert on our end but kept for `diff -q` parity |
| `scss/button-toggle/_m2-button-toggle.scss` | `src/material/button-toggle/_m2-button-toggle.scss` | synced | byte-identical copy |
| `scss/button-toggle/_m3-button-toggle.scss` | `src/material/button-toggle/_m3-button-toggle.scss` | synced | byte-identical copy |
| `scss/button-toggle/button-toggle-prebuilt.scss` | (qwik-material-specific) | new | @use button-toggle.scss + :root defaults matching emitted --mat-button-toggle-* references (verified via Task 2 reconciliation loop) |

## Removed upstream files

- `button-toggle-module.ts` — Qwik has no module concept
- `testing/` (MatButtonToggleHarness) — Angular test harness surface; no equivalent needed
- Upstream `public-api.ts` — replaced with our own re-export shape (§3.6)
- `button-toggle.spec.ts` (1379 LOC) — ported to `mat-button-toggle-scenarios.spec.tsx` (18 it()) per smoke-only vitest constraint
- `button-toggle.html` (36 LOC) — trivial template inlined into JSX
- `MatButtonToggleDefaultOptions` interface + `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` InjectionToken — folded into MatButtonToggleConfig (empty today); defaults (appearance/hideIndicator/disabledInteractive) all dropped per §5 deviation #8
- `MatButtonToggleChange` class — event shape unneeded (QRLs receive raw values, not `{source, value}` objects)
- `SelectionModel<MatButtonToggle>` (RxJS-based) — replaced by plain arrays derived from props each render (§5 deviation #2)
- `ControlValueAccessor` interface + `NG_VALUE_ACCESSOR` provider — Qwik has no forms system (§5 deviation #1)
- `MatRipple` element inside each button — dropped (§5 deviation #6)
- `MatPseudoCheckbox` visual selection indicator — dropped (§5 deviation #7)

## Deviations from upstream

1. **`ControlValueAccessor` + `NG_VALUE_ACCESSOR` removed entirely.** Qwik has no equivalent forms system. Replaced by controlled-component pattern: consumer owns state via signals; group takes `value`/`values` + `onChange$`/`onValuesChange$` QRLs. Native form submission still works via hidden `<input>` inside checked buttons when `group.name` is set.

2. **`SelectionModel` (from `@angular/cdk/collections`, RxJS-based) removed.** Replaced by plain arrays derived from `props.values` each render. No `.selected` / `.select()` / `.deselect()` / `.toggle()` API surface — consumers manipulate their own signal via the QRL callback.

3. **`EventEmitter` `change` / `valueChange` removed.** Replaced by prop QRLs — no `.emit()` API surface.

4. **`FocusMonitor` + focus origin tracking removed.** Upstream uses `@angular/cdk/a11y` FocusMonitor to detect keyboard vs mouse focus and apply differentiated styling. Dropped — browser's native `:focus-visible` selector handles the visual case; keyboard-vs-mouse detection isn't ported.

5. **Keyboard arrow-key navigation removed.** Upstream binds LEFT/RIGHT/UP/DOWN/SPACE/ENTER with a roving tabindex pattern. Port uses native Tab per button (each toggle has `tabindex="0"` on the host): Tab moves between buttons, Enter/Space activates via the inner `<button type="button">`. Trade-off: differs from upstream's segmented-control ARIA convention (Tab enters the group once, arrows navigate within). Scope decision.

6. **Ripple system + `MatRipple` element removed.** Upstream renders `<span class="mat-button-toggle-ripple">` with a `MatRipple` directive. Dropped — consumers get `:active` / `:focus-visible` styling only. Matches every prior port.

7. **`MatPseudoCheckbox` visual selection indicator removed.** Upstream renders `<mat-pseudo-checkbox>` inside selected toggles as a ✓ indicator. Dropped — selected state visualized via `.mat-button-toggle-checked` background color only. Multi-select mode is visually less explicit than upstream. Consumers wanting an indicator can style `.mat-button-toggle-checked::before { content: '✓'; ... }`.

8. **Deprecated appearance variants + niche flags removed:**
   - `appearance: 'legacy'` — deprecated upstream; port ships `'standard'` only.
   - `vertical` prop — dropped.
   - `hideSingleSelectionIndicator` / `hideMultipleSelectionIndicator` — moot (no indicator shipped).
   - `disabledInteractive` — dropped as niche.

9. **`Directionality` (`@angular/cdk/bidi`) dependency removed.** Upstream reads `Directionality.value` to invert arrow-key handling in RTL. Since arrow-key nav is dropped (deviation #5), RTL falls out of native CSS — no code needed.

10. **Angular-specific removals:**
   - `@Input()` decorators + `booleanAttribute` transform + `HostAttributeToken` → TypeScript types + prop passthrough.
   - `@ContentChildren(MatButtonToggle)` QueryList → per-instance context; children self-detect.
   - `AfterContentInit` / `AfterViewInit` / `OnDestroy` / `OnInit` lifecycle → no lifecycle.
   - `_IdGenerator` auto-id generation → consumers pass `id` explicitly or omit.
   - `WritableSignal<number>` for tabIndex → static `tabindex="0"`.
   - `providers: [{provide: MAT_BUTTON_TOGGLE_GROUP, useExisting: MatButtonToggleGroup}]` → per-instance MAT_BUTTON_TOGGLE_GROUP_STATE context.
   - `exportAs: 'matButtonToggle' / 'matButtonToggleGroup'` → N/A.
   - Host bindings → plain JSX attribute passthrough.

## Stub inventory delta

No new stubs — the button-toggle SCSS chain does NOT reference `@angular/cdk` (grep-confirmed, matching Icon + Divider + Grid List + List precedent). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/button-toggle/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list + button-toggle.
```

- [ ] **Step 2: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** all 12 prebuilt CSS files emit; JS + d.ts under `dist/{...,button-toggle}/`.
- **Vitest:** all specs pass across 12 entry-points; total ≈ 252 pass (verify).
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 3: Verify the class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/button-toggle/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 4: Verify no SSR globals**

```bash
grep -RnE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/button-toggle/ | grep -v '\.spec\.'
```

Expected: no output.

- [ ] **Step 5: Verify no `isBrowser` / `useVisibleTask$` / `useStore` / `useTask$`**

```bash
grep -RnE "from '@builder\.io/qwik/build'" src/qwik-material/button-toggle/
grep -RnE "useVisibleTask|useStore|useTask" src/qwik-material/button-toggle/ | grep -v '\.spec\.'
```

Expected: no output for both.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/button-toggle/SYNC.md
git commit -m "$(cat <<'EOF'
docs(multiple): finalize qwik-material/button-toggle SYNC.md + pipeline verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 11 — Runtime Playwright verification (NEW)

### Task 11: Run the 7 Playwright specs against local Chromium

**Reference source:** list-port final review lesson — Task 11 previously typechecked but did NOT execute the Playwright specs; final review empirically found 2 layout bugs (missing `box-sizing: border-box`) that would have been caught by running the specs. This port's Task 11 explicitly bakes execution into the plan for the first time on the branch.

**Files:**
- Modify: (potentially) fixes to `src/qwik-material/scss/button-toggle/button-toggle.scss` or component files if Playwright uncovers regressions.
- Create: `.superpowers/sdd/2026-08-11-qwik-material-button-toggle-port/task-11-playwright-artifact.md` — spec run report + screenshots (or their paths if attached separately).

**Interfaces:**
- Consumes: Task 9's dev-app routes + Playwright specs; Task 10's clean pipeline.
- Produces: pass/fail report + screenshots. If failures, fixes committed and re-run.

- [ ] **Step 1: Ensure Playwright + Chromium are installed**

```bash
pnpm -C src/qwik-cdk-parity-tests exec playwright install chromium
```

Expected: Chromium binary installed. If installation fails due to environment constraints (no network, no permission), STOP and report BLOCKED — the runtime verification task cannot proceed without Chromium.

- [ ] **Step 2: Build the dev-app for preview**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Expected: exit 0.

- [ ] **Step 3: Start the preview server in the background**

```bash
pnpm -C src/qwik-cdk-dev-app preview >/tmp/button-toggle-preview.log 2>&1 &
PREVIEW_PID=$!
sleep 5
BASE_URL=$(grep -oE 'http://localhost:[0-9]+' /tmp/button-toggle-preview.log | head -1)
echo "Preview server at: $BASE_URL"
```

Expected: preview URL captured (typically `http://localhost:4173`).

- [ ] **Step 4: Smoke-test all 7 routes return HTTP 200**

```bash
for route in basic multi disabled-group disabled-individual preselected form-name standalone; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/mat-button-toggle/$route/")
  echo "$route: $code"
done
```

Expected: all `200`. If any returns 500, STOP — the SSR render is failing and the specs will not pass. Investigate the failing route (likely a `useContext` fallback missing or a Qwik hydration error).

- [ ] **Step 5: Run all 7 Playwright specs**

```bash
pnpm -C src/qwik-cdk-parity-tests exec playwright test specs/material-button-toggle/ --reporter=list
```

Expected: 7 passed, 0 failed.

- [ ] **Step 6: Capture screenshots of `basic` and `preselected` routes**

```bash
pnpm -C src/qwik-cdk-parity-tests exec playwright test specs/material-button-toggle/basic.spec.ts --screenshot=on
pnpm -C src/qwik-cdk-parity-tests exec playwright test specs/material-button-toggle/preselected.spec.ts --screenshot=on
```

The screenshots land under `src/qwik-cdk-parity-tests/test-results/`. Copy them to the workspace artifact directory for the task report:

```bash
mkdir -p .superpowers/sdd/2026-08-11-qwik-material-button-toggle-port/screenshots
cp src/qwik-cdk-parity-tests/test-results/material-button-toggle-basic*/screenshot.png \
   .superpowers/sdd/2026-08-11-qwik-material-button-toggle-port/screenshots/basic.png 2>/dev/null || true
cp src/qwik-cdk-parity-tests/test-results/material-button-toggle-preselected*/screenshot.png \
   .superpowers/sdd/2026-08-11-qwik-material-button-toggle-port/screenshots/preselected.png 2>/dev/null || true
```

- [ ] **Step 7: Kill the preview server**

```bash
kill $PREVIEW_PID 2>/dev/null || true
```

- [ ] **Step 8: If Step 5 reported failures — apply targeted fixes and re-run**

For each failing spec, read the failure and apply a targeted fix (SCSS `box-sizing` regression, wrong `role` computation, missing hidden `<input>`, wrong `aria-checked` value, etc.). Commit each fix with subject:

```
fix(multiple): <one-line about the specific regression the fix addresses>
```

After all fixes, re-run Step 5 until 7/7 pass.

- [ ] **Step 9: Write the runtime-verification artifact**

Create `.superpowers/sdd/2026-08-11-qwik-material-button-toggle-port/task-11-playwright-artifact.md`:

```markdown
# Task 11 — Playwright runtime verification

**Date:** <YYYY-MM-DD>
**Commit under test:** <HEAD SHA at start of Task 11>
**Chromium version:** <output of `pnpm -C src/qwik-cdk-parity-tests exec playwright --version`>

## Results

| Spec | Result |
| --- | --- |
| basic.spec.ts | ✓ pass |
| multi.spec.ts | ✓ pass |
| disabled-group.spec.ts | ✓ pass |
| disabled-individual.spec.ts | ✓ pass |
| preselected.spec.ts | ✓ pass |
| form-name.spec.ts | ✓ pass |
| standalone.spec.ts | ✓ pass |

## Screenshots

- basic: `screenshots/basic.png`
- preselected: `screenshots/preselected.png`

## Fixes applied (if any)

- (list commit SHAs + one-line description of each fix)

## Regression checks

- `pnpm test:qwik-material` — exit 0 (build + vitest + lint + typecheck all green post-fixes).
- Dev-app manifest still lists exactly 7 mat-button-toggle routes.
```

- [ ] **Step 10: If no fixes were needed, no commit is required** (the artifact + screenshots live in the git-ignored workspace and don't ship). If fixes were committed in Step 8, the workspace artifact serves as evidence for the whole-branch reviewer.

- [ ] **Step 11: If Chromium was unavailable and Step 1 or Step 5 could not run**, escalate to the human partner. Do NOT mark the task complete with a silent skip. Report BLOCKED with the specific environment constraint.

---

## Layout

```
src/qwik-material/
  button-toggle/
    button-toggle-config.ts                    — MatButtonToggleConfig + MAT_BUTTON_TOGGLE_CONFIG (Task 3)
    button-toggle-group-state.ts               — MatButtonToggleGroupState + MAT_BUTTON_TOGGLE_GROUP_STATE + DEFAULTS (Task 3)
    button-toggle-state.spec.ts                — 5 it() covering both files (Task 3)
    mat-button-toggle-group.tsx                — <MatButtonToggleGroup> (Task 4)
    mat-button-toggle-group.spec.tsx           — smoke (Task 4)
    mat-button-toggle.tsx                      — <MatButtonToggle> (Task 5)
    mat-button-toggle.spec.tsx                 — smoke (Task 5)
    mat-button-toggle-scenarios.spec.tsx       — upstream scenario port (Task 8)
    intrinsic-elements.d.ts                    — 2 custom-element JSX augmentations (Task 1)
    public-api.ts                              — 10-symbol consumer-facing re-exports (Task 7)
    index.ts                                   — `export * from './public-api'` (Task 1 stub / Task 7 real)
    SYNC.md                                    — deviation + stub log (Task 10)
  dialog/
    qwik-material-provider.tsx                 — MODIFIED in Task 6 (adds matButtonToggleConfig)
    qwik-material-provider-button-toggle.spec.tsx — new spec (Task 6)
  scss/
    button-toggle/                             — 3 synced partials + rewritten button-toggle.scss + button-toggle-prebuilt.scss (Task 2)
  package.json                                 — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                               — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                                   — MODIFIED in Task 9 (button-toggle-prebuilt.css import)
    routes/
      index.tsx                                — MODIFIED in Task 9 (Button toggles section)
      mat-button-toggle/                       — 7 new route files (Task 9)

src/qwik-cdk-parity-tests/
  specs/
    material-button-toggle/                    — 7 new Playwright specs (Task 9)

.superpowers/sdd/2026-08-11-qwik-material-button-toggle-port/
  task-11-playwright-artifact.md               — runtime verification report (Task 11)
  screenshots/                                 — basic.png + preselected.png (Task 11)
```

## Per-entry-point state

The `button-toggle` entry-point becomes the twelfth after `dialog` + `button` + `card` + `toolbar` + `badge` + `icon` + `progress-bar` + `progress-spinner` + `divider` + `grid-list` + `list` in the qwik-material package. All twelve live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` (from earlier ports) is the only intersection, extended in Task 6.

## Sync recipe

To re-sync a specific file from upstream `src/material/button-toggle/`:

1. Locate the upstream file's counterpart in the `button-toggle/SYNC.md` sync table.
2. If "synced" state (`_button-toggle-theme.scss`, `_m2-button-toggle.scss`, `_m3-button-toggle.scss`): `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths.
3. If "rewritten" state (`button-toggle.scss`): re-read upstream, apply any new selectors that are IN scope (segmented control geometry, checked state, disabled state), verify ripple/pseudo-checkbox/legacy/vertical blocks stay stripped, verify `box-sizing: border-box` stays present.
4. If "ported" state (`mat-button-toggle-group.tsx`, `mat-button-toggle.tsx`): manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change, update the corresponding `.spec.tsx`.
5. If "new" state (`button-toggle-config.ts`, `button-toggle-group-state.ts`, `button-toggle-prebuilt.scss`): no upstream counterpart — evolve independently.
6. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest ≈ 252 pass + lint + typecheck)
- 7 dev-app routes at `/mat-button-toggle/*` render visibly in browser preview + return HTTP 200 SSR
- 7 Playwright specs pass locally against the built dev-app preview (Task 11 — first port to bake this into the plan)
- Every Playwright spec asserts on the `<mat-button-toggle-group>` or `<mat-button-toggle>` custom-element tag AT LEAST ONCE
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/button-toggle/` returns nothing)
- Zero SSR-leak violations
- Zero `useVisibleTask$` / `useStore` / `useTask$` in non-spec files
- `<QwikMaterialProvider>` has exactly 13 `useContextProvider` calls in order: MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_ANIMATIONS_DISABLED, MAT_BUTTON_CONFIG, MAT_CARD_CONFIG, MAT_BADGE_CONFIG, MAT_ICON_CONFIG, MAT_PROGRESS_BAR_CONFIG, MAT_PROGRESS_SPINNER_CONFIG, MAT_DIVIDER_CONFIG, MAT_GRID_LIST_CONFIG, MAT_LIST_CONFIG, MAT_BUTTON_TOGGLE_CONFIG.
- `.mat-button-toggle` AND `.mat-button-toggle-button` both carry `box-sizing: border-box` in the compiled CSS (list-port regression prevention).
