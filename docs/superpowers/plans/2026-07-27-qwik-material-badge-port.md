# qwik-material Badge Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/badge/` (single attribute directive with ~7 inputs) into a `qwik-material/badge` entry-point as a `<MatBadge>` wrapper component that renders a `<span class="mat-badge">` around consumer content and inserts a `<span class="mat-badge-content">` for the badge overlay.

**Architecture:** Single stateless `component$` wrapper. Reads `MAT_BADGE_CONFIG` for defaults; resolves each prop through the fallback chain (`prop ?? config ?? built-in default`); renders a `<span>` wrapper containing `<Slot />` + the badge-content `<span>`. Uses a module-level counter for the badge-content id. No custom-element tag names (badge is classes-only per design spec §1), so no `intrinsic-elements.d.ts` for this port.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package created by the Dialog + Button + Card + Toolbar ports.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./badge`. New prebuilt CSS entry: `./badge-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths in this plan are relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-07-27-qwik-material-badge-port-design.md](../specs/2026-07-27-qwik-material-badge-port-design.md). Read §2 (Public API), §3 (Internal architecture), §6 (CSS delivery), §8 (Deviations catalog) before starting any port task.
- **Material source reference:** `src/material/badge/`. Every port task names the exact source file(s) it mirrors.
- **DOM parity:** upstream `[matBadge]` puts classes on the CONSUMER'S element. Our port puts classes on a wrapper `<span>`. This is a documented deviation (§8 deviation #1) — classes on the wrapper is the ACCEPTED shape. Reviewers do NOT flag the wrapper as a "missing tag parity."
- **qwik-cdk peer:** `@angular-community/qwik-cdk` at `workspace:*` (already declared). Badge doesn't consume qwik-cdk at runtime.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. E.g. `badge.ts` → `mat-badge.tsx`. Component files use `.tsx`.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/badge/SYNC.md`.
- **No RxJS.**
- **No exported classes** in the consumer surface. `badge/public-api.ts` must not contain `export class`.
- **SSR safety:** every `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` call must be inside `useVisibleTask$` OR guarded by `typeof <global> !== 'undefined'`. Do NOT use `isBrowser` from `@builder.io/qwik/build`. Badge has no runtime browser-global access; the guard rule still applies to any future edits.
- **Commit message scope:** the upstream repo's commit-msg hook does not know `qwik-material`; use scope `multiple` (which is in the allowed list) for every commit in this plan.
- **Pnpm version:** the repo pins `pnpm@11.7.0`. Don't change it.
- **Node version:** pinned via `.nvmrc`. Don't change it.
- **No Bazel changes.**
- **No upstream CI integration.**
- **Class-list cast pattern (established in Dialog + Button + Card + Toolbar ports):** use `.filter(Boolean) as string[]`. The type `(string | ReadonlyArray<string>)[]` fails typecheck against Qwik's `ClassList` type.
- **Spec files use smoke variant:** earlier ports confirmed `createDOM(<component$/>)` hangs the Qwik optimizer worker. Badge `.spec.tsx` files use module-import assertions. Real DOM assertions live in Task 9's Playwright parity specs.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `badge` entry-point into the existing qwik-material package

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from earlier ports).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/badge/index.ts` (empty stub — Task 7 replaces it)

**Interfaces:**
- Consumes: existing package scaffolding.
- Produces: `pnpm -C src/qwik-material build` still succeeds (dialog + button + card + toolbar CSS still emit, no badge CSS yet). Type resolution for `@angular-community/qwik-material/badge` returns an empty module.

**Note:** unlike Card + Toolbar + Dialog, badge does NOT ship a custom-element tag. There is no `intrinsic-elements.d.ts` to create. The badge component renders a plain `<span>` wrapper with `.mat-badge` class — no JSX tag augmentation needed.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./badge` after `./toolbar`, and `./badge-prebuilt.css` after `./toolbar-prebuilt.css`. Final relevant block:

```json
"./toolbar": {
  "qwik": "./toolbar/index.ts",
  "types": "./dist/toolbar/index.d.ts",
  "import": "./dist/toolbar/index.js"
},
"./badge": {
  "qwik": "./badge/index.ts",
  "types": "./dist/badge/index.d.ts",
  "import": "./dist/badge/index.js"
},
"./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
"./button-prebuilt.css": "./dist/button-prebuilt.css",
"./card-prebuilt.css": "./dist/card-prebuilt.css",
"./toolbar-prebuilt.css": "./dist/toolbar-prebuilt.css",
"./badge-prebuilt.css": "./dist/badge-prebuilt.css",
"./scss/*": "./scss/*"
```

- [ ] **Step 2: Extend the vite `entries` + `sassEntries`**

Change `entries` from `['dialog', 'button', 'card', 'toolbar']` to `['dialog', 'button', 'card', 'toolbar', 'badge']`. Append badge sassEntry after toolbar. The ENOENT-tolerant guard already swallows the missing-file case.

