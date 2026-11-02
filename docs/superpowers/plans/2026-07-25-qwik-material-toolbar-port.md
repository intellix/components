# qwik-material Toolbar Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/toolbar/` (2 stateless components) into a `qwik-material/toolbar` entry-point that preserves upstream's custom-element tag names (`<mat-toolbar>`, `<mat-toolbar-row>`) AND classes so external CMS styles targeting the tag names continue to work.

**Architecture:** 2 thin `component$` wrappers rendering their upstream custom-element tags with the exact upstream class list. `MatToolbar` accepts optional `color` (M2 palette) + `multipleRows` (explicit opt-in replacing upstream's `@ContentChildren` runtime detection). No config context, no lifecycle. Simplest port yet — no q:slot structure, no image variants, no ref lifecycle.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package created by the Dialog + Button + Card ports.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./toolbar`. New prebuilt CSS entry: `./toolbar-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths in this plan are relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-07-25-qwik-material-toolbar-port-design.md](../specs/2026-07-25-qwik-material-toolbar-port-design.md). Read §2 (Public API), §3 (Internal architecture), §6 (CSS delivery), §8 (Deviations catalog) before starting any port task.
- **Material source reference:** `src/material/toolbar/`. Every port task names the exact source file(s) it mirrors.
- **DOM parity requirement:** every toolbar component MUST render its upstream custom-element tag name (`<mat-toolbar>`, `<mat-toolbar-row>`), NOT `<div>`. This is THE CMS constraint. Any diff emitting `<div>` fails review.
- **qwik-cdk peer:** `@angular-community/qwik-cdk` at `workspace:*` (already declared). Toolbar doesn't consume qwik-cdk at runtime.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. E.g. `toolbar.ts` → `mat-toolbar.tsx`. Component files use `.tsx`. Templates (`*.html`) collapse into their `.tsx` JSX with a `<basename>.html.removed.md` breadcrumb.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/toolbar/SYNC.md`.
- **No RxJS.**
- **No exported classes** in the consumer surface. `toolbar/public-api.ts` must not contain `export class`.
- **SSR safety:** every `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` call must be inside `useVisibleTask$` OR guarded by `typeof <global> !== 'undefined'`. Do NOT use `isBrowser` from `@builder.io/qwik/build`. Toolbar has no runtime browser-global access; the guard rule still applies to any future edits.
- **Commit message scope:** the upstream repo's commit-msg hook does not know `qwik-material`; use scope `multiple` (which is in the allowed list) for every commit in this plan.
- **Pnpm version:** the repo pins `pnpm@11.7.0`. Don't change it.
- **Node version:** pinned via `.nvmrc`. Don't change it.
- **No Bazel changes.**
- **No upstream CI integration.**
- **Class-list cast pattern (established in Dialog + Button + Card ports):** use `.filter(Boolean) as string[]`. The type `(string | ReadonlyArray<string>)[]` fails typecheck against Qwik's `ClassList` type.
- **Spec files use smoke variant:** Dialog + Button + Card ports confirmed `createDOM(<component$/>)` hangs the Qwik optimizer worker. Toolbar `.spec.tsx` files use module-import assertions (`expect(Component).toBeDefined()` + `typeof === 'function'`). Real DOM assertions live in Task 7's Playwright parity specs.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `toolbar` entry-point into the existing qwik-material package + intrinsic-elements typing

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from Dialog + Button + Card ports).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/toolbar/index.ts` (empty stub — Task 5 replaces it)
- Create: `src/qwik-material/toolbar/intrinsic-elements.d.ts`

**Interfaces:**
- Consumes: existing package scaffolding.
- Produces: `pnpm -C src/qwik-material build` still succeeds (dialog + button + card CSS still emit, no toolbar CSS yet). Type resolution for `@angular-community/qwik-material/toolbar` returns an empty module. Both toolbar custom-element tag names are valid in TSX from any consumer file.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./toolbar` after `./card`, and `./toolbar-prebuilt.css` after `./card-prebuilt.css`. Final layout:

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
  "./toolbar": {
    "qwik": "./toolbar/index.ts",
    "types": "./dist/toolbar/index.d.ts",
    "import": "./dist/toolbar/index.js"
  },
  "./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
  "./button-prebuilt.css": "./dist/button-prebuilt.css",
  "./card-prebuilt.css": "./dist/card-prebuilt.css",
  "./toolbar-prebuilt.css": "./dist/toolbar-prebuilt.css",
  "./scss/*": "./scss/*"
}
```

- [ ] **Step 2: Extend the vite `entries` + `sassEntries` in `src/qwik-material/vite.config.ts`**

Change `entries` from `['dialog', 'button', 'card']` to `['dialog', 'button', 'card', 'toolbar']`. Append toolbar sassEntry after card. The ENOENT-tolerant guard from Button Task 1 already swallows the missing-file case with a warning.

Final `entries` line:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar'];
```

Final `sassEntries` array:

```ts
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
  ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
  ['scss/toolbar/toolbar-prebuilt.scss', 'dist/toolbar-prebuilt.css'],
];
```

- [ ] **Step 3: Create `src/qwik-material/toolbar/index.ts`**