Final `entries` line:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar', 'badge'];
```

Final `sassEntries` array:

```ts
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
  ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
  ['scss/toolbar/toolbar-prebuilt.scss', 'dist/toolbar-prebuilt.css'],
  ['scss/badge/badge-prebuilt.scss', 'dist/badge-prebuilt.css'],
];
```

- [ ] **Step 3: Create `src/qwik-material/badge/index.ts`**

```ts
export {};
```

Empty stub. Task 7 replaces it with `export * from './public-api';`.

- [ ] **Step 4: Verify the build still succeeds**

```bash
pnpm -C src/qwik-material build
```

Expected:
- All 4 existing prebuilt CSS files still emit.
- Console shows `[qwik-material] skipping scss/badge/badge-prebuilt.scss — not yet present.` (ENOENT-tolerant plugin).
- Exit code 0.
- `ls src/qwik-material/dist/badge/` shows `index.d.ts` (empty module marker from dts plugin).

- [ ] **Step 5: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/badge/index.ts
git commit -m "$(cat <<'EOF'
build(multiple): wire qwik-material/badge entry-point into package + vite

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SCSS chain + prebuilt CSS

### Task 2: Copy Badge SCSS + iterative :root variable-name verification + prebuilt CSS

**Reference source:** `src/material/badge/badge.scss`, `src/material/badge/_badge-theme.scss`, `src/material/badge/_m2-badge.scss`, `src/material/badge/_m3-badge.scss`.

**Files:**
- Create: `src/qwik-material/scss/badge/badge.scss` (verbatim copy — may need `@angular/cdk` rewrite)
- Create: `src/qwik-material/scss/badge/_badge-theme.scss` (verbatim copy)
- Create: `src/qwik-material/scss/badge/_m2-badge.scss` (verbatim copy)
- Create: `src/qwik-material/scss/badge/_m3-badge.scss` (verbatim copy)
- Create: `src/qwik-material/scss/badge/badge-prebuilt.scss` (new entry — `@use ./badge` + M3 :root defaults matching the ACTUAL emitted `--mat-badge-*` variable names)
- Create (as needed): any additional stubs — expected: ZERO.

**Interfaces:**
- Consumes: Task 1's vite plumbing.
- Produces: `dist/badge-prebuilt.css` emitted after `pnpm build` with M3 :root defaults matching actual emitted `--mat-badge-*` references.

**Critical: verify emitted variable names before finalizing `:root`.**
Same pattern as Card Task 2 + Toolbar Task 2. The design spec §6.1 provides placeholder variable names — DO NOT ship them as-is if the emitted CSS references different names. Same bug class as Card `--mdc-*-card-*` vs `--mat-card-*`.

- [ ] **Step 1: Copy the 4 SCSS files verbatim**

```bash
mkdir -p src/qwik-material/scss/badge
cp src/material/badge/badge.scss           src/qwik-material/scss/badge/badge.scss
cp src/material/badge/_badge-theme.scss    src/qwik-material/scss/badge/_badge-theme.scss
cp src/material/badge/_m2-badge.scss       src/qwik-material/scss/badge/_m2-badge.scss
cp src/material/badge/_m3-badge.scss       src/qwik-material/scss/badge/_m3-badge.scss
```

- [ ] **Step 2: Enumerate `@use` paths**

```bash
grep -h "^@use" src/qwik-material/scss/badge/*.scss | sort -u
```

If any path is `@use '@angular/cdk'`, rewrite to `@use '../cdk-stub' as cdk` per established precedent (dialog + card + toolbar all did this). Preserve any alias name. Preserve every other `@use` line as-is.

- [ ] **Step 3: Create initial `badge-prebuilt.scss` with only `@use`**

```scss
// Prebuilt Material Badge CSS entry — initial pass with only @use, no :root
// yet. The Task 2 implementer verifies which --mat-badge-* variable names the
// emitted CSS actually references before adding :root defaults (established
// Card + Toolbar precedent — prevents phantom-variable bugs).
@use './badge';
```

- [ ] **Step 4: Run the build + inspect emitted CSS references**

```bash
pnpm -C src/qwik-material build
```

Confirm exit 0 and `dist/badge-prebuilt.css` exists. Then enumerate the real `--mat-badge-*` references:

```bash
grep -oE "var\(--mat-badge-[a-z-]+" src/qwik-material/dist/badge-prebuilt.css | sort -u
```

Record the exact names. Also check `--mdc-badge-*` references in case badge uses MDC token names:

```bash
grep -oE "var\(--(mat|mdc)-badge-[a-z-]+" src/qwik-material/dist/badge-prebuilt.css | sort -u
```

- [ ] **Step 5: Update `badge-prebuilt.scss` with the correct M3 `:root` block**

Append a `:root` block that defines EVERY unique variable Step 4's grep produced. Use these M3 canonical values (adjust to reality):

- Badge background: `var(--mat-sys-error, #d32f2f)` (Material 3 uses error color for badges by default)
- Badge text color: `var(--mat-sys-on-error, #ffffff)`
- Text font: `Roboto, "Helvetica Neue", sans-serif`
- Text size: `0.75rem` (small badge label)
- Text weight: `600`
- Line height: `1`
- Shape (border-radius): `100px` (pill)
- Small size: `6px` (dot)
- Medium size: `22px` (default label)
- Large size: `28px`
- Container offset: `-11px 0` (for above-after positioning)

Example structure (adjust names to match Step 4's grep output; drop any suggested variable that grep didn't produce — same handling as Toolbar Task 2's phantom-variable decision):

```scss
@use './badge';

// Minimal Material Design 3 defaults so a bare consumer sees a themed badge.
// Values sourced from @angular/material/badge M3 tokens.
// Variable names verified against dist/badge-prebuilt.css structural CSS.
:root {
  --mat-badge-background-color: var(--mat-sys-error, #d32f2f);
  --mat-badge-text-color: var(--mat-sys-on-error, #ffffff);
  --mat-badge-text-font: Roboto, "Helvetica Neue", sans-serif;
  --mat-badge-text-size: 0.75rem;
  --mat-badge-text-weight: 600;
  --mat-badge-line-height: 1;
  --mat-badge-container-shape: 100px;
  --mat-badge-container-size: 22px;
  --mat-badge-small-size-container-size: 6px;
  --mat-badge-large-size-container-size: 28px;
  --mat-badge-container-offset: -11px 0;
}
```

If Step 4 revealed variables NOT in this suggestion list (e.g. `--mat-badge-legacy-container-size`, `--mat-badge-container-shape-medium`), add them with reasonable defaults matching M3 spec. If Step 4 revealed suggestions here aren't referenced (phantom variables), DROP them rather than shipping — same handling as Toolbar Task 2.

- [ ] **Step 6: Rebuild and verify M3 defaults land**

```bash
pnpm -C src/qwik-material build
```

Confirm exit 0. Verify the first variable in the `:root` block appears both as a define AND as a structural reference:

```bash
grep -c "mat-badge-background-color" src/qwik-material/dist/badge-prebuilt.css
```

Expected: `>= 2` (one define, one reference). If `< 2`, the variable name doesn't match structural CSS — fix.

- [ ] **Step 7: Sanity-check the emitted CSS**

```bash
grep -c "mat-badge" src/qwik-material/dist/badge-prebuilt.css
```

Expected: `> 20` (structural rules for position variants + size variants + color states + content span rules).

- [ ] **Step 8: Confirm no new stubs needed**

```bash
git status --short src/qwik-material/scss/
```

Expected: only `src/qwik-material/scss/badge/` files appear. If any new stubs landed elsewhere, note them in the report.

- [ ] **Step 9: Commit**

```bash
git add src/qwik-material/scss/badge/  # plus any new stub paths
git commit -m "$(cat <<'EOF'
feat(multiple): copy Material Badge SCSS + prebuilt CSS entry with M3 defaults

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Foundation types

### Task 3: `MatBadgeColor` + `MatBadgePosition` + `MatBadgeSize` type files

**Reference source:** `src/material/badge/badge.ts` lines 31-42 (MatBadgePosition, MatBadgeSize types; MatBadgeColor is narrowed from upstream's `ThemePalette`).

**Files:**
- Create: `src/qwik-material/badge/badge-color.ts`
- Create: `src/qwik-material/badge/badge-color.spec.ts`
- Create: `src/qwik-material/badge/badge-position.ts`
- Create: `src/qwik-material/badge/badge-position.spec.ts`
- Create: `src/qwik-material/badge/badge-size.ts`
- Create: `src/qwik-material/badge/badge-size.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: three type aliases. Consumed by `badge-config.ts` (Task 4), `mat-badge.tsx` (Task 5), public-api (Task 7), scenarios (Task 8).

- [ ] **Step 1: Write `badge-color.ts`**

```ts
/**
 * M2 palette color for <MatBadge>. Deprecated in M3 but honoured for
 * backwards compatibility. Applying `color` adds a `mat-badge-<color>` class.
 */
export type MatBadgeColor = 'primary' | 'accent' | 'warn';
```

- [ ] **Step 2: Write `badge-color.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import type {MatBadgeColor} from './badge-color';

describe('MatBadgeColor', () => {
  it('accepts the three documented literal values', () => {
    const a: MatBadgeColor = 'primary';
    const b: MatBadgeColor = 'accent';
    const c: MatBadgeColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
```

- [ ] **Step 3: Write `badge-position.ts`**

```ts
/**
 * Position of a MatBadge relative to its host element.
 * Any combination of 'above'|'below' and 'before'|'after'.
 */
export type MatBadgePosition =
  | 'above after'
  | 'above before'
  | 'below before'
  | 'below after'
  | 'before'
  | 'after'
  | 'above'
  | 'below';
```

- [ ] **Step 4: Write `badge-position.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import type {MatBadgePosition} from './badge-position';

describe('MatBadgePosition', () => {
  it('accepts all 8 documented combinations', () => {
    const values: MatBadgePosition[] = [
      'above after',
      'above before',
      'below before',
      'below after',
      'before',
      'after',
      'above',
      'below',
    ];
    expect(values).toHaveLength(8);
  });
});
```

- [ ] **Step 5: Write `badge-size.ts`**

```ts
/**
 * Size of a <MatBadge>. Small badges render as a dot with no content;
 * medium (default) and large render numeric or short-text content.
 */
export type MatBadgeSize = 'small' | 'medium' | 'large';
```

- [ ] **Step 6: Write `badge-size.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import type {MatBadgeSize} from './badge-size';

describe('MatBadgeSize', () => {
  it('accepts the three documented literal values', () => {
    const a: MatBadgeSize = 'small';
    const b: MatBadgeSize = 'medium';
    const c: MatBadgeSize = 'large';
    expect([a, b, c]).toEqual(['small', 'medium', 'large']);
  });
});
```

- [ ] **Step 7: Run the tests**

```bash
pnpm -C src/qwik-material test badge/badge-color badge/badge-position badge/badge-size
```

Expected: 3/3 files, 3/3 tests passing.

- [ ] **Step 8: Commit**

```bash
git add src/qwik-material/badge/badge-color.ts src/qwik-material/badge/badge-color.spec.ts \
        src/qwik-material/badge/badge-position.ts src/qwik-material/badge/badge-position.spec.ts \
        src/qwik-material/badge/badge-size.ts src/qwik-material/badge/badge-size.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatBadgeColor + MatBadgePosition + MatBadgeSize types

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `MatBadgeConfig` + `MAT_BADGE_CONFIG` context token

**Reference source:** `src/material/badge/badge.ts` lines 44-60 (MatBadgeConfig interface + MAT_BADGE_CONFIG injection token).

**Files:**
- Create: `src/qwik-material/badge/badge-config.ts`
- Create: `src/qwik-material/badge/badge-config.spec.ts`

**Interfaces:**
- Consumes: `MatBadgeColor` + `MatBadgePosition` + `MatBadgeSize` from Task 3.
- Produces: `MatBadgeConfig` interface + `MAT_BADGE_CONFIG: ContextId<MatBadgeConfig>` token. Consumed by Task 5 (MatBadge reads `useContext(MAT_BADGE_CONFIG, DEFAULTS)`) and Task 6 (provider installs it).

- [ ] **Step 1: Write `badge-config.ts`**

```ts
import {createContextId} from '@builder.io/qwik';
import type {MatBadgeColor} from './badge-color';
import type {MatBadgePosition} from './badge-position';
import type {MatBadgeSize} from './badge-size';

/**
 * Object that can be used to configure default options for every MatBadge
 * rendered inside a <QwikMaterialProvider matBadgeConfig={…}> subtree.
 *
 * See design spec §2.1 and §2.3 for full field semantics.
 */
export interface MatBadgeConfig {
  /** Default position. Defaults to 'above after' when unset. */
  position?: MatBadgePosition;
  /** Default size. Defaults to 'medium' when unset. */
  size?: MatBadgeSize;
  /** Default color. Defaults to 'primary' when unset. */
  color?: MatBadgeColor;
  /** Default overlap. Defaults to true when unset. */
  overlap?: boolean;
}

/**
 * Context token that installs default MatBadge options in a subtree.
 * Provided by <QwikMaterialProvider matBadgeConfig={…}>. Consumed by
 * MatBadge via `useContext(MAT_BADGE_CONFIG, DEFAULTS)`.
 */
export const MAT_BADGE_CONFIG = createContextId<MatBadgeConfig>('qwik-material/badge-config');
```

- [ ] **Step 2: Write `badge-config.spec.ts`**

```ts
import {describe, it, expect} from 'vitest';
import {MAT_BADGE_CONFIG, type MatBadgeConfig} from './badge-config';

describe('MatBadgeConfig', () => {
  it('accepts an empty config', () => {
    const c: MatBadgeConfig = {};
    expect(c).toBeDefined();
  });

  it('accepts every documented field', () => {
    const c: MatBadgeConfig = {
      position: 'below before',
      size: 'large',
      color: 'accent',
      overlap: false,
    };
    expect(c.position).toBe('below before');
    expect(c.size).toBe('large');
    expect(c.color).toBe('accent');
    expect(c.overlap).toBe(false);
  });

  it('MAT_BADGE_CONFIG carries the expected context id', () => {
    expect(MAT_BADGE_CONFIG.id).toBe('qwik-material/badge-config');
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm -C src/qwik-material test badge/badge-config
```

Expected: 3/3 passing.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/badge/badge-config.ts src/qwik-material/badge/badge-config.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatBadgeConfig interface + MAT_BADGE_CONFIG token

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — MatBadge component

### Task 5: `<MatBadge>` component

**Reference source:** `src/material/badge/badge.ts` lines 62-375 (MatBadge directive class + all its logic).

**Files:**
- Create: `src/qwik-material/badge/mat-badge.tsx`
- Create: `src/qwik-material/badge/mat-badge.spec.tsx`

**Interfaces:**
- Consumes: `MatBadgeColor` / `MatBadgePosition` / `MatBadgeSize` from Task 3; `MAT_BADGE_CONFIG` + `MatBadgeConfig` from Task 4.
- Produces: `MatBadge: Component<MatBadgeProps>` + `MatBadgeProps` interface. Consumed by public-api (Task 7), dev-app routes (Task 9), Playwright specs (Task 9).

- [ ] **Step 1: Write `mat-badge.tsx`**

```tsx
import {component$, Slot, useContext} from '@builder.io/qwik';
import type {MatBadgeColor} from './badge-color';
import type {MatBadgePosition} from './badge-position';
import type {MatBadgeSize} from './badge-size';
import {MAT_BADGE_CONFIG, type MatBadgeConfig} from './badge-config';

/**
 * Props for <MatBadge>. Upstream's [matBadge] directive is applied to any
 * host element; here MatBadge is a wrapper component that renders a
 * <span class="mat-badge"> around the consumer's <Slot /> content and
 * inserts a <span class="mat-badge-content"> child for the badge overlay.
 * See design spec §3.1 for rendered DOM structure and §8 for deviations.
 */
export interface MatBadgeProps {
  /** Content shown inside .mat-badge-content. Empty string / undefined toggles mat-badge-hidden. */
  content?: string | number;
  /** M2 palette color. Deprecated in M3 but honoured. */
  color?: MatBadgeColor;
  /** Whether the badge overlaps its content. Defaults to config or true. */
  overlap?: boolean;
  /** Disables the badge (grays it out). Default false. */
  disabled?: boolean;
  /** Position of the badge overlay. Defaults to config or 'above after'. */
  position?: MatBadgePosition;
  /** Visually-hidden description read by screen readers. Rendered as an
   * inline <span class="cdk-visually-hidden"> inside the badge content span.
   * Works for both interactive and non-interactive hosts.
   */
  description?: string;
  /** Badge size. Defaults to config or 'medium'. */
  size?: MatBadgeSize;
  /** When true, applies .mat-badge-hidden class. Default false. */
  hidden?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatBadgeConfig = {
  position: 'above after',
  size: 'medium',
  color: 'primary',
  overlap: true,
};

/**
 * Module-level counter for the badge-content id. Global monotonic id per
 * module load — not request-scoped. On SSR + hydration, ids may not match
 * between server and client renders. Same pattern as Dialog + Card _idSeq.
 * Documented in SYNC.md.
 */
let _idSeq = 0;

export const MatBadge = component$<MatBadgeProps>(props => {
  const config = useContext(MAT_BADGE_CONFIG, DEFAULTS);
  const position = props.position ?? config.position ?? 'above after';
  const size = props.size ?? config.size ?? 'medium';
  const color = props.color ?? config.color ?? 'primary';
  const overlap = props.overlap ?? config.overlap ?? true;
  const disabled = props.disabled ?? false;
  const hidden = props.hidden ?? false;

  const contentStr = props.content == null ? '' : `${props.content}`.trim();
  const isAbove = !position.includes('below');
  const isAfter = !position.includes('before');
  const isHidden = hidden || !contentStr;

  const classes = [
    'mat-badge',
    color && `mat-badge-${color}`,
    `mat-badge-${size}`,
    isAbove ? 'mat-badge-above' : 'mat-badge-below',
    isAfter ? 'mat-badge-after' : 'mat-badge-before',
    overlap && 'mat-badge-overlap',
    isHidden && 'mat-badge-hidden',
    disabled && 'mat-badge-disabled',
    props.class,
  ].filter(Boolean) as string[];

  const badgeContentId = `mat-badge-content-${_idSeq++}`;

  return (
    <span id={props.id} class={classes}>
      <Slot />
      <span
        id={badgeContentId}
        class="mat-badge-content mat-badge-active"
        aria-hidden="true"
      >
        {contentStr}
        {props.description && (
          <span class="cdk-visually-hidden">{props.description}</span>
        )}
      </span>
    </span>
  );
});
```

- [ ] **Step 2: Write smoke spec `mat-badge.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {MatBadge} from './mat-badge';

describe('MatBadge (module-import smoke)', () => {
  it('MatBadge is a Qwik component', () => {
    expect(MatBadge).toBeDefined();
    expect(typeof MatBadge).toBe('function');
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
pnpm -C src/qwik-material test badge/mat-badge
```

Expected: 1/1 pass.

- [ ] **Step 4: Run typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. If the class-array cast errors, keep `as string[]` per established precedent from Dialog + Button + Card + Toolbar ports.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/badge/mat-badge.tsx src/qwik-material/badge/mat-badge.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatBadge wrapper component with 8 props

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Provider extension

### Task 6: Extend `<QwikMaterialProvider>` with `matBadgeConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (existing provider extended in Card + Toolbar phases).

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-badge.spec.tsx`

**Interfaces:**
- Consumes: `MatBadgeConfig` + `MAT_BADGE_CONFIG` from Task 4.
- Produces: `QwikMaterialProviderProps.matBadgeConfig` optional field. When set, provider installs `MAT_BADGE_CONFIG` in the subtree. Consumed by MatBadge (Task 5) via `useContext(MAT_BADGE_CONFIG, DEFAULTS)`.

- [ ] **Step 1: Read the current provider file**

```bash
cat src/qwik-material/dialog/qwik-material-provider.tsx
```

Confirm the existing structure. It currently has FIVE `useContextProvider` calls (dialog defaults, dialog scroll-strategy, animations-disabled, matButtonConfig, matCardConfig).

- [ ] **Step 2: Add the `matBadgeConfig` prop + provider call**

Update the file in-place. Add imports:

```tsx
import type {MatBadgeConfig} from '../badge/badge-config';
import {MAT_BADGE_CONFIG} from '../badge/badge-config';
```

Add the prop to `QwikMaterialProviderProps` (append after `matCardConfig`):

```tsx
/** Defaults applied to every MatBadge in this subtree. */
matBadgeConfig?: MatBadgeConfig;
```

Add the `useContextProvider` call at the END of the body (after the matCardConfig one):

```tsx
// MatBadgeConfig is a plain object with primitive fields — no noSerialize needed.
// Badges outside a provider get the DEFAULTS declared in MatBadge; providing
// an empty object is equivalent to accepting all defaults.
useContextProvider(MAT_BADGE_CONFIG, props.matBadgeConfig ?? {});
```

Preserve every existing `useContextProvider` call unchanged (dialog defaults, dialog scroll-strategy with noSerialize, animations-disabled, matButtonConfig, matCardConfig).

- [ ] **Step 3: Write `qwik-material-provider-badge.spec.tsx`**

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider} from './qwik-material-provider';

describe('QwikMaterialProvider (badge config smoke)', () => {
  it('QwikMaterialProvider is a Qwik component', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });
});
```

Smoke-only spec — flow-through verification lives in Task 9 (Playwright).

- [ ] **Step 4: Run the tests**

```bash
pnpm -C src/qwik-material test dialog/qwik-material-provider
```

Expected: previously-passing count unchanged + 1 new smoke test.

- [ ] **Step 5: Run typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/dialog/qwik-material-provider.tsx \
        src/qwik-material/dialog/qwik-material-provider-badge.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): extend QwikMaterialProvider with matBadgeConfig field

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Public API + build validation

### Task 7: `badge/public-api.ts` + `badge/index.ts` + build verification

**Reference source:** `src/qwik-material/toolbar/public-api.ts` (existing pattern from Toolbar port).

**Files:**
- Create: `src/qwik-material/badge/public-api.ts`
- Modify: `src/qwik-material/badge/index.ts` (replaces the empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Phases 3-5.
- Produces: consumer-facing surface `@angular-community/qwik-material/badge`. Consumed by dev-app routes + Playwright specs (Task 9).

- [ ] **Step 1: Write `badge/public-api.ts`**

```ts
// Public API for @angular-community/qwik-material/badge.
// See docs/superpowers/specs/2026-07-27-qwik-material-badge-port-design.md §2.

export type {MatBadgeColor} from './badge-color';
export type {MatBadgePosition} from './badge-position';
export type {MatBadgeSize} from './badge-size';
export type {MatBadgeConfig} from './badge-config';
export {MAT_BADGE_CONFIG} from './badge-config';
export {MatBadge, type MatBadgeProps} from './mat-badge';
```

- [ ] **Step 2: Replace `badge/index.ts` stub with the real re-export**

```ts
export * from './public-api';
```

- [ ] **Step 3: Verify build + typecheck are clean**

```bash
pnpm -C src/qwik-material build && pnpm -C src/qwik-material typecheck
```

Expected: both exit 0. Build emits `dist/badge/index.js` (~0.5-1 KB) + `dist/badge/index.d.ts` + `dist/badge/public-api.d.ts`.

- [ ] **Step 4: Sanity-check the exported surface**

```bash
grep -nE "^export " src/qwik-material/dist/badge/public-api.d.ts | head -15
```

Expected output includes:
- `export declare const MAT_BADGE_CONFIG: ...`
- `export declare const MatBadge: ...`
- Type re-exports (`MatBadgeColor`, `MatBadgePosition`, `MatBadgeSize`, `MatBadgeConfig`, `MatBadgeProps`)

Confirm zero exported classes on the consumer surface:

```bash
grep -nE "^export declare class" src/qwik-material/dist/badge/public-api.d.ts
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/badge/public-api.ts src/qwik-material/badge/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): finalize qwik-material/badge public API

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Scenario tests

### Task 8: Vitest scenario port from `src/material/badge/badge.spec.ts`

**Reference source:** `src/material/badge/badge.spec.ts` (378 LOC, 20 upstream `it()` blocks — pre-enumerated by the plan author).

**Upstream `it()` inventory (bucketed):**

DOM-rendered → Playwright Task 9 (12 stubs):
1. `should update the badge based on attribute`
2. `should be able to pass in falsy values to the badge content`
3. `should treat null and undefined as empty strings in the badge content`
4. `should apply class based on color attribute`
5. `should update the badge position on direction change` (RTL — deferred)
6. `should change visibility to hidden`
7. `should change badge sizes`
8. `should change badge overlap`
9. `should toggle visibility based on whether the badge has content`
10. `should toggle a class depending on the badge disabled state`
11. `should apply view encapsulation on create badge content` (Angular-specific but structurally testable)
12. `should not insert an inline description`

Angular-only / CDK-dependent (7 stubs):
13. `should toggle 'aria-describedby' depending on whether the badge has a description` — CDK AriaDescriber (§8 deviation #2)
14. `should clear any pre-existing badges` — SSR cleanup (§8 deviation #5)
15. `should not clear badge content from child elements` — SSR cleanup
16. `should throw if badge is not attached to an element node` — dev-mode error (§8 deviation #9)
17. `should insert the description inline after the host` — InteractivityChecker (§8 deviation #2)
18. `should not apply aria-describedby for non-interactive hosts` — InteractivityChecker
19. `should be able to specify default values through DI` — Angular DI

Plus `should expose the badge element` (test 12 in upstream but split by describe block; wraps `getBadgeElement()` — omitted API in port, Angular-only).

Total upstream: 20 `it()`. Restructured for smoke-only vitest:
- **Live sanity tests (7):** MatBadge typeof + all 4 exported type unions + MAT_BADGE_CONFIG.id + Provider export smoke
- **describe.skip (12 DOM-render stubs):** deferred to Playwright Task 9
- **describe.skip (8 Angular-only stubs):** deferred forever per §8 deviations

**Files:**
- Create: `src/qwik-material/badge/mat-badge-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 7.
- Produces: consolidated scenario coverage documenting upstream test intent.

- [ ] **Step 1: Write the scenario spec**

```tsx
/**
 * MatBadge scenario port from src/material/badge/badge.spec.ts.
 *
 * Upstream has 20 `it()` blocks — 12 DOM-rendered (→ Playwright Task 9) +
 * 8 Angular-only (skipped forever per design spec §8 deviations 2, 5, 9).
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-badge/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_BADGE_CONFIG,
  MatBadge,
  type MatBadgeColor,
  type MatBadgePosition,
  type MatBadgeSize,
  type MatBadgeConfig,
} from './public-api';

describe('MatBadge — sanity', () => {
  it('MatBadge is exported', () => {
    expect(MatBadge).toBeDefined();
    expect(typeof MatBadge).toBe('function');
  });

  it('MAT_BADGE_CONFIG carries the expected context id', () => {
    expect(MAT_BADGE_CONFIG.id).toBe('qwik-material/badge-config');
  });

  it('MatBadgeColor accepts the documented values', () => {
    const a: MatBadgeColor = 'primary';
    const b: MatBadgeColor = 'accent';
    const c: MatBadgeColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });

  it('MatBadgePosition accepts all 8 documented values', () => {
    const values: MatBadgePosition[] = [
      'above after', 'above before', 'below before', 'below after',
      'before', 'after', 'above', 'below',
    ];
    expect(values).toHaveLength(8);
  });

  it('MatBadgeSize accepts the documented values', () => {
    const a: MatBadgeSize = 'small';
    const b: MatBadgeSize = 'medium';
    const c: MatBadgeSize = 'large';
    expect([a, b, c]).toEqual(['small', 'medium', 'large']);
  });

  it('MatBadgeConfig accepts an empty config', () => {
    const cfg: MatBadgeConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatBadgeConfig accepts every documented field', () => {
    const cfg: MatBadgeConfig = {
      position: 'below before',
      size: 'large',
      color: 'accent',
      overlap: false,
    };
    expect(cfg.overlap).toBe(false);
  });
});

describe.skip('MatBadge DOM-rendered scenarios — deferred to Playwright Task 9', () => {
  it('should update the badge based on attribute', () => {});
  it('should be able to pass in falsy values to the badge content', () => {});
  it('should treat null and undefined as empty strings in the badge content', () => {});
  it('should apply class based on color attribute', () => {});
  it('should update the badge position on direction change (RTL)', () => {});
  it('should change visibility to hidden', () => {});
  it('should change badge sizes', () => {});
  it('should change badge overlap', () => {});
  it('should toggle visibility based on whether the badge has content', () => {});
  it('should toggle a class depending on the badge disabled state', () => {});
  it('should apply view encapsulation on create badge content', () => {});
  it('should not insert an inline description', () => {});
});

describe.skip('MatBadge — Angular-only tests', () => {
  it("should toggle 'aria-describedby' depending on whether the badge has a description", () => {
    // CDK AriaDescriber flow — skipped per design spec §8 deviation #2.
  });
  it('should clear any pre-existing badges', () => {
    // SSR cleanup — skipped per design spec §8 deviation #5.
  });
  it('should not clear badge content from child elements', () => {
    // SSR cleanup — skipped per design spec §8 deviation #5.
  });
  it('should throw if badge is not attached to an element node', () => {
    // Dev-mode error — skipped per design spec §8 deviation #9.
  });
  it('should insert the description inline after the host', () => {
    // InteractivityChecker — replaced by always-inline span in §8 deviation #2.
  });
  it('should not apply aria-describedby for non-interactive hosts', () => {
    // InteractivityChecker — replaced by always-inline span in §8 deviation #2.
  });
  it('should be able to specify default values through DI', () => {
    // Provider flow verified in Task 9 dev-app + Task 9 Playwright.
  });
  it('should expose the badge element via getBadgeElement()', () => {
    // Imperative Angular API — no Qwik equivalent, omitted.
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
pnpm -C src/qwik-material test badge/mat-badge-scenarios
```

Expected: 7 passing + 20 skipped.

- [ ] **Step 3: Run the full qwik-material suite for regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-8 total + 7 passing + 20 skipped from this task, zero failures.

- [ ] **Step 4: Commit**

```bash
git add src/qwik-material/badge/mat-badge-scenarios.spec.tsx
git commit -m "$(cat <<'EOF'
test(multiple): port MatBadge scenarios from upstream badge.spec.ts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Dev-app + Playwright parity

### Task 9: 8 mat-badge dev-app routes + index tile + root.tsx CSS import + 8 Playwright parity specs

**Reference source:** existing dev-app + Playwright patterns from Toolbar port at `src/qwik-cdk-dev-app/src/routes/mat-toolbar/` and `src/qwik-cdk-parity-tests/specs/material-toolbar/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add badge-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Badges" section with 8 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-badge/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-badge/colors/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-badge/sizes/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-badge/positions/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-badge/no-overlap/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-badge/hidden/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-badge/disabled/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-badge/description/index.tsx`
- Create: `src/qwik-cdk-parity-tests/specs/material-badge/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-badge/colors.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-badge/sizes.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-badge/positions.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-badge/no-overlap.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-badge/hidden.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-badge/disabled.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-badge/description.spec.ts`

**Interfaces:**
- Consumes: `@angular-community/qwik-material/badge` (Task 7).
- Produces: 8 mount-only dev-app routes + 8 Playwright specs asserting wrapper classes + content span.

- [ ] **Step 1: Add the badge-prebuilt.css import to `src/qwik-cdk-dev-app/src/root.tsx`**

Read the current file. Append the badge CSS import after the toolbar one:

```tsx
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/card-prebuilt.css';
import '@angular-community/qwik-material/toolbar-prebuilt.css';
import '@angular-community/qwik-material/badge-prebuilt.css';
```

- [ ] **Step 2: Add a "Badges" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert after the existing "Toolbars" section:

```tsx
<section>
  <h2>Badges</h2>
  <ul>
    <li><a href="/mat-badge/basic/">basic</a></li>
    <li><a href="/mat-badge/colors/">colors</a></li>
    <li><a href="/mat-badge/sizes/">sizes</a></li>
    <li><a href="/mat-badge/positions/">positions</a></li>
    <li><a href="/mat-badge/no-overlap/">no-overlap</a></li>
    <li><a href="/mat-badge/hidden/">hidden</a></li>
    <li><a href="/mat-badge/disabled/">disabled</a></li>
    <li><a href="/mat-badge/description/">description</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="5">
      <button>Notifications</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `colors/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="3" color="primary">
      <button>Primary</button>
    </MatBadge>
    <MatBadge content="7" color="accent">
      <button>Accent</button>
    </MatBadge>
    <MatBadge content="9" color="warn">
      <button>Warn</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `sizes/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="1" size="small">
      <button>Small</button>
    </MatBadge>
    <MatBadge content="5" size="medium">
      <button>Medium</button>
    </MatBadge>
    <MatBadge content="99" size="large">
      <button>Large</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create `positions/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="1" position="above after">
      <button>Above-After</button>
    </MatBadge>
    <MatBadge content="2" position="above before">
      <button>Above-Before</button>
    </MatBadge>
    <MatBadge content="3" position="below after">
      <button>Below-After</button>
    </MatBadge>
    <MatBadge content="4" position="below before">
      <button>Below-Before</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `no-overlap/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="9" overlap={false}>
      <button>Cart</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create `hidden/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="5" hidden>
      <button>Inbox</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Create `disabled/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="5" disabled>
      <button>Alerts</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 10: Create `description/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="5" description="3 unread messages">
      <button>Messages</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 11: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Confirm client + SSR builds succeed. Verify 8 mat-badge routes in the manifest:

```bash
grep -oE 'mat-badge/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `8`.

- [ ] **Step 12: Create `basic.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/basic — wrapper span carries mat-badge classes + content span present', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('span.mat-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveClass(/mat-badge(\s|$)/);
  await expect(badge).toHaveClass(/mat-badge-primary/);
  await expect(badge).toHaveClass(/mat-badge-medium/);
  await expect(badge).toHaveClass(/mat-badge-above/);
  await expect(badge).toHaveClass(/mat-badge-after/);
  await expect(badge).toHaveClass(/mat-badge-overlap/);

  const content = page.locator('span.mat-badge-content');
  await expect(content).toBeVisible();
  await expect(content).toContainText('5');
  await expect(content).toHaveAttribute('aria-hidden', 'true');
  await expect(content).toHaveClass(/mat-badge-active/);
});
```

- [ ] **Step 13: Create `colors.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/colors — 3 wrappers with distinct mat-badge-{primary,accent,warn} classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/colors/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badges = page.locator('span.mat-badge');
  await expect(badges).toHaveCount(3);

  await expect(badges.nth(0)).toHaveClass(/mat-badge-primary/);
  await expect(badges.nth(1)).toHaveClass(/mat-badge-accent/);
  await expect(badges.nth(2)).toHaveClass(/mat-badge-warn/);
});
```

- [ ] **Step 14: Create `sizes.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/sizes — 3 wrappers with distinct mat-badge-{small,medium,large} classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/sizes/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badges = page.locator('span.mat-badge');
  await expect(badges).toHaveCount(3);

  await expect(badges.nth(0)).toHaveClass(/mat-badge-small/);
  await expect(badges.nth(1)).toHaveClass(/mat-badge-medium/);
  await expect(badges.nth(2)).toHaveClass(/mat-badge-large/);
});
```

- [ ] **Step 15: Create `positions.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/positions — 4 wrappers cover all 4 above/below × before/after combinations', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/positions/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badges = page.locator('span.mat-badge');
  await expect(badges).toHaveCount(4);

  // above-after: above + after
  await expect(badges.nth(0)).toHaveClass(/mat-badge-above/);
  await expect(badges.nth(0)).toHaveClass(/mat-badge-after/);

  // above-before: above + before
  await expect(badges.nth(1)).toHaveClass(/mat-badge-above/);
  await expect(badges.nth(1)).toHaveClass(/mat-badge-before/);

  // below-after: below + after
  await expect(badges.nth(2)).toHaveClass(/mat-badge-below/);
  await expect(badges.nth(2)).toHaveClass(/mat-badge-after/);

  // below-before: below + before
  await expect(badges.nth(3)).toHaveClass(/mat-badge-below/);
  await expect(badges.nth(3)).toHaveClass(/mat-badge-before/);
});
```

- [ ] **Step 16: Create `no-overlap.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/no-overlap — mat-badge without mat-badge-overlap class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/no-overlap/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('span.mat-badge');
  await expect(badge).toBeVisible();
  await expect(badge).not.toHaveClass(/mat-badge-overlap/);
});
```

- [ ] **Step 17: Create `hidden.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/hidden — mat-badge with mat-badge-hidden class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/hidden/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('span.mat-badge');
  await expect(badge).toBeAttached();
  await expect(badge).toHaveClass(/mat-badge-hidden/);
});
```

- [ ] **Step 18: Create `disabled.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/disabled — mat-badge with mat-badge-disabled class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/disabled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('span.mat-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveClass(/mat-badge-disabled/);
});
```

- [ ] **Step 19: Create `description.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/description — inline cdk-visually-hidden span carries the description text', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/description/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('span.mat-badge');
  await expect(badge).toBeVisible();

  const content = page.locator('span.mat-badge-content');
  await expect(content).toContainText('5');

  const desc = page.locator('span.mat-badge-content > span.cdk-visually-hidden');
  await expect(desc).toBeAttached();
  await expect(desc).toHaveText('3 unread messages');
});
```

- [ ] **Step 20: Do NOT run Playwright**

Chromium install + preview server are human-managed steps. Skip execution — Task 10 documents the manual verification step.

- [ ] **Step 21: Commit**

```bash
git add \
  src/qwik-cdk-dev-app/src/root.tsx \
  src/qwik-cdk-dev-app/src/routes/index.tsx \
  src/qwik-cdk-dev-app/src/routes/mat-badge/ \
  src/qwik-cdk-parity-tests/specs/material-badge/