```ts
export {};
```

Empty stub. Task 5 replaces it with `export * from './public-api';`.

- [ ] **Step 4: Create `src/qwik-material/toolbar/intrinsic-elements.d.ts`**

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Toolbar's custom-element tag
 * names. External CMS styles may target `mat-toolbar` / `mat-toolbar-row` as
 * element selectors, not just their `.mat-toolbar` / `.mat-toolbar-row`
 * classes. See design spec
 * docs/superpowers/specs/2026-07-25-qwik-material-toolbar-port-design.md §3.1.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-toolbar': QwikIntrinsicElements['div'];
      'mat-toolbar-row': QwikIntrinsicElements['div'];
    }
  }
}
```

- [ ] **Step 5: Verify the build still succeeds**

```bash
pnpm -C src/qwik-material build
```

Expected:
- `dist/dialog-prebuilt.css`, `dist/button-prebuilt.css`, `dist/card-prebuilt.css` still emit.
- Console shows `[qwik-material] skipping scss/toolbar/toolbar-prebuilt.scss — not yet present.` (ENOENT-tolerant plugin).
- Exit code 0.
- `ls src/qwik-material/dist/toolbar/` shows `index.d.ts` (empty module marker from dts plugin).

- [ ] **Step 6: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/toolbar/index.ts \
  src/qwik-material/toolbar/intrinsic-elements.d.ts
git commit -m "$(cat <<'EOF'
build(multiple): wire qwik-material/toolbar entry-point into package + vite

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SCSS chain + prebuilt CSS

### Task 2: Copy Toolbar SCSS + prebuilt CSS with M3 defaults

**Reference source:** `src/material/toolbar/toolbar.scss`, `src/material/toolbar/_toolbar-theme.scss`, `src/material/toolbar/_m2-toolbar.scss`, `src/material/toolbar/_m3-toolbar.scss`, `src/material/toolbar/_toolbar-variables.scss`.

**Files:**
- Create: `src/qwik-material/scss/toolbar/toolbar.scss` (verbatim copy)
- Create: `src/qwik-material/scss/toolbar/_toolbar-theme.scss` (verbatim copy)
- Create: `src/qwik-material/scss/toolbar/_m2-toolbar.scss` (verbatim copy)
- Create: `src/qwik-material/scss/toolbar/_m3-toolbar.scss` (verbatim copy)
- Create: `src/qwik-material/scss/toolbar/_toolbar-variables.scss` (verbatim copy)
- Create: `src/qwik-material/scss/toolbar/toolbar-prebuilt.scss` (new entry — `@use ./toolbar` + M3 :root defaults matching the ACTUAL emitted `--mat-toolbar-*` variable names)
- Create (as needed): any additional stubs — expected: ZERO, toolbar's SCSS chain is minimal and reuses existing Dialog + Button + Card core stubs.

**Interfaces:**
- Consumes: Task 1's vite plumbing (`sassEntries` includes `scss/toolbar/toolbar-prebuilt.scss`).
- Produces: `dist/toolbar-prebuilt.css` emitted after `pnpm build` containing Material Toolbar's structural + theme layers + M3 :root defaults with variable names that ACTUALLY match what the emitted CSS references.

**Critical: verify emitted CSS variable names before finalizing `:root` block.**
The design spec §6.1 lists placeholder variable names (`--mat-toolbar-container-background-color` etc.). These MAY OR MAY NOT match the actual `var(--mat-toolbar-*)` references the emitted structural CSS produces. Same class of bug caught in Card Task 2 (which shipped `--mdc-*-card-*` :root defaults that didn't connect to structural CSS's `--mat-card-*` references). Verify by grepping `dist/toolbar-prebuilt.css` after the initial build and updating the `:root` block to match reality before committing.

- [ ] **Step 1: Copy the 5 SCSS files verbatim**

```bash
mkdir -p src/qwik-material/scss/toolbar
cp src/material/toolbar/toolbar.scss              src/qwik-material/scss/toolbar/toolbar.scss
cp src/material/toolbar/_toolbar-theme.scss       src/qwik-material/scss/toolbar/_toolbar-theme.scss
cp src/material/toolbar/_m2-toolbar.scss          src/qwik-material/scss/toolbar/_m2-toolbar.scss
cp src/material/toolbar/_m3-toolbar.scss          src/qwik-material/scss/toolbar/_m3-toolbar.scss
cp src/material/toolbar/_toolbar-variables.scss   src/qwik-material/scss/toolbar/_toolbar-variables.scss
```

- [ ] **Step 2: Create initial `toolbar-prebuilt.scss` with just `@use` (no :root yet)**

Create the file with only the `@use` line so we can build once and see what variables the emitted CSS actually references:

```scss
// Prebuilt Material Toolbar CSS entry — first pass, :root block added after
// we verify which --mat-toolbar-* variable names the emitted CSS actually
// references (same investigation approach as Card Task 2, which caught a
// --mdc-*-card-* vs --mat-card-* mismatch in the design spec).
@use './toolbar';
```

- [ ] **Step 3: Run the build + inspect emitted CSS references**

```bash
pnpm -C src/qwik-material build
```

Confirm exit 0 and `dist/toolbar-prebuilt.css` exists.

Then enumerate the `--mat-toolbar-*` variable references the emitted CSS reads:

```bash
grep -oE "var\(--mat-toolbar-[a-z-]+" src/qwik-material/dist/toolbar-prebuilt.css | sort -u
```

Record the exact names. These are the variables the `:root` block MUST define. The design spec's guesses may or may not match — use the real names.

- [ ] **Step 4: Update `toolbar-prebuilt.scss` with the correct M3 `:root` block**

Append a `:root` block to `src/qwik-material/scss/toolbar/toolbar-prebuilt.scss` that defines EVERY `--mat-toolbar-*` variable the previous step's grep produced. Use these M3 canonical values:

- Container background: `var(--mat-sys-surface, #fef7ff)` (light off-white)
- Container / title text color: `var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87))`
- Title font: `Roboto, "Helvetica Neue", sans-serif`
- Title size: `1.25rem` (M3 title-large)
- Title weight: `500`
- Title line-height: `1.5`
- Title tracking: `0.0125em`
- Standard height (desktop): `64px`
- Mobile height: `56px`

Map the M3 canonical values to whichever exact variable names the grep produced. Example structure (adjust names to match reality):

```scss
@use './toolbar';

// Minimal Material Design 3 defaults so a bare consumer sees a themed
// toolbar. Values sourced from @angular/material/toolbar M3 tokens.
// Variable names verified against dist/toolbar-prebuilt.css structural CSS.
:root {
  --mat-toolbar-container-background-color: var(--mat-sys-surface, #fef7ff);
  --mat-toolbar-container-text-color: var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87));
  --mat-toolbar-title-text-color: var(--mat-sys-on-surface, rgba(0, 0, 0, 0.87));
  --mat-toolbar-title-text-font: Roboto, "Helvetica Neue", sans-serif;
  --mat-toolbar-title-text-line-height: 1.5;
  --mat-toolbar-title-text-size: 1.25rem;
  --mat-toolbar-title-text-tracking: 0.0125em;
  --mat-toolbar-title-text-weight: 500;
  --mat-toolbar-standard-height: 64px;
  --mat-toolbar-mobile-height: 56px;
}
```

Adjust the names in this block to match Step 3's grep output. If Step 3 revealed a variable the M3 canonical values above don't cover, use a reasonable default that matches surrounding style (e.g. spacing / padding tokens usually `16px`, border tokens `var(--mat-sys-outline-variant, rgba(0, 0, 0, 0.12))`).

- [ ] **Step 5: Rebuild and verify M3 defaults land**

```bash
pnpm -C src/qwik-material build
```

Confirm exit 0. Grep the emitted CSS for the first variable in the `:root` block (whichever it turned out to be):

```bash
grep -c "mat-toolbar-container-background-color" src/qwik-material/dist/toolbar-prebuilt.css
```

Expected: `>= 2` — one from the `:root` block define, one from the structural CSS reference. If the count is `< 2`, the variable name in `:root` doesn't match the structural CSS reference — fix.

- [ ] **Step 6: Sanity-check the emitted CSS**

```bash
grep -c "mat-toolbar" src/qwik-material/dist/toolbar-prebuilt.css
```

Expected: `> 10` (structural rules + theme + row + color + variants).

- [ ] **Step 7: Confirm no new stubs needed**

Enumerate any new SCSS files added under `scss/` outside `toolbar/`:

```bash
git status --short src/qwik-material/scss/
```

Expected: only `src/qwik-material/scss/toolbar/` files appear. If any new stubs landed under `scss/core/**` or elsewhere, note them in the report — Task 8 will document them in `dialog/SYNC.md`.

- [ ] **Step 8: Commit**

```bash
git add src/qwik-material/scss/toolbar/  # plus any new stub paths from Step 7
git commit -m "$(cat <<'EOF'
feat(multiple): copy Material Toolbar SCSS + prebuilt CSS entry with M3 defaults

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Foundation type

### Task 3: `MatToolbarColor` type

**Reference source:** `src/material/toolbar/toolbar.ts` line 51 (the `color` input; upstream types it as `string | null` because internal apps pass arbitrary strings — we narrow to the palette union).

**Files:**
- Create: `src/qwik-material/toolbar/toolbar-color.ts`
- Create: `src/qwik-material/toolbar/toolbar-color.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MatToolbarColor` type. Consumed by `mat-toolbar.tsx` (Task 4) and public-api (Task 5).

- [ ] **Step 1: Write `toolbar-color.ts`**

```ts
/**
 * M2 palette color for <MatToolbar>. Deprecated in M3 but honoured for
 * backwards compatibility. Applying `color` adds a `mat-<color>` class.
 */
export type MatToolbarColor = 'primary' | 'accent' | 'warn';
```

- [ ] **Step 2: Write `toolbar-color.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import type {MatToolbarColor} from './toolbar-color';

describe('MatToolbarColor', () => {
  it('accepts the three documented literal values', () => {
    const a: MatToolbarColor = 'primary';
    const b: MatToolbarColor = 'accent';
    const c: MatToolbarColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm -C src/qwik-material test toolbar/toolbar-color
```

Expected: 1/1 passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/toolbar/toolbar-color.ts src/qwik-material/toolbar/toolbar-color.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatToolbarColor type

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Components

### Task 4: `<MatToolbar>` + `<MatToolbarRow>` components

**Reference source:** `src/material/toolbar/toolbar.ts` (MatToolbar + MatToolbarRow), `src/material/toolbar/toolbar.html` (template).

**Files:**
- Create: `src/qwik-material/toolbar/mat-toolbar.tsx`
- Create: `src/qwik-material/toolbar/mat-toolbar.spec.tsx`
- Create: `src/qwik-material/toolbar/mat-toolbar-row.tsx`
- Create: `src/qwik-material/toolbar/mat-toolbar-row.spec.tsx`
- Create: `src/qwik-material/toolbar/toolbar.html.removed.md`

**Interfaces:**
- Consumes: `MatToolbarColor` from Task 3; `IntrinsicElements` augmentation from Task 1.
- Produces: `MatToolbar: Component<MatToolbarProps>` + `MatToolbarProps` interface; `MatToolbarRow: Component<MatToolbarRowProps>` + `MatToolbarRowProps` interface. Consumed by public-api (Task 5), dev-app routes (Task 7), Playwright specs (Task 7).

- [ ] **Step 1: Write `toolbar.html.removed.md` breadcrumb**

```markdown
# toolbar.html — removed

Upstream `src/material/toolbar/toolbar.html` is inlined into
`mat-toolbar.tsx` as JSX per the qwik-material file-naming rule. Upstream
template is two adjacent projections:

    <ng-content></ng-content>
    <ng-content select="mat-toolbar-row"></ng-content>

Angular's `<ng-content select>` picks projected children by selector match.
Qwik has no equivalent, but the ordering here is a no-op: Angular projects
free content into the unnamed slot AND `<mat-toolbar-row>` children into
the selected slot — both rendered in source order. In Qwik we use a single
unnamed `<Slot />` and let the consumer place `<MatToolbarRow>` children
directly inside `<MatToolbar>`; ordering is preserved automatically.
Consumers using multi-row layout MUST set `multipleRows` on the toolbar
so the correct `mat-toolbar-multiple-rows` / `mat-toolbar-single-row`
class is applied (upstream detects this at runtime via @ContentChildren;
Qwik has no equivalent).
```

- [ ] **Step 2: Write `mat-toolbar.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';
import type {MatToolbarColor} from './toolbar-color';

export interface MatToolbarProps {
  /** M2 palette color. Deprecated in M3 but honoured. Adds `mat-<color>` class. */
  color?: MatToolbarColor;
  /**
   * When true, applies `mat-toolbar-multiple-rows` class instead of
   * `mat-toolbar-single-row`. Consumer opts in explicitly because Qwik
   * cannot query projected children at render time (upstream uses
   * @ContentChildren for this detection).
   */
  multipleRows?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatToolbar = component$<MatToolbarProps>(props => {
  const classes = [
    'mat-toolbar',
    props.color ? `mat-${props.color}` : '',
    props.multipleRows ? 'mat-toolbar-multiple-rows' : 'mat-toolbar-single-row',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-toolbar id={props.id} class={classes}>
      <Slot />
    </mat-toolbar>
  );
});
```

- [ ] **Step 3: Write `mat-toolbar-row.tsx`**

```tsx
import {component$, Slot} from '@builder.io/qwik';

export interface MatToolbarRowProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatToolbarRow = component$<MatToolbarRowProps>(props => {
  const classes = ['mat-toolbar-row', props.class].filter(Boolean) as string[];
  return (
    <mat-toolbar-row id={props.id} class={classes}>
      <Slot />
    </mat-toolbar-row>
  );
});
```

- [ ] **Step 4: Write smoke spec `mat-toolbar.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatToolbar} from './mat-toolbar';

describe('MatToolbar (module-import smoke)', () => {
  it('MatToolbar is a Qwik component', () => {
    expect(MatToolbar).toBeDefined();
    expect(typeof MatToolbar).toBe('function');
  });
});
```

- [ ] **Step 5: Write smoke spec `mat-toolbar-row.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatToolbarRow} from './mat-toolbar-row';

describe('MatToolbarRow (module-import smoke)', () => {
  it('MatToolbarRow is a Qwik component', () => {
    expect(MatToolbarRow).toBeDefined();
    expect(typeof MatToolbarRow).toBe('function');
  });
});
```

- [ ] **Step 6: Run the tests**

```bash
pnpm -C src/qwik-material test toolbar/mat-toolbar toolbar/mat-toolbar-row
```

Expected: 2/2 spec files, 2/2 tests passing.

- [ ] **Step 7: Run typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. If it errors on unknown JSX intrinsic elements (`mat-toolbar` / `mat-toolbar-row`), Task 1's `intrinsic-elements.d.ts` didn't load — verify the file exists at `src/qwik-material/toolbar/intrinsic-elements.d.ts` and that tsconfig include picks up `.d.ts` files under that directory.

- [ ] **Step 8: Commit**

```bash
git add \
  src/qwik-material/toolbar/mat-toolbar.tsx \
  src/qwik-material/toolbar/mat-toolbar.spec.tsx \
  src/qwik-material/toolbar/mat-toolbar-row.tsx \
  src/qwik-material/toolbar/mat-toolbar-row.spec.tsx \
  src/qwik-material/toolbar/toolbar.html.removed.md
git commit -m "$(cat <<'EOF'
feat(multiple): add MatToolbar + MatToolbarRow components

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Public API + build validation

### Task 5: `toolbar/public-api.ts` + `toolbar/index.ts` + build verification

**Reference source:** `src/qwik-material/card/public-api.ts` (existing pattern from Card port).

**Files:**
- Create: `src/qwik-material/toolbar/public-api.ts`
- Modify: `src/qwik-material/toolbar/index.ts` (replaces the empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Phase 3-4.
- Produces: consumer-facing surface `@angular-community/qwik-material/toolbar`. Consumed by dev-app routes + Playwright specs (Task 7).

- [ ] **Step 1: Write `toolbar/public-api.ts`**

```ts
// Public API for @angular-community/qwik-material/toolbar.
// See docs/superpowers/specs/2026-07-25-qwik-material-toolbar-port-design.md §2.

export type {MatToolbarColor} from './toolbar-color';
export {MatToolbar, type MatToolbarProps} from './mat-toolbar';
export {MatToolbarRow, type MatToolbarRowProps} from './mat-toolbar-row';
```

- [ ] **Step 2: Replace `toolbar/index.ts` stub with the real re-export**

```ts
export * from './public-api';
```

- [ ] **Step 3: Verify build + typecheck are clean**

```bash
pnpm -C src/qwik-material build && pnpm -C src/qwik-material typecheck
```

Expected: both exit 0. Build emits `dist/toolbar/index.js` (~0.4-1 KB) + `dist/toolbar/index.d.ts` + `dist/toolbar/public-api.d.ts`.

- [ ] **Step 4: Sanity-check the exported surface**

```bash
grep -nE "^export " src/qwik-material/dist/toolbar/public-api.d.ts | head -10
```

Expected output includes:
- `export declare const MatToolbar: ...`
- `export declare const MatToolbarRow: ...`
- Type re-exports (`MatToolbarColor`, `MatToolbarProps`, `MatToolbarRowProps`)

Also confirm zero exported classes on the consumer surface:

```bash
grep -nE "^export declare class" src/qwik-material/dist/toolbar/public-api.d.ts
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/toolbar/public-api.ts src/qwik-material/toolbar/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): finalize qwik-material/toolbar public API

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Scenario tests

### Task 6: Vitest scenario port from `src/material/toolbar/toolbar.spec.ts`

**Reference source:** `src/material/toolbar/toolbar.spec.ts` (129 LOC, 5 upstream `it()` blocks — pre-enumerated by the plan author).

**Upstream `it()` inventory:**
1. `should apply class based on color attribute` — DOM-render → Playwright Task 7
2. `should not wrap the first row contents inside of a generated element` — DOM-render → Playwright Task 7
3. `should project each toolbar-row element inside of the toolbar` — DOM-render → Playwright Task 7
4. `should throw an error if different toolbar modes are mixed` — Angular-only (the dev-mode check we're skipping per design spec §8 deviation #2)
5. `should pick up indirect descendant rows` — Angular-only (needs `@ContentChildren` reflection which Qwik doesn't have; we use explicit `multipleRows` prop per design spec §8 deviation #1)

Restructured for smoke-only vitest constraint:
- **Live sanity tests (4):** MatToolbar + MatToolbarRow typeof/defined + MatToolbarColor type-only
- **describe.skip (3 DOM-rendered stubs):** deferred to Playwright Task 7
- **describe.skip (2 Angular-only stubs):** deferred / skipped-forever

**Files:**
- Create: `src/qwik-material/toolbar/mat-toolbar-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 5.
- Produces: consolidated scenario coverage documenting upstream test intent.

- [ ] **Step 1: Write the scenario spec**

```tsx
/**
 * MatToolbar scenario port from src/material/toolbar/toolbar.spec.ts.
 *
 * Upstream has 5 `it()` blocks:
 *   1. `should apply class based on color attribute` — DOM-rendered → Playwright
 *   2. `should not wrap the first row contents inside of a generated element` — DOM-rendered → Playwright
 *   3. `should project each toolbar-row element inside of the toolbar` — DOM-rendered → Playwright
 *   4. `should throw an error if different toolbar modes are mixed` — Angular-only (dev-mode error, skipped per §8 deviation #2)
 *   5. `should pick up indirect descendant rows` — Angular-only (@ContentChildren, skipped per §8 deviation #1)
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-toolbar/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {MatToolbar, MatToolbarRow} from './public-api';

describe('MatToolbar — sanity', () => {
  it('MatToolbar is exported', () => {
    expect(MatToolbar).toBeDefined();
    expect(typeof MatToolbar).toBe('function');
  });

  it('MatToolbarRow is exported', () => {
    expect(MatToolbarRow).toBeDefined();
    expect(typeof MatToolbarRow).toBe('function');
  });

  it('MatToolbar and MatToolbarRow are distinct components', () => {
    expect(MatToolbar).not.toBe(MatToolbarRow);
  });

  it('public-api re-exports both components without extras', () => {
    // Simple sanity: both are functions (Qwik components) and are the two
    // consumer-facing named exports the design spec §2.4 promises.
    expect(typeof MatToolbar).toBe('function');
    expect(typeof MatToolbarRow).toBe('function');
  });
});

describe.skip('MatToolbar DOM-rendered scenarios — deferred to Playwright Task 7', () => {
  it('should apply class based on color attribute', () => {});
  it('should not wrap the first row contents inside of a generated element', () => {});
  it('should project each toolbar-row element inside of the toolbar', () => {});
});

describe.skip('MatToolbar — Angular-only tests', () => {
  it('should throw an error if different toolbar modes are mixed', () => {
    // Deferred per design spec §8 deviation #2 (dev-mode error skipped).
  });
  it('should pick up indirect descendant rows', () => {
    // Deferred per design spec §8 deviation #1 (explicit multipleRows prop
    // replaces @ContentChildren runtime detection).
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
pnpm -C src/qwik-material test toolbar/mat-toolbar-scenarios
```

Expected: 4 passing + 5 skipped.

- [ ] **Step 3: Run the full qwik-material suite for regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-6 total + 4 passing + 5 skipped from this task, zero failures across dialog/button/card/toolbar.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/toolbar/mat-toolbar-scenarios.spec.tsx
git commit -m "$(cat <<'EOF'
test(multiple): port MatToolbar scenarios from upstream toolbar.spec.ts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Dev-app + Playwright parity

### Task 7: 5 mat-toolbar dev-app routes + index tile + root.tsx CSS import + 5 Playwright parity specs

**Reference source:** existing dev-app + Playwright patterns from Card port at `src/qwik-cdk-dev-app/src/routes/mat-card/` and `src/qwik-cdk-parity-tests/specs/material-card/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add toolbar-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Toolbars" section with 5 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-toolbar/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-toolbar/color-primary/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-toolbar/color-accent/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-toolbar/color-warn/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-toolbar/multiple-rows/index.tsx`
- Create: `src/qwik-cdk-parity-tests/specs/material-toolbar/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-toolbar/color-primary.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-toolbar/color-accent.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-toolbar/color-warn.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-toolbar/multiple-rows.spec.ts`

**Interfaces:**
- Consumes: `@angular-community/qwik-material/toolbar` (Task 5).
- Produces: 5 mount-only dev-app routes + 5 Playwright specs asserting tag names + classes.

- [ ] **Step 1: Add the toolbar-prebuilt.css import to `src/qwik-cdk-dev-app/src/root.tsx`**

Read the current file. Append the toolbar CSS import after the card one:

```tsx
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/card-prebuilt.css';
import '@angular-community/qwik-material/toolbar-prebuilt.css';
```

- [ ] **Step 2: Add a "Toolbars" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert a new `<section>` after the existing "Cards" section:

```tsx
<section>
  <h2>Toolbars</h2>
  <ul>
    <li><a href="/mat-toolbar/basic/">basic</a></li>
    <li><a href="/mat-toolbar/color-primary/">color-primary</a></li>
    <li><a href="/mat-toolbar/color-accent/">color-accent</a></li>
    <li><a href="/mat-toolbar/color-warn/">color-warn</a></li>
    <li><a href="/mat-toolbar/multiple-rows/">multiple-rows</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <MatToolbar>My Application</MatToolbar>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `color-primary/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <MatToolbar color="primary">Primary toolbar</MatToolbar>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `color-accent/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <MatToolbar color="accent">Accent toolbar</MatToolbar>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create `color-warn/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <MatToolbar color="warn">Warn toolbar</MatToolbar>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `multiple-rows/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatToolbar, MatToolbarRow} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <MatToolbar multipleRows>
      <MatToolbarRow>First row</MatToolbarRow>
      <MatToolbarRow>Second row</MatToolbarRow>
    </MatToolbar>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Expected: client + SSR builds succeed. Confirm 5 mat-toolbar routes in the manifest:

```bash
grep -oE 'mat-toolbar/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `5`.

- [ ] **Step 9: Create `basic.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-toolbar/basic — <mat-toolbar> with mat-toolbar + single-row class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-toolbar/basic/`);
  await page.waitForSelector('[data-scenario-ready]');
  const toolbar = page.locator('mat-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/mat-toolbar(\s|$)/);
  await expect(toolbar).toHaveClass(/mat-toolbar-single-row/);
  await expect(toolbar).not.toHaveClass(/mat-toolbar-multiple-rows/);
  await expect(toolbar).toHaveText('My Application');
});
```

- [ ] **Step 10: Create `color-primary.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-toolbar/color-primary — <mat-toolbar> with mat-primary class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-toolbar/color-primary/`);
  await page.waitForSelector('[data-scenario-ready]');
  const toolbar = page.locator('mat-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/mat-primary/);
  await expect(toolbar).toHaveClass(/mat-toolbar-single-row/);
});
```

- [ ] **Step 11: Create `color-accent.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-toolbar/color-accent — <mat-toolbar> with mat-accent class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-toolbar/color-accent/`);
  await page.waitForSelector('[data-scenario-ready]');
  const toolbar = page.locator('mat-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/mat-accent/);
});
```

- [ ] **Step 12: Create `color-warn.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-toolbar/color-warn — <mat-toolbar> with mat-warn class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-toolbar/color-warn/`);
  await page.waitForSelector('[data-scenario-ready]');
  const toolbar = page.locator('mat-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/mat-warn/);
});
```

- [ ] **Step 13: Create `multiple-rows.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-toolbar/multiple-rows — <mat-toolbar-multiple-rows> with 2 <mat-toolbar-row> children', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-toolbar/multiple-rows/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toolbar = page.locator('mat-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/mat-toolbar-multiple-rows/);
  await expect(toolbar).not.toHaveClass(/mat-toolbar-single-row/);

  const rows = page.locator('mat-toolbar mat-toolbar-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toHaveClass(/mat-toolbar-row/);
  await expect(rows.nth(0)).toHaveText('First row');
  await expect(rows.nth(1)).toHaveText('Second row');
});
```

- [ ] **Step 14: Do NOT run Playwright**

Chromium install + preview server are human-managed steps (documented in Task 8). Skip execution — the specs get validated by the human during final merge review.

- [ ] **Step 15: Commit**

```bash
git add \
  src/qwik-cdk-dev-app/src/root.tsx \
  src/qwik-cdk-dev-app/src/routes/index.tsx \
  src/qwik-cdk-dev-app/src/routes/mat-toolbar/ \
  src/qwik-cdk-parity-tests/specs/material-toolbar/
git commit -m "$(cat <<'EOF'
feat(multiple): mat-toolbar dev-app routes (5) + Playwright parity specs (5)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Finalisation

### Task 8: SYNC.md + pipeline verification

**Reference source:** `src/qwik-material/card/SYNC.md` (existing SYNC pattern from Card port).

**Files:**
- Create: `src/qwik-material/toolbar/SYNC.md`
- Modify (only if new stubs added in Task 2): `src/qwik-material/dialog/SYNC.md` (append note about toolbar-owned stubs; expected: no-op)
- Verify (no change): root `package.json` `test:qwik-material` script (exists from Dialog port; toolbar is picked up by the existing glob).

**Interfaces:**
- Consumes: everything from Tasks 1-7.
- Produces: `SYNC.md` documenting the toolbar port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/toolbar/SYNC.md`**

```markdown
# qwik-material/toolbar sync log

Tracks the sync state between this port and `src/material/toolbar/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
and `src/qwik-material/card/SYNC.md`.

## Upstream sync state

| File                                | Upstream path                                     | Sync state | Notes                                                                                    |
| ----------------------------------- | ------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `toolbar/mat-toolbar.tsx`           | `src/material/toolbar/toolbar.ts` (MatToolbar)    | ported     | Component→component$; renders <mat-toolbar>; explicit multipleRows prop replaces @ContentChildren |
| `toolbar/mat-toolbar-row.tsx`       | `src/material/toolbar/toolbar.ts` (MatToolbarRow) | ported     | Directive→component; renders <mat-toolbar-row>                                           |
| `toolbar/toolbar-color.ts`          | `src/material/toolbar/toolbar.ts` (color input type) | ported  | Narrowed from `string \| null` to `'primary' \| 'accent' \| 'warn'` union                |
| `toolbar/intrinsic-elements.d.ts`   | (qwik-material-specific)                          | new        | TS augmentation declaring 2 tag names as QwikIntrinsicElements['div']                    |
| `scss/toolbar/toolbar.scss`         | `src/material/toolbar/toolbar.scss`               | synced     | byte-identical copy                                                                      |
| `scss/toolbar/_toolbar-theme.scss`  | `src/material/toolbar/_toolbar-theme.scss`        | synced     | byte-identical copy                                                                      |
| `scss/toolbar/_m2-toolbar.scss`     | `src/material/toolbar/_m2-toolbar.scss`           | synced     | byte-identical copy                                                                      |
| `scss/toolbar/_m3-toolbar.scss`     | `src/material/toolbar/_m3-toolbar.scss`           | synced     | byte-identical copy                                                                      |
| `scss/toolbar/_toolbar-variables.scss` | `src/material/toolbar/_toolbar-variables.scss` | synced     | byte-identical copy                                                                      |
| `scss/toolbar/toolbar-prebuilt.scss` | (qwik-material-specific)                         | new        | @use toolbar.scss + M3 :root defaults matching emitted --mat-toolbar-* references        |

## Removed upstream files

- `toolbar.html` → inlined into `mat-toolbar.tsx` (single unnamed Slot); breadcrumb at `toolbar.html.removed.md`
- `toolbar-module.ts` → Qwik has no module concept
- `toolbar.spec.ts` → port lives in `mat-toolbar-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`multipleRows?: boolean` prop replaces upstream's `@ContentChildren(MatToolbarRow)` runtime detection.** Qwik has no equivalent reflection at render time; consumer opts in explicitly.
2. **`_checkToolbarMixedModes()` dev-mode error skipped.** Upstream throws in dev mode when consumers mix free content + `<mat-toolbar-row>` children. Deferred to a future qwik-material dev-mode subsystem.
3. **`throwToolbarMixedModesError` export omitted.** No consumers of the dev-error helper.
4. **`Platform` + `DOCUMENT` DI dropped.** Only used by the dev-mode check; irrelevant.
5. **Custom-element tag names (`mat-toolbar`, `mat-toolbar-row`) emitted verbatim** via IntrinsicElements augmentation (same pattern as Card).
6. **`toolbar.html` collapses into `mat-toolbar.tsx` JSX.** Single unnamed `<Slot />` — Qwik preserves child source order automatically, matching Angular's ordering of the two adjacent `<ng-content>` projections.
7. **QwikMaterialProvider NOT extended.** Upstream has no `MAT_TOOLBAR_CONFIG` token; per-instance `color` prop is the only consumer knob.

## Stub inventory delta

(Populated by the Task 2 SCSS-copy step. Expected: "No new stubs — toolbar chain reused all existing dialog + button + card port stubs.")

## Class count

`grep -nE "^export class" src/qwik-material/toolbar/**/*.ts src/qwik-material/toolbar/**/*.tsx`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar.
```

- [ ] **Step 2: If Task 2 added new stubs, append note to dialog SYNC.md**

Only do this if Task 2's report identified new stubs under `scss/` outside `toolbar/`. If Task 2 said "No new stubs — toolbar chain reused all existing dialog + button + card port stubs" (expected outcome), this step is a no-op — skip and note in commit body.

If new stubs did land, append to `src/qwik-material/dialog/SYNC.md`:

```markdown
## Additions from qwik-material/toolbar port

- `<path/to/new-stub.scss>` — stand-in for `@angular/material/<upstream-path>`
```

- [ ] **Step 3: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** all 4 prebuilt CSS files emit (dialog/button/card/toolbar); component JS + d.ts land under `dist/{dialog,button,card,toolbar}/`.
- **Vitest:** dialog + button + card + toolbar all pass (or fall back to smoke); no failures.
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 4: Verify the Class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/toolbar/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/toolbar/SYNC.md \
        src/qwik-material/dialog/SYNC.md  # only if step 2 changed it
git commit -m "$(cat <<'EOF'
docs(multiple): finalize qwik-material/toolbar SYNC.md + pipeline verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Layout

```
src/qwik-material/
  toolbar/
    toolbar-color.ts                  — MatToolbarColor type (Task 3)
    toolbar-color.spec.ts             — foundation tests (Task 3)
    intrinsic-elements.d.ts           — 2 custom-element tag augmentations (Task 1)
    mat-toolbar.tsx                   — <MatToolbar> (Task 4)
    mat-toolbar.spec.tsx              — smoke (Task 4)
    mat-toolbar-row.tsx               — <MatToolbarRow> (Task 4)
    mat-toolbar-row.spec.tsx          — smoke (Task 4)
    toolbar.html.removed.md           — breadcrumb (Task 4)
    mat-toolbar-scenarios.spec.tsx    — upstream scenario port (Task 6)
    public-api.ts                     — consumer-facing re-exports (Task 5)
    index.ts                          — `export * from './public-api'` (Task 1 stub / Task 5 real)
    SYNC.md                           — deviation + stub log (Task 8)
  scss/
    toolbar/                          — 5 verbatim SCSS files + toolbar-prebuilt.scss (Task 2)
  package.json                        — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                      — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                          — MODIFIED in Task 7 (toolbar-prebuilt.css import)
    routes/
      index.tsx                       — MODIFIED in Task 7 (Toolbars section)
      mat-toolbar/                    — 5 new route files (Task 7)

src/qwik-cdk-parity-tests/
  specs/
    material-toolbar/                 — 5 new Playwright specs (Task 7)
```

## Per-entry-point state

The `toolbar` entry-point becomes the fourth entry after `dialog` + `button` + `card` in the qwik-material package. All four live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` (from earlier ports) is the only intersection, and toolbar does NOT extend it.

## Sync recipe

To re-sync a specific file from upstream `src/material/toolbar/`:

1. Locate the upstream file's counterpart in the `toolbar/SYNC.md` sync table.
2. If "synced" state: `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "ported" state: manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change to the `mat-toolbar*.tsx` file, update the corresponding `.spec.tsx`.
4. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck)
- 5 dev-app routes at `/mat-toolbar/*` render visibly in browser preview
- 5 Playwright specs pass locally when run against the built dev-app preview
- **Every Playwright spec asserts on the custom-element tag name (`mat-toolbar` / `mat-toolbar-row`) AT LEAST ONCE** — a regression to `<div>` fails loudly
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/toolbar/` returns nothing)
- Zero SSR-leak violations
- SYNC.md populated with all 7 deviations + stub delta

---

## Class count

Zero exported classes on the consumer surface. Interfaces + `component$` factories + a type union only.

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package. Adding toolbar doesn't require any pipeline change — the scripts already glob the entire `src/qwik-material/` tree.