git commit -m "$(cat <<'EOF'
feat(multiple): mat-badge dev-app routes (8) + Playwright parity specs (8)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Finalisation

### Task 10: SYNC.md + pipeline verification

**Reference source:** `src/qwik-material/toolbar/SYNC.md` (existing SYNC pattern from Toolbar port).

**Files:**
- Create: `src/qwik-material/badge/SYNC.md`
- Modify (only if new stubs added in Task 2): `src/qwik-material/dialog/SYNC.md` (append note about badge-owned stubs; expected: no-op)

**Interfaces:**
- Consumes: everything from Tasks 1-9.
- Produces: `SYNC.md` documenting the badge port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/badge/SYNC.md`**

```markdown
# qwik-material/badge sync log

Tracks the sync state between this port and `src/material/badge/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, and `src/qwik-material/toolbar/SYNC.md`.

## Upstream sync state

| File                                | Upstream path                                     | Sync state | Notes                                                                                    |
| ----------------------------------- | ------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `badge/mat-badge.tsx`               | `src/material/badge/badge.ts` (MatBadge directive) | ported     | Directive→component$; renders <span class="mat-badge"> wrapper with Slot for consumer content + inline description span |
| `badge/badge-color.ts`              | `src/material/badge/badge.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union                                      |
| `badge/badge-position.ts`           | `src/material/badge/badge.ts` (MatBadgePosition type) | ported  | Verbatim 8-value union                                                                   |
| `badge/badge-size.ts`               | `src/material/badge/badge.ts` (MatBadgeSize type) | ported     | Verbatim 3-value union                                                                   |
| `badge/badge-config.ts`             | `src/material/badge/badge.ts` (MatBadgeConfig) | ported     | InjectionToken→createContextId; folded into QwikMaterialProvider.matBadgeConfig          |
| `scss/badge/badge.scss`             | `src/material/badge/badge.scss`                   | (verify)   | If `@use '@angular/cdk'` was rewritten to `@use '../cdk-stub' as cdk`, this row reads "synced with one deviation" instead — Task 2 confirms |
| `scss/badge/_badge-theme.scss`      | `src/material/badge/_badge-theme.scss`            | synced     | byte-identical copy                                                                      |
| `scss/badge/_m2-badge.scss`         | `src/material/badge/_m2-badge.scss`               | synced     | byte-identical copy                                                                      |
| `scss/badge/_m3-badge.scss`         | `src/material/badge/_m3-badge.scss`               | synced     | byte-identical copy                                                                      |
| `scss/badge/badge-prebuilt.scss`    | (qwik-material-specific)                          | new        | @use badge.scss + M3 :root defaults matching emitted --mat-badge-* references            |

**Task 10 implementer:** replace the `(verify)` row above for `badge.scss` based on Task 2's report — if Task 2 rewrote `@angular/cdk`, mark "synced with one deviation" and note the rewrite; if Task 2 didn't touch it (no `@angular/cdk` @use in badge.scss), mark "synced | byte-identical copy".

## Removed upstream files

- `badge-module.ts` → Qwik has no module concept
- `badge.spec.ts` → port lives in `mat-badge-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint
- `_MatBadgeStyleLoader` component (in `badge.ts`) → omitted; qwik-material consumers import `badge-prebuilt.css` directly at their app root

## Deviations from upstream

1. **`[matBadge]` attribute directive → `<MatBadge>` wrapper component.** Consumer wraps their element in `<MatBadge>`; wrapper renders an extra `<span class="mat-badge">` around consumer content. Classes on the wrapper, NOT on the consumer's element.
2. **CDK `AriaDescriber` + `InteractivityChecker` skipped.** `description` prop always renders an inline `<span class="cdk-visually-hidden">` inside the badge-content span. Works for both interactive and non-interactive hosts. Deferred: no `aria-describedby` on the host element.
3. **`ngDevMode` "matBadge on aria-hidden mat-icon" warning skipped** — Angular-specific dev-mode helper.
4. **rAF fade-in animation skipped.** `.mat-badge-active` class always applied at render time — no `useVisibleTask$` deferring the class toggle. Consumer sees the badge immediately.
5. **SSR badge-cleanup (`_clearExistingBadges`) skipped.** Angular's `renderer.createElement` + `host.appendChild` approach needed cleanup on re-hydration; Qwik's static resume model doesn't need it.
6. **`content` prop typed `string | number | undefined`** (drops `null` — Qwik idiom favors `undefined`).
7. **`MAT_BADGE_CONFIG` folded into `QwikMaterialProvider.matBadgeConfig`** — established pattern from Dialog + Button + Card.
8. **Module-level `_idSeq` counter** for `.mat-badge-content` id. Global monotonic id per module load. Not request-scoped; on SSR + hydration, ids may not match between server and client renders. Same pattern as Dialog + Card `_idSeq`.
9. **`throwError` on non-element hosts skipped.** Consumer's Slot content is whatever they pass; no runtime validation.
10. **`_MatBadgeStyleLoader` component omitted.** Upstream uses it via `_CdkPrivateStyleLoader` to lazy-load the badge CSS. Qwik-material consumers import `badge-prebuilt.css` directly at their app root; no lazy loading needed.

## Stub inventory delta

(Populated by the Task 2 SCSS-copy step. Expected: "No new stubs — badge chain reused all existing dialog + button + card + toolbar port stubs.")

## Class count

`grep -nE "^export class" src/qwik-material/badge/**/*.ts src/qwik-material/badge/**/*.tsx`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge.
```

- [ ] **Step 2: If Task 2 added new stubs, append note to dialog SYNC.md**

Only do this if Task 2's report identified new stubs under `scss/` outside `badge/`. Expected outcome per Task 2: zero new stubs — this step is a no-op — skip and note in commit body.

- [ ] **Step 3: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** all 5 prebuilt CSS files emit; JS + d.ts under `dist/{dialog,button,card,toolbar,badge}/`.
- **Vitest:** all specs pass across 5 entry-points.
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 4: Verify the Class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/badge/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/badge/SYNC.md \
        src/qwik-material/dialog/SYNC.md  # only if step 2 changed it
git commit -m "$(cat <<'EOF'
docs(multiple): finalize qwik-material/badge SYNC.md + pipeline verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Layout

```
src/qwik-material/
  badge/
    badge-color.ts                 — MatBadgeColor type (Task 3)
    badge-color.spec.ts
    badge-position.ts              — MatBadgePosition type (Task 3)
    badge-position.spec.ts
    badge-size.ts                  — MatBadgeSize type (Task 3)
    badge-size.spec.ts
    badge-config.ts                — MatBadgeConfig + MAT_BADGE_CONFIG (Task 4)
    badge-config.spec.ts
    mat-badge.tsx                  — <MatBadge> (Task 5)
    mat-badge.spec.tsx             — smoke (Task 5)
    mat-badge-scenarios.spec.tsx   — upstream scenario port (Task 8)
    public-api.ts                  — consumer-facing re-exports (Task 7)
    index.ts                       — `export * from './public-api'` (Task 1 stub / Task 7 real)
    SYNC.md                        — deviation + stub log (Task 10)
  dialog/
    qwik-material-provider.tsx     — MODIFIED in Task 6 (adds matBadgeConfig)
    qwik-material-provider-badge.spec.tsx — new spec (Task 6)
  scss/
    badge/                         — 4 verbatim SCSS files + badge-prebuilt.scss (Task 2)
  package.json                     — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                   — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                       — MODIFIED in Task 9 (badge-prebuilt.css import)
    routes/
      index.tsx                    — MODIFIED in Task 9 (Badges section)
      mat-badge/                   — 8 new route files (Task 9)

src/qwik-cdk-parity-tests/
  specs/
    material-badge/                — 8 new Playwright specs (Task 9)
```

## Per-entry-point state

The `badge` entry-point becomes the fifth entry after `dialog` + `button` + `card` + `toolbar` in the qwik-material package. All five live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` (from earlier ports) is the only intersection, extended in Task 6.

## Sync recipe

To re-sync a specific file from upstream `src/material/badge/`:

1. Locate the upstream file's counterpart in the `badge/SYNC.md` sync table.
2. If "synced" state: `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "ported" state: manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change to the `mat-badge.tsx` file, update the corresponding `.spec.tsx`.
4. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck)
- 8 dev-app routes at `/mat-badge/*` render visibly in browser preview
- 8 Playwright specs pass locally when run against the built dev-app preview
- Every Playwright spec asserts on the `<span class="mat-badge">` wrapper AT LEAST ONCE — regression that drops the wrapper fails loudly
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/badge/` returns nothing)
- Zero SSR-leak violations
- SYNC.md populated with all 10 deviations + stub delta

---

## Class count

Zero exported classes on the consumer surface. Interfaces + `component$` factory + a config token exclusively.

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package. Adding badge doesn't require any pipeline change — the scripts already glob the entire `src/qwik-material/` tree.
