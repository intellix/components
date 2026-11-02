# qwik-material Icon Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `src/material/icon/` into a `qwik-material/icon` entry-point as a stateless `<MatIcon>` component that renders `<mat-icon>` in one of two mutually-exclusive modes (font-icon via slot content or `fontIcon`/`fontSet` props; inline SVG via `svgLiteral` set through `dangerouslySetInnerHTML`). The `MatIconRegistry` service and every XHR/DomSanitizer/RxJS surface is omitted entirely.

**Architecture:** Single stateless `component$` reads `MAT_ICON_CONFIG` for defaults, resolves each prop through the `prop ?? config` fallback, and renders one of two JSX branches. Font branch nests `<Slot />` inside `<mat-icon>` and emits a `fontIcon` attribute for `[fontIcon]::before` CSS glyph rendering. SVG branch calls `dangerouslySetInnerHTML` with the consumer-provided string. Zero id counters, zero browser globals, zero lifecycle work.

**Tech Stack:** Qwik 1.x, TypeScript, Vite (library mode), Vitest + happy-dom, Sass, Playwright. Reuses the existing `@angular-community/qwik-material` package created by the Dialog + Button + Card + Toolbar + Badge ports.

## Global Constraints

- **Package name:** `@angular-community/qwik-material` (existing). New entry-point: `./icon`. New prebuilt CSS entry: `./icon-prebuilt.css`.
- **Repository root:** `/Users/dom/Projects/github/angular/components`. All paths in this plan are relative to that.
- **Spec reference:** [docs/superpowers/specs/2026-07-29-qwik-material-icon-port-design.md](../specs/2026-07-29-qwik-material-icon-port-design.md). Read §2 (Public API), §3 (Internal architecture), §5 (CSS delivery), §6 (Deviations catalog) before starting any port task.
- **Material source reference:** `src/material/icon/`. Every port task names the exact source file(s) it mirrors.
- **DOM parity — custom-element tag:** upstream renders `<mat-icon>` as a real custom element (selector on line 132 of `src/material/icon/icon.ts`). Our port preserves the tag name via a JSX augmentation in `intrinsic-elements.d.ts`. External CMS stylesheets may target `mat-icon` as an element selector (not just the `.mat-icon` class), so the tag is a CMS-parity gate.
- **DOM parity — class ladder:** upstream host bindings emit `mat-icon`, `notranslate`, `mat-<color>` (when color set), `mat-icon-inline` (when inline), and `mat-icon-no-color` (when color is NOT `'primary' | 'accent' | 'warn'`). The port's class ladder matches exactly, including the always-emit-`mat-icon-no-color` behavior when no color prop is supplied.
- **DOM parity — host attributes:** upstream host bindings emit `role="img"`, `aria-hidden="true"` (default), `data-mat-icon-type="font"|"svg"`, `data-mat-icon-name`, `data-mat-icon-namespace`, and `fontIcon` (font mode only). The port emits the same shape.
- **qwik-cdk peer:** `@angular-community/qwik-cdk` at `workspace:*` (already declared). Icon does not consume qwik-cdk at runtime.
- **File-naming rule:** Angular source basenames get a `mat-` prefix. E.g. `icon.ts` → `mat-icon.tsx`. Component files use `.tsx`.
- **API parity:** preserve Material class / prop names where possible; record every deviation in `src/qwik-material/icon/SYNC.md`.
- **No RxJS.**
- **No `HttpClient` / XHR access anywhere in the port.**
- **No `DomSanitizer`.** Consumer-provided `svgLiteral` strings are trusted verbatim via `dangerouslySetInnerHTML`.
- **No exported classes** in the consumer surface. `icon/public-api.ts` must not contain `export class`.
- **SSR safety:** every `document.`/`window.`/`navigator.`/`getComputedStyle(`/`requestAnimationFrame(` call must be inside `useVisibleTask$` OR guarded by `typeof <global> !== 'undefined'`. Do NOT use `isBrowser` from `@builder.io/qwik/build`. Icon has no runtime browser-global access; the guard rule still applies to any future edits.
- **Commit message scope:** the upstream repo's commit-msg hook does not know `qwik-material`; use scope `multiple` (which is in the allowed list) for every commit in this plan.
- **Pnpm version:** the repo pins `pnpm@11.7.0`. Don't change it.
- **Node version:** pinned via `.nvmrc`. Don't change it.
- **No Bazel changes.**
- **No upstream CI integration.**
- **Class-list cast pattern (established in Dialog + Button + Card + Toolbar + Badge ports):** use `.filter(Boolean) as string[]`. The type `(string | ReadonlyArray<string>)[]` fails typecheck against Qwik's `ClassList` type.
- **Spec files use smoke variant:** every prior port confirmed `createDOM(<component$/>)` hangs the Qwik optimizer worker under vitest. Icon `.spec.tsx` files use module-import assertions. Real DOM assertions live in Task 9's Playwright parity specs.

---

## Phase 1 — Scaffolding & build pipeline

### Task 1: Wire `icon` entry-point into the existing qwik-material package

**Reference source:** `src/qwik-material/package.json`, `src/qwik-material/vite.config.ts` (both exist from earlier ports).

**Files:**
- Modify: `src/qwik-material/package.json`
- Modify: `src/qwik-material/vite.config.ts`
- Create: `src/qwik-material/icon/intrinsic-elements.d.ts`
- Create: `src/qwik-material/icon/index.ts` (empty stub — Task 7 replaces)

**Interfaces:**
- Consumes: existing package scaffolding.
- Produces: `pnpm -C src/qwik-material build` still succeeds (dialog + button + card + toolbar + badge CSS still emit, no icon CSS yet). Type resolution for `@angular-community/qwik-material/icon` returns an empty module. `<mat-icon>` is a legal JSX element after the augmentation.

- [ ] **Step 1: Extend `src/qwik-material/package.json` `exports` block**

Read the current `exports`. Insert `./icon` after `./badge`, and `./icon-prebuilt.css` after `./badge-prebuilt.css`. Final relevant block:

```json
"./badge": {
  "qwik": "./badge/index.ts",
  "types": "./dist/badge/index.d.ts",
  "import": "./dist/badge/index.js"
},
"./icon": {
  "qwik": "./icon/index.ts",
  "types": "./dist/icon/index.d.ts",
  "import": "./dist/icon/index.js"
},
"./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
"./button-prebuilt.css": "./dist/button-prebuilt.css",
"./card-prebuilt.css": "./dist/card-prebuilt.css",
"./toolbar-prebuilt.css": "./dist/toolbar-prebuilt.css",
"./badge-prebuilt.css": "./dist/badge-prebuilt.css",
"./icon-prebuilt.css": "./dist/icon-prebuilt.css",
"./scss/*": "./scss/*"
```

- [ ] **Step 2: Extend `src/qwik-material/vite.config.ts` `entries` array + `sassEntries` list**

Read the file. `entries` currently reads `['dialog', 'button', 'card', 'toolbar', 'badge']`. Append `'icon'`:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar', 'badge', 'icon'];
```

`sassEntries` currently ends with `['scss/badge/badge-prebuilt.scss', 'dist/badge-prebuilt.css']`. Append the icon pair:

```ts
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
  ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
  ['scss/toolbar/toolbar-prebuilt.scss', 'dist/toolbar-prebuilt.css'],
  ['scss/badge/badge-prebuilt.scss', 'dist/badge-prebuilt.css'],
  ['scss/icon/icon-prebuilt.scss', 'dist/icon-prebuilt.css'],
];
```

- [ ] **Step 3: Create `src/qwik-material/icon/intrinsic-elements.d.ts`**

The `<mat-icon>` custom element is inline (used like `<span>` or `<img>`), so type it as an inline element's intrinsic props. Contents:

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Icon's custom-element tag name.
 * Upstream renders <mat-icon> as an actual custom element; external CMS styles
 * may target the tag directly (not just the .mat-icon class). See design spec
 * docs/superpowers/specs/2026-07-29-qwik-material-icon-port-design.md §3.1.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-icon': QwikIntrinsicElements['span'];
    }
  }
}
```

- [ ] **Step 4: Create `src/qwik-material/icon/index.ts`** (empty stub)

Contents:

```ts
export {};
```

Task 7 replaces this with `export * from './public-api';`.

- [ ] **Step 5: Run the build to confirm the stub compiles**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. The dts plugin generates `dist/icon/index.d.ts` with `export {};`. The Sass pipeline logs a `skipping scss/icon/icon-prebuilt.scss — not yet present.` warning (ENOENT-tolerant guard); this is EXPECTED — Task 2 creates the SCSS file. Confirm the existing 5 prebuilt CSS files still emit:

```bash
ls src/qwik-material/dist/*.css
```

Expected: `dialog-prebuilt.css`, `button-prebuilt.css`, `card-prebuilt.css`, `toolbar-prebuilt.css`, `badge-prebuilt.css`. NOT `icon-prebuilt.css` yet.

- [ ] **Step 6: Commit**

```bash
git add \
  src/qwik-material/package.json \
  src/qwik-material/vite.config.ts \
  src/qwik-material/icon/intrinsic-elements.d.ts \
  src/qwik-material/icon/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): wire qwik-material/icon entry-point + <mat-icon> JSX augmentation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — SCSS + prebuilt CSS

### Task 2: Copy Icon SCSS + iterative `:root` variable-name verification + prebuilt CSS

**Reference source:** `src/material/icon/*.scss` (4 files, 209 total LOC). Confirmed via `grep '@angular/cdk' src/material/icon/*.scss`: none of the 4 files reference `@angular/cdk`. NO `@use '../cdk-stub' as cdk` rewrite is needed for icon — this differs from Badge / Toolbar / Dialog which needed the rewrite. Log this fact in the SYNC.md sync-state row (Task 10).

**Files:**
- Create: `src/qwik-material/scss/icon/icon.scss` (byte-identical copy of `src/material/icon/icon.scss`)
- Create: `src/qwik-material/scss/icon/_icon-theme.scss` (byte-identical)
- Create: `src/qwik-material/scss/icon/_m2-icon.scss` (byte-identical)
- Create: `src/qwik-material/scss/icon/_m3-icon.scss` (byte-identical)
- Create: `src/qwik-material/scss/icon/icon-prebuilt.scss` (new — `:root` M3 defaults + `@use './icon'`)

**Interfaces:**
- Consumes: existing SCSS ecosystem — sass compiler picks up `scss/icon/icon-prebuilt.scss` from Task 1's vite.config.ts change.
- Produces: `dist/icon-prebuilt.css` after `pnpm -C src/qwik-material build`. Every `--mat-icon-*` and `--mat-sys-*` reference emitted by the compiled CSS has a matching `:root` declaration.

- [ ] **Step 1: Byte-identical copy of the 4 upstream SCSS files**

```bash
cp src/material/icon/icon.scss          src/qwik-material/scss/icon/icon.scss
cp src/material/icon/_icon-theme.scss   src/qwik-material/scss/icon/_icon-theme.scss
cp src/material/icon/_m2-icon.scss      src/qwik-material/scss/icon/_m2-icon.scss
cp src/material/icon/_m3-icon.scss      src/qwik-material/scss/icon/_m3-icon.scss
```

Verify byte-identical:

```bash
diff -q src/material/icon/icon.scss        src/qwik-material/scss/icon/icon.scss
diff -q src/material/icon/_icon-theme.scss src/qwik-material/scss/icon/_icon-theme.scss
diff -q src/material/icon/_m2-icon.scss    src/qwik-material/scss/icon/_m2-icon.scss
diff -q src/material/icon/_m3-icon.scss    src/qwik-material/scss/icon/_m3-icon.scss
```

Expected: no diff output (empty on stdout).

- [ ] **Step 2: Sanity-check the SCSS chain has zero `@angular/cdk` references**

```bash
grep -RnE "^@use '@angular/cdk'" src/qwik-material/scss/icon/
```

Expected: no output. This confirms no `cdk-stub` rewrite is needed. This is different from badge / toolbar / dialog SCSS (which DID reference `@angular/cdk`). Note this outcome verbatim in the SYNC.md sync-state row in Task 10.

- [ ] **Step 3: Create the initial `src/qwik-material/scss/icon/icon-prebuilt.scss`**

Start with a candidate `:root` block for the tokens `_m3-icon.scss` + `_icon-theme.scss` reference. Contents (candidate — Step 5 verifies + expands as needed):

```scss
// Icon prebuilt CSS. Wraps the port's icon.scss with :root defaults for every
// --mat-icon-* and --mat-sys-* variable it emits. See design spec §5.

:root {
  // M3 sys-color token (used by icon.scss via slot(icon-color)).
  --mat-sys-on-surface: #1d1b20;

  // Icon-specific token (emitted by _m3-icon.scss's icon-color token).
  --mat-icon-icon-color: var(--mat-sys-on-surface, inherit);
}

@use './icon';
```

- [ ] **Step 4: Run the build to emit `dist/icon-prebuilt.css`**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. `dist/icon-prebuilt.css` present:

```bash
ls src/qwik-material/dist/icon-prebuilt.css
```

Expected: file listed.

- [ ] **Step 5: Grep the emitted CSS for every `--mat-icon-*` and `--mat-sys-*` reference; reconcile against the `:root` block**

```bash
grep -oE 'var\(--mat-[a-z-]+' src/qwik-material/dist/icon-prebuilt.css | sort -u
```

Expected output (this is the whole variable set the icon chain uses; verify against the actual list from the command):

```
var(--mat-icon-icon-color
var(--mat-sys-on-surface
```

For every `var(--mat-*)` reference NOT covered by a `:root` line in `icon-prebuilt.scss`, add a `:root` declaration with a sensible M3 default:
- Look up the token in `src/material/core/tokens/m3/_md-sys-color.scss` (for `--mat-sys-color-*`), `src/material/core/tokens/m3/_md-sys-typescale.scss` (for `--mat-sys-typescale-*`), etc.
- Follow the value-wrap convention used by badge-prebuilt.scss: `var(--mat-sys-<upstream-name>, <fallback>)`. For icon-specific tokens with no upstream `--mat-sys-*` equivalent, hard-code the M3 default value.

Rebuild after every edit until the grep-vs-`:root` diff is empty. Cross-check by grepping the `:root` block for declared variables:

```bash
grep -oE '^\s*--mat-[a-z-]+' src/qwik-material/scss/icon/icon-prebuilt.scss | sort -u
```

Every variable emitted by the compiled CSS must appear here. Every variable declared here must appear in the compiled CSS. Zero phantom variables. Zero missing variables.

- [ ] **Step 6: Confirm the `.mat-icon` structural rules survived the copy**

```bash
grep -cE "^\.mat-icon" src/qwik-material/dist/icon-prebuilt.css
```

Expected: at least `1` (there's a `.mat-icon { ... }` block plus specific selectors like `.mat-icon.mat-icon-inline`, `.mat-icon.mat-ligature-font[fontIcon]::before`, `[dir='rtl'] .mat-icon-rtl-mirror`, etc.). Higher is fine; this is a smoke check that the compiled CSS is non-empty and contains the expected selectors.

- [ ] **Step 7: Commit**

```bash
git add \
  src/qwik-material/scss/icon/icon.scss \
  src/qwik-material/scss/icon/_icon-theme.scss \
  src/qwik-material/scss/icon/_m2-icon.scss \
  src/qwik-material/scss/icon/_m3-icon.scss \
  src/qwik-material/scss/icon/icon-prebuilt.scss
git commit -m "$(cat <<'EOF'
feat(multiple): copy Icon SCSS chain + icon-prebuilt.css defaults

4 upstream .scss files copied byte-identical (icon.scss + _icon-theme,
_m2-icon, _m3-icon). No @use '@angular/cdk' rewrite needed — icon.scss
does not reference the cdk namespace (unlike badge/toolbar/dialog).

icon-prebuilt.scss adds :root defaults for every --mat-icon-* and
--mat-sys-* variable the compiled CSS references. Verified by grepping
dist/icon-prebuilt.css and reconciling against the :root block until the
diff is empty.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3 — Types

### Task 3: `MatIconColor` type file

**Reference source:** `src/material/icon/icon.ts:24` (ThemePalette import) + line 137's `mat-<color>` class binding.

**Files:**
- Create: `src/qwik-material/icon/icon-color.ts`
- Create: `src/qwik-material/icon/icon-color.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MatIconColor` type — narrowed 3-value union.

- [ ] **Step 1: Create `src/qwik-material/icon/icon-color.ts`**

Contents:

```ts
/**
 * MatIcon color variants applied via the `.mat-<color>` class. Narrowed from
 * upstream's ThemePalette (which is a superset) to the three values Angular
 * Material actually uses for icons.
 */
export type MatIconColor = 'primary' | 'accent' | 'warn';
```

- [ ] **Step 2: Create `src/qwik-material/icon/icon-color.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import type {MatIconColor} from './icon-color';

describe('MatIconColor', () => {
  it('accepts the three documented values', () => {
    const a: MatIconColor = 'primary';
    const b: MatIconColor = 'accent';
    const c: MatIconColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test icon/icon-color
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/icon/icon-color.ts src/qwik-material/icon/icon-color.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatIconColor type (primary | accent | warn)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4 — Config token

### Task 4: `MatIconConfig` + `MAT_ICON_CONFIG` context token

**Reference source:** `src/material/icon/icon.ts:31-47` (MatIconDefaultOptions + MAT_ICON_DEFAULT_OPTIONS).

**Files:**
- Create: `src/qwik-material/icon/icon-config.ts`
- Create: `src/qwik-material/icon/icon-config.spec.ts`

**Interfaces:**
- Consumes: `MatIconColor` from Task 3.
- Produces:
  - `interface MatIconConfig { color?: MatIconColor; fontSet?: string; }`
  - `const MAT_ICON_CONFIG: ContextId<MatIconConfig>` with id `'qwik-material/icon-config'`

- [ ] **Step 1: Create `src/qwik-material/icon/icon-config.ts`**

Contents:

```ts
import {createContextId} from '@builder.io/qwik';
import type {MatIconColor} from './icon-color';

/**
 * Defaults applied to every <MatIcon> in a subtree. Consumers provide this via
 * <QwikMaterialProvider matIconConfig={...}>. Mirrors upstream
 * MatIconDefaultOptions (src/material/icon/icon.ts:31-42).
 */
export interface MatIconConfig {
  /** Default M2 palette color. Adds the `.mat-<color>` class if set. */
  color?: MatIconColor;
  /** Default font-set class(es) applied to the host in font mode. */
  fontSet?: string;
}

/**
 * Context id used by <MatIcon> to read config. The id string is exposed
 * publicly and MUST remain stable across releases — consumers may inject it
 * directly in advanced scenarios.
 */
export const MAT_ICON_CONFIG = createContextId<MatIconConfig>(
  'qwik-material/icon-config',
);
```

- [ ] **Step 2: Create `src/qwik-material/icon/icon-config.spec.ts`**

Contents:

```ts
import {describe, it, expect} from 'vitest';
import {MAT_ICON_CONFIG, type MatIconConfig} from './icon-config';

describe('MAT_ICON_CONFIG', () => {
  it('has the expected context id string', () => {
    expect(MAT_ICON_CONFIG.id).toBe('qwik-material/icon-config');
  });

  it('MatIconConfig accepts an empty object', () => {
    const cfg: MatIconConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatIconConfig accepts every documented field', () => {
    const cfg: MatIconConfig = {
      color: 'accent',
      fontSet: 'material-symbols-outlined',
    };
    expect(cfg.color).toBe('accent');
    expect(cfg.fontSet).toBe('material-symbols-outlined');
  });
});
```

- [ ] **Step 3: Run the spec**

```bash
pnpm -C src/qwik-material test icon/icon-config
```

Expected: 3/3 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/icon/icon-config.ts src/qwik-material/icon/icon-config.spec.ts
git commit -m "$(cat <<'EOF'
feat(multiple): add MatIconConfig + MAT_ICON_CONFIG context token

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5 — Component

### Task 5: `<MatIcon>` component

**Reference source:** `src/material/icon/icon.ts:130-472` (component decorator + host bindings + prop setters + font-set logic).

**Files:**
- Create: `src/qwik-material/icon/mat-icon.tsx`
- Create: `src/qwik-material/icon/mat-icon.spec.tsx`

**Interfaces:**
- Consumes: `MatIconColor` (Task 3), `MAT_ICON_CONFIG` + `MatIconConfig` (Task 4).
- Produces:
  - `interface MatIconProps` — 11 optional fields per spec §2.3
  - `const MatIcon: Component<MatIconProps>`

- [ ] **Step 1: Create `src/qwik-material/icon/mat-icon.tsx`**

Contents (mirrors the shape of `src/qwik-material/badge/mat-badge.tsx` — stateless component$, prop resolution chain, class ladder via `.filter(Boolean) as string[]`):

```tsx
import {component$, Slot, useContext} from '@builder.io/qwik';
import type {MatIconColor} from './icon-color';
import {MAT_ICON_CONFIG, type MatIconConfig} from './icon-config';

/**
 * Props for <MatIcon>. Renders a <mat-icon> custom element in one of two
 * mutually-exclusive modes:
 *
 *   Font mode (default): <mat-icon> hosts Slot content for ligature text, or
 *   emits the `fontIcon` attribute for [fontIcon]::before glyph rendering.
 *   Class ladder includes any resolved `fontSet` class.
 *
 *   SVG mode (when svgLiteral is set): <mat-icon> is populated via
 *   dangerouslySetInnerHTML with the consumer-provided SVG string. No Slot
 *   content, no fontIcon attribute, no fontSet class. Consumer is
 *   responsible for the SVG string's trustworthiness (§6 deviation #4).
 *
 * See design spec §3 for the full rendered DOM shape.
 */
export interface MatIconProps {
  /** M2 palette color. Adds `.mat-<color>` class. */
  color?: MatIconColor;
  /** Inline sizing — applies `.mat-icon-inline`. */
  inline?: boolean;
  /** Font-icon glyph name. Emitted as `fontIcon` attribute for CSS ::before. */
  fontIcon?: string;
  /** Font-set class(es). Prop → config → undefined resolution. */
  fontSet?: string;
  /** Raw SVG string set via dangerouslySetInnerHTML. */
  svgLiteral?: string;
  /** Optional label for `data-mat-icon-name` in SVG mode. */
  svgName?: string;
  /** Optional label for `data-mat-icon-namespace` in SVG mode. */
  svgNamespace?: string;
  /** Overrides the default aria-hidden='true'. Pass `false` for labeled decorative-icon-as-control usage. */
  'aria-hidden'?: boolean | 'true' | 'false';
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatIconConfig = {};

function cleanupFontValue(value: string | undefined): string | undefined {
  return typeof value === 'string' ? value.trim().split(' ')[0] : value;
}

export const MatIcon = component$<MatIconProps>(props => {
  const config = useContext(MAT_ICON_CONFIG, DEFAULTS);

  const color = props.color ?? config.color;
  const inline = props.inline ?? false;
  const fontSet = cleanupFontValue(props.fontSet ?? config.fontSet);
  const fontIcon = cleanupFontValue(props.fontIcon);

  const usingSvg = !!props.svgLiteral;
  const dataName = usingSvg ? props.svgName : fontIcon;
  const dataNamespace = usingSvg ? props.svgNamespace : fontSet;
  const isPaletteColor = color === 'primary' || color === 'accent' || color === 'warn';

  const classes = [
    'mat-icon',
    'notranslate',
    color && `mat-${color}`,
    inline && 'mat-icon-inline',
    !isPaletteColor && 'mat-icon-no-color',
    !usingSvg && fontSet,
    props.class,
  ].filter(Boolean) as string[];

  const ariaHidden = props['aria-hidden'] ?? 'true';

  if (usingSvg) {
    return (
      <mat-icon
        id={props.id}
        class={classes}
        role="img"
        aria-hidden={ariaHidden as never}
        data-mat-icon-type="svg"
        data-mat-icon-name={dataName}
        data-mat-icon-namespace={dataNamespace}
        dangerouslySetInnerHTML={props.svgLiteral}
      />
    );
  }

  return (
    <mat-icon
      id={props.id}
      class={classes}
      role="img"
      aria-hidden={ariaHidden as never}
      data-mat-icon-type="font"
      data-mat-icon-name={dataName}
      data-mat-icon-namespace={dataNamespace}
      fontIcon={fontIcon}
    >
      <Slot />
    </mat-icon>
  );
});
```

Notes for the implementer:
- The `as never` cast on `aria-hidden` is a workaround for Qwik's `boolean | 'true' | 'false'` typing being narrower than the intrinsic element's expected `boolean | undefined`. If Qwik accepts the compound type without the cast in this codebase's TS setup, drop the cast.
- `dangerouslySetInnerHTML` accepts a `string` in Qwik. The `usingSvg` branch has no children — mixing children with `dangerouslySetInnerHTML` overwrites the children.
- The SVG branch intentionally OMITS `fontSet` from the class ladder (`!usingSvg && fontSet`) and OMITS the `fontIcon` HTML attribute.
- `intrinsic-elements.d.ts` (Task 1) already makes `<mat-icon>` a legal JSX element; no additional typing needed here.

- [ ] **Step 2: Create `src/qwik-material/icon/mat-icon.spec.tsx`** (smoke)

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {MatIcon} from './mat-icon';

describe('MatIcon (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatIcon).toBeDefined();
    expect(typeof MatIcon).toBe('function');
  });
});
```

- [ ] **Step 3: Run the smoke spec**

```bash
pnpm -C src/qwik-material test icon/mat-icon
```

Expected: 1/1 passing, exit 0.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0. The `intrinsic-elements.d.ts` from Task 1 makes `<mat-icon>` a legal JSX element.

- [ ] **Step 5: Verify no SSR-global access**

```bash
grep -nE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/icon/mat-icon.tsx
```

Expected: no matches. And:

```bash
grep -nE "from '@builder\.io/qwik/build'" src/qwik-material/icon/mat-icon.tsx
```

Expected: no matches (`isBrowser` import is banned per Global Constraints).

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/icon/mat-icon.tsx src/qwik-material/icon/mat-icon.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): add MatIcon component (font-ligature + fontIcon + fontSet + svgLiteral)

Two mutually-exclusive JSX branches: font mode nests Slot content or emits
the fontIcon attribute; SVG mode uses dangerouslySetInnerHTML. Zero
lifecycle work, zero browser globals, zero id counter.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6 — Provider extension

### Task 6: Extend `<QwikMaterialProvider>` with `matIconConfig`

**Reference source:** `src/qwik-material/dialog/qwik-material-provider.tsx` (currently ships 6 `useContextProvider` calls after Badge). Adding icon makes it 7.

**Files:**
- Modify: `src/qwik-material/dialog/qwik-material-provider.tsx`
- Create: `src/qwik-material/dialog/qwik-material-provider-icon.spec.tsx`

**Interfaces:**
- Consumes: `MatIconConfig` + `MAT_ICON_CONFIG` from Task 4.
- Produces: an extended `QwikMaterialProviderProps.matIconConfig?: MatIconConfig` field + a 7th `useContextProvider(MAT_ICON_CONFIG, ...)` call. All 6 pre-existing provider calls unchanged.

- [ ] **Step 1: Extend the imports at the top of `qwik-material-provider.tsx`**

Add two import lines after the badge import block. The final import block becomes:

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
```

- [ ] **Step 2: Extend `QwikMaterialProviderProps` with the `matIconConfig?` field**

Append to the interface body (after `matBadgeConfig`), so the final interface is:

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
}
```

- [ ] **Step 3: Add the 7th `useContextProvider` call at the end of the component body**

Append AFTER the `useContextProvider(MAT_BADGE_CONFIG, props.matBadgeConfig ?? {});` line and BEFORE the `return <Slot />;`:

```tsx
  // MatIconConfig is a plain object with primitive fields — no noSerialize needed.
  // Icons outside a provider get the DEFAULTS declared in MatIcon; providing
  // an empty object is equivalent to accepting all defaults.
  useContextProvider(MAT_ICON_CONFIG, props.matIconConfig ?? {});
```

Verify all 6 pre-existing `useContextProvider` calls are untouched (MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_ANIMATIONS_DISABLED, MAT_BUTTON_CONFIG, MAT_CARD_CONFIG, MAT_BADGE_CONFIG). Do NOT change their order or arguments.

- [ ] **Step 4: Create the provider-icon smoke spec `qwik-material-provider-icon.spec.tsx`**

Contents:

```tsx
import {describe, it, expect} from 'vitest';
import {QwikMaterialProvider, type QwikMaterialProviderProps} from './qwik-material-provider';
import type {MatIconConfig} from '../icon/icon-config';

describe('QwikMaterialProvider — matIconConfig prop', () => {
  it('QwikMaterialProvider is exported', () => {
    expect(QwikMaterialProvider).toBeDefined();
    expect(typeof QwikMaterialProvider).toBe('function');
  });

  it('QwikMaterialProviderProps accepts a matIconConfig field', () => {
    const cfg: MatIconConfig = {color: 'accent', fontSet: 'material-symbols-outlined'};
    const props: QwikMaterialProviderProps = {matIconConfig: cfg};
    expect(props.matIconConfig?.color).toBe('accent');
    expect(props.matIconConfig?.fontSet).toBe('material-symbols-outlined');
  });

  it('QwikMaterialProviderProps.matIconConfig is optional', () => {
    const props: QwikMaterialProviderProps = {};
    expect(props.matIconConfig).toBeUndefined();
  });
});
```

- [ ] **Step 5: Run the provider spec**

```bash
pnpm -C src/qwik-material test qwik-material-provider-icon
```

Expected: 3/3 passing, exit 0.

- [ ] **Step 6: Run the full qwik-material vitest to confirm no regression**

```bash
pnpm -C src/qwik-material test
```

Expected: all files pass; total count = pre-Task-6 total + 3 passing from this task (no skips added).

- [ ] **Step 7: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add \
  src/qwik-material/dialog/qwik-material-provider.tsx \
  src/qwik-material/dialog/qwik-material-provider-icon.spec.tsx
git commit -m "$(cat <<'EOF'
feat(multiple): extend QwikMaterialProvider with matIconConfig

Adds the 7th useContextProvider call (after MAT_BADGE_CONFIG). All 6
pre-existing provider calls preserved unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 7 — Public API

### Task 7: `icon/public-api.ts` + `icon/index.ts` + build verification

**Reference source:** design spec §2.5.

**Files:**
- Create: `src/qwik-material/icon/public-api.ts`
- Modify: `src/qwik-material/icon/index.ts` (was empty stub from Task 1)

**Interfaces:**
- Consumes: everything from Tasks 3, 4, 5.
- Produces: the exact public export surface consumers see when they import from `@angular-community/qwik-material/icon`.

- [ ] **Step 1: Create `src/qwik-material/icon/public-api.ts`**

Contents (matches design spec §2.5 verbatim):

```ts
// Public API for @angular-community/qwik-material/icon.
// See docs/superpowers/specs/2026-07-29-qwik-material-icon-port-design.md §2.

export type {MatIconColor} from './icon-color';
export type {MatIconConfig} from './icon-config';
export {MAT_ICON_CONFIG} from './icon-config';
export {MatIcon, type MatIconProps} from './mat-icon';
```

- [ ] **Step 2: Replace the empty stub in `src/qwik-material/icon/index.ts`**

Replace the entire file (was `export {};` from Task 1) with:

```ts
export * from './public-api';
```

- [ ] **Step 3: Run the build**

```bash
pnpm -C src/qwik-material build
```

Expected: exit 0. No Rollup `Illegal reassignment of import` errors (icon has no `_idSeq` counter, unlike Dialog/Badge/Card — so this class of bug is not possible here, but the gate stays).

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Verify the emitted d.ts export surface**

```bash
grep -nE "^export " src/qwik-material/dist/icon/public-api.d.ts
```

Expected: 4 export lines:

```
export type {MatIconColor}
export type {MatIconConfig}
export {MAT_ICON_CONFIG}
export {MatIcon, type MatIconProps}
```

(Line numbers and exact TypeScript re-export shape may differ after tsc processing; the key check is that the 4 named symbols above appear.)

Confirm no leaked classes:

```bash
grep -nE "^export declare class" src/qwik-material/dist/icon/public-api.d.ts
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/icon/public-api.ts src/qwik-material/icon/index.ts
git commit -m "$(cat <<'EOF'
feat(multiple): finalize qwik-material/icon public API

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 8 — Vitest scenario port

### Task 8: Vitest scenario port from `src/material/icon/icon.spec.ts`

**Reference source:** `src/material/icon/icon.spec.ts` (1501 LOC). Most tests exercise the registry (XHR mocks, addSvgIcon*, icon-sets, sanitizer) which the port omits. Restructured for smoke-only vitest per §7.1.

**Files:**
- Create: `src/qwik-material/icon/mat-icon-scenarios.spec.tsx`

**Interfaces:**
- Consumes: every public export from Task 7.
- Produces: consolidated scenario coverage documenting upstream test intent.

- [ ] **Step 1: Write the scenario spec**

Contents:

```tsx
/**
 * MatIcon scenario port from src/material/icon/icon.spec.ts.
 *
 * Upstream has ~50 `it()` blocks — the majority exercise the MatIconRegistry
 * (XHR, addSvgIcon*, getNamedSvgIcon, icon-sets, DomSanitizer) which this
 * port omits entirely. Restructured:
 *
 *   - Live sanity tests (7): typeof + type unions + MAT_ICON_CONFIG.id +
 *     provider extension smoke.
 *   - describe.skip DOM-rendered (14): host classes/attrs + font/svg mode +
 *     aria-hidden default + inline + color propagation. Deferred to
 *     Playwright Task 9.
 *   - describe.skip Angular-only (20): registry, XHR, sanitizer, RxJS,
 *     ErrorHandler, MAT_ICON_LOCATION, ngAfterViewChecked. Deferred forever
 *     per design spec §6 deviations.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-icon/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_ICON_CONFIG,
  MatIcon,
  type MatIconColor,
  type MatIconConfig,
  type MatIconProps,
} from './public-api';

describe('MatIcon — sanity', () => {
  it('MatIcon is exported', () => {
    expect(MatIcon).toBeDefined();
    expect(typeof MatIcon).toBe('function');
  });

  it('MAT_ICON_CONFIG carries the expected context id', () => {
    expect(MAT_ICON_CONFIG.id).toBe('qwik-material/icon-config');
  });

  it('MatIconColor accepts the documented values', () => {
    const a: MatIconColor = 'primary';
    const b: MatIconColor = 'accent';
    const c: MatIconColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });

  it('MatIconConfig accepts an empty config', () => {
    const cfg: MatIconConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatIconConfig accepts every documented field', () => {
    const cfg: MatIconConfig = {
      color: 'accent',
      fontSet: 'material-symbols-outlined',
    };
    expect(cfg.color).toBe('accent');
  });

  it('MatIconProps accepts font-mode props', () => {
    const p: MatIconProps = {
      fontIcon: 'home',
      fontSet: 'fa',
      inline: true,
      color: 'primary',
    };
    expect(p.fontIcon).toBe('home');
  });

  it('MatIconProps accepts svg-mode props', () => {
    const p: MatIconProps = {
      svgLiteral: '<svg />',
      svgName: 'home',
      svgNamespace: 'social',
      'aria-hidden': false,
    };
    expect(p.svgLiteral).toBe('<svg />');
    expect(p['aria-hidden']).toBe(false);
  });
});

describe.skip('MatIcon DOM-rendered scenarios — deferred to Playwright Task 9', () => {
  it('should render a font ligature via slot content', () => {});
  it('should emit fontIcon attribute when fontIcon prop is set', () => {});
  it('should apply fontSet class in font mode only', () => {});
  it('should render inline SVG via svgLiteral (dangerouslySetInnerHTML)', () => {});
  it('should emit data-mat-icon-name and data-mat-icon-namespace in svg mode', () => {});
  it('should apply .mat-<color> class when color prop is set', () => {});
  it('should apply .mat-icon-no-color class when color prop is unset', () => {});
  it('should apply .mat-icon-inline class when inline prop is true', () => {});
  it('should default aria-hidden to "true" when consumer does not set it', () => {});
  it('should let consumer override aria-hidden by passing aria-hidden={false}', () => {});
  it('should always emit role="img"', () => {});
  it('should always emit data-mat-icon-type based on mode', () => {});
  it("should apply _cleanupFontValue trim+first-token to fontIcon/fontSet", () => {});
  it('should resolve color/fontSet from MAT_ICON_CONFIG when props are absent', () => {});
});

describe.skip('MatIcon — Angular-only tests', () => {
  it('should register an SVG icon via addSvgIcon()', () => {
    // MatIconRegistry omitted — §6 deviation #2.
  });
  it('should register an SVG icon in a namespace', () => {
    // MatIconRegistry omitted.
  });
  it('should register an SVG icon literal', () => {
    // MatIconRegistry omitted.
  });
  it('should register an icon set', () => {
    // Icon-sets omitted — §6 deviation #2.
  });
  it('should register an icon resolver', () => {
    // addSvgIconResolver omitted.
  });
  it('should fetch a named SVG icon via HttpClient', () => {
    // XHR omitted — §6 deviation #2.
  });
  it('should error if HttpClient is missing', () => {
    // No HttpClient dependency.
  });
  it('should sanitize URLs through DomSanitizer', () => {
    // DomSanitizer omitted — §6 deviation #4.
  });
  it('should sanitize literals through DomSanitizer', () => {
    // DomSanitizer omitted.
  });
  it('should cache in-flight SVG requests', () => {
    // No async fetching.
  });
  it('should handle SVG fetch errors via ErrorHandler', () => {
    // ErrorHandler injection omitted — §6 deviation #6.
  });
  it('should update FuncIRI references on path change', () => {
    // MAT_ICON_LOCATION + ngAfterViewChecked omitted — §6 deviation #5.
  });
  it('should register a font-set class alias', () => {
    // registerFontClassAlias omitted — §6 deviation #7.
  });
  it('should set the default font-set class via setDefaultFontSetClass', () => {
    // setDefaultFontSetClass omitted — §6 deviation #7.
  });
  it('should look up a font-set alias via classNameForFontAlias', () => {
    // classNameForFontAlias omitted — §6 deviation #7.
  });
  it('should unsubscribe from in-flight fetches on destroy', () => {
    // RxJS Subscription omitted — §6 deviation #8.
  });
  it('should throw on invalid svgIcon "a:b:c" name', () => {
    // svgIcon prop dropped — §6 deviation #3.
  });
  it('should reset previous font-set class on fontSet change', () => {
    // Upstream mutates classList on setter — port applies at render time.
  });
  it('should set aria-hidden via constructor setAttribute', () => {
    // Port applies via prop merge — §6 deviation #12.
  });
  it('should apply MAT_ICON_DEFAULT_OPTIONS via DI', () => {
    // Provider flow verified in Task 6 + Task 9 dev-app.
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
pnpm -C src/qwik-material test icon/mat-icon-scenarios
```

Expected: 7 passing + 34 skipped (7 sanity + 14 DOM-rendered skips + 20 Angular-only skips), 1 file passed, exit 0.

- [ ] **Step 3: Run the full qwik-material suite for regression check**

```bash
pnpm -C src/qwik-material test
```

Expected: total = pre-Task-8 total + 7 passing + 34 skipped from this task, zero failures.

- [ ] **Step 4: Typecheck**

```bash
pnpm -C src/qwik-material typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/qwik-material/icon/mat-icon-scenarios.spec.tsx
git commit -m "$(cat <<'EOF'
test(multiple): port MatIcon scenarios from upstream icon.spec.ts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 9 — Dev-app + Playwright parity

### Task 9: 8 mat-icon dev-app routes + index tile + root.tsx CSS import + 8 Playwright parity specs

**Reference source:** existing dev-app + Playwright patterns from Badge port at `src/qwik-cdk-dev-app/src/routes/mat-badge/` and `src/qwik-cdk-parity-tests/specs/material-badge/`.

**Files:**
- Modify: `src/qwik-cdk-dev-app/src/root.tsx` (add icon-prebuilt.css import)
- Modify: `src/qwik-cdk-dev-app/src/routes/index.tsx` (add "Icons" section with 8 route links)
- Create: `src/qwik-cdk-dev-app/src/routes/mat-icon/basic/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-icon/font-icon/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-icon/font-set/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-icon/svg-literal/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-icon/svg-named/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-icon/colors/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-icon/inline/index.tsx`
- Create: `src/qwik-cdk-dev-app/src/routes/mat-icon/aria-labeled/index.tsx`
- Create: `src/qwik-cdk-parity-tests/specs/material-icon/basic.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-icon/font-icon.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-icon/font-set.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-icon/svg-literal.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-icon/svg-named.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-icon/colors.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-icon/inline.spec.ts`
- Create: `src/qwik-cdk-parity-tests/specs/material-icon/aria-labeled.spec.ts`

**Interfaces:**
- Consumes: `@angular-community/qwik-material/icon` (Task 7).
- Produces: 8 mount-only dev-app routes + 8 Playwright specs asserting host tag + classes + attributes + rendered content.

- [ ] **Step 1: Add the icon-prebuilt.css import to `src/qwik-cdk-dev-app/src/root.tsx`**

Read the current file. Append the icon CSS import after the badge one:

```tsx
import '@angular-community/qwik-cdk/overlay-prebuilt.css';
import '@angular-community/qwik-material/dialog-prebuilt.css';
import '@angular-community/qwik-material/button-prebuilt.css';
import '@angular-community/qwik-material/card-prebuilt.css';
import '@angular-community/qwik-material/toolbar-prebuilt.css';
import '@angular-community/qwik-material/badge-prebuilt.css';
import '@angular-community/qwik-material/icon-prebuilt.css';
```

- [ ] **Step 2: Add an "Icons" section to `src/qwik-cdk-dev-app/src/routes/index.tsx`**

Insert after the existing "Badges" section:

```tsx
<section>
  <h2>Icons</h2>
  <ul>
    <li><a href="/mat-icon/basic/">basic</a></li>
    <li><a href="/mat-icon/font-icon/">font-icon</a></li>
    <li><a href="/mat-icon/font-set/">font-set</a></li>
    <li><a href="/mat-icon/svg-literal/">svg-literal</a></li>
    <li><a href="/mat-icon/svg-named/">svg-named</a></li>
    <li><a href="/mat-icon/colors/">colors</a></li>
    <li><a href="/mat-icon/inline/">inline</a></li>
    <li><a href="/mat-icon/aria-labeled/">aria-labeled</a></li>
  </ul>
</section>
```

- [ ] **Step 3: Create `basic/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <MatIcon>home</MatIcon>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 4: Create `font-icon/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <MatIcon fontIcon="home" />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 5: Create `font-set/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <MatIcon fontSet="material-symbols-outlined" fontIcon="home" />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 6: Create `svg-literal/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

const HOME_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3z"/></svg>`;

export default component$(() => (
  <>
    <MatIcon svgLiteral={HOME_SVG} />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 7: Create `svg-named/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

const CAKE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6a2 2 0 100-4 2 2 0 000 4z"/></svg>`;

export default component$(() => (
  <>
    <MatIcon svgLiteral={CAKE_SVG} svgName="cake" svgNamespace="social" />
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 8: Create `colors/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <MatIcon color="primary">home</MatIcon>
    <MatIcon color="accent">home</MatIcon>
    <MatIcon color="warn">home</MatIcon>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 9: Create `inline/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <MatIcon inline>home</MatIcon>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 10: Create `aria-labeled/index.tsx`**

```tsx
import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <MatIcon aria-hidden={false} aria-label="Home">home</MatIcon>
    <main data-scenario-ready>ready</main>
  </>
));
```

- [ ] **Step 11: Build the dev-app**

```bash
pnpm -C src/qwik-cdk-dev-app build
```

Confirm client + SSR builds succeed. Verify 8 mat-icon routes in the manifest:

```bash
grep -oE 'mat-icon/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u | wc -l
```

Expected: `8`.

List them explicitly:

```bash
grep -oE 'mat-icon/[a-z-]+' src/qwik-cdk-dev-app/dist/q-manifest.json | sort -u
```

Expected:
```
mat-icon/aria-labeled
mat-icon/basic
mat-icon/colors
mat-icon/font-icon
mat-icon/font-set
mat-icon/inline
mat-icon/svg-literal
mat-icon/svg-named
```

- [ ] **Step 12: Create `basic.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/basic — mat-icon custom-element with .mat-icon .notranslate .mat-icon-no-color classes, role=img, aria-hidden=true, data-mat-icon-type=font, Slot ligature text', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveClass(/mat-icon(\s|$)/);
  await expect(icon).toHaveClass(/notranslate/);
  await expect(icon).toHaveClass(/mat-icon-no-color/);
  await expect(icon).toHaveAttribute('role', 'img');
  await expect(icon).toHaveAttribute('aria-hidden', 'true');
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'font');
  await expect(icon).toContainText('home');
});
```

- [ ] **Step 13: Create `font-icon.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/font-icon — mat-icon with data-mat-icon-name=home + fontIcon attribute (no ligature slot text)', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/font-icon/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'font');
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'home');
  await expect(icon).toHaveAttribute('fontIcon', 'home');
});
```

- [ ] **Step 14: Create `font-set.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/font-set — mat-icon carries the material-symbols-outlined class + fontIcon attribute + data-mat-icon-namespace', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/font-set/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveClass(/material-symbols-outlined/);
  await expect(icon).toHaveAttribute('fontIcon', 'home');
  await expect(icon).toHaveAttribute('data-mat-icon-namespace', 'material-symbols-outlined');
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'font');
});
```

- [ ] **Step 15: Create `svg-literal.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/svg-literal — mat-icon in svg mode has data-mat-icon-type=svg, an inner <svg>, no fontIcon attribute, no data-mat-icon-name', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/svg-literal/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'svg');
  await expect(icon).not.toHaveAttribute('fontIcon', /./);
  await expect(icon).not.toHaveAttribute('data-mat-icon-name', /./);

  const inner = icon.locator('svg');
  await expect(inner).toBeAttached();
  await expect(inner).toHaveAttribute('viewBox', '0 0 24 24');
});
```

- [ ] **Step 16: Create `svg-named.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/svg-named — svg mode with data-mat-icon-name=cake + data-mat-icon-namespace=social + inner <svg>', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/svg-named/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'svg');
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'cake');
  await expect(icon).toHaveAttribute('data-mat-icon-namespace', 'social');
  await expect(icon.locator('svg')).toBeAttached();
});
```

- [ ] **Step 17: Create `colors.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/colors — 3 mat-icon nodes with distinct .mat-{primary,accent,warn} classes and no .mat-icon-no-color', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/colors/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icons = page.locator('mat-icon');
  await expect(icons).toHaveCount(3);

  await expect(icons.nth(0)).toHaveClass(/mat-primary/);
  await expect(icons.nth(0)).not.toHaveClass(/mat-icon-no-color/);

  await expect(icons.nth(1)).toHaveClass(/mat-accent/);
  await expect(icons.nth(1)).not.toHaveClass(/mat-icon-no-color/);

  await expect(icons.nth(2)).toHaveClass(/mat-warn/);
  await expect(icons.nth(2)).not.toHaveClass(/mat-icon-no-color/);
});
```

- [ ] **Step 18: Create `inline.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/inline — mat-icon with .mat-icon-inline class alongside the base .mat-icon class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/inline/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveClass(/mat-icon(\s|$)/);
  await expect(icon).toHaveClass(/mat-icon-inline/);
});
```

- [ ] **Step 19: Create `aria-labeled.spec.ts`**

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/aria-labeled — consumer-overridden aria-hidden=false + aria-label present + role=img', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('role', 'img');
  await expect(icon).toHaveAttribute('aria-hidden', 'false');
  await expect(icon).toHaveAttribute('aria-label', 'Home');
});
```

- [ ] **Step 20: Do NOT run Playwright**

Chromium install + preview server are human-managed steps. Skip execution — Task 10 documents the manual verification step.

- [ ] **Step 21: Commit**

```bash
git add \
  src/qwik-cdk-dev-app/src/root.tsx \
  src/qwik-cdk-dev-app/src/routes/index.tsx \
  src/qwik-cdk-dev-app/src/routes/mat-icon/ \
  src/qwik-cdk-parity-tests/specs/material-icon/
git commit -m "$(cat <<'EOF'
feat(multiple): mat-icon dev-app routes (8) + Playwright parity specs (8)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 10 — Finalisation

### Task 10: SYNC.md + pipeline verification

**Reference source:** `src/qwik-material/badge/SYNC.md` (existing SYNC pattern from Badge port).

**Files:**
- Create: `src/qwik-material/icon/SYNC.md`

**Interfaces:**
- Consumes: everything from Tasks 1-9.
- Produces: `SYNC.md` documenting the icon port's sync state, deviation catalog, and stub inventory delta.

- [ ] **Step 1: Write `src/qwik-material/icon/SYNC.md`**

Contents:

```markdown
# qwik-material/icon sync log

Tracks the sync state between this port and `src/material/icon/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`, and
`src/qwik-material/badge/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `icon/mat-icon.tsx` | `src/material/icon/icon.ts` (MatIcon component) | ported | Directive→component$; two mutually-exclusive JSX branches for font vs. SVG mode; registry omitted |
| `icon/icon-color.ts` | `src/material/icon/icon.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union |
| `icon/icon-config.ts` | `src/material/icon/icon.ts` (MatIconDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matIconConfig |
| `scss/icon/icon.scss` | `src/material/icon/icon.scss` | synced | byte-identical copy — no `@use '@angular/cdk'` present, unlike badge/toolbar/dialog port SCSS which needed the cdk-stub rewrite |
| `scss/icon/_icon-theme.scss` | `src/material/icon/_icon-theme.scss` | synced | byte-identical copy |
| `scss/icon/_m2-icon.scss` | `src/material/icon/_m2-icon.scss` | synced | byte-identical copy |
| `scss/icon/_m3-icon.scss` | `src/material/icon/_m3-icon.scss` | synced | byte-identical copy |
| `scss/icon/icon-prebuilt.scss` | (qwik-material-specific) | new | @use icon.scss + M3 :root defaults matching emitted --mat-icon-* references |

## Removed upstream files

- `icon-registry.ts` → entire 741-LOC MatIconRegistry service omitted (§Deviations #2)
- `icon-module.ts` → Qwik has no module concept
- `fake-svgs.ts` → test-only SVG payloads for registry unit tests; no registry, no need
- `testing/` (MatIconTestingModule + FakeMatIconRegistry) → registry stubs; no registry, no need
- `public-api.ts` → replaced with our own re-export shape (see `public-api.ts`)
- `icon.spec.ts` → ported to `mat-icon-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-icon>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation. Consistent with the CMS-parity constraint.
2. **`MatIconRegistry` service entirely omitted.** No XHR SVG loader, no `addSvgIcon*`, no icon-sets, no `getNamedSvgIcon`. Consumers who need registry-style lookup pre-bundle SVG strings and pass the resolved string as `svgLiteral`.
3. **`svgIcon: string` prop replaced by explicit `svgLiteral` + `svgName` + `svgNamespace`.** Three props instead of one; no colon-split magic; no registry lookup.
4. **DomSanitizer omitted.** `svgLiteral` set via `dangerouslySetInnerHTML` and trusted verbatim.
5. **`MAT_ICON_LOCATION` context + `ngAfterViewChecked` FuncIRI path-prepending omitted.** Safari workaround for base-tag pages; SSR-hostile.
6. **`ErrorHandler` injection omitted.** No icon-fetch errors possible without a registry.
7. **`registerFontClassAlias` + `setDefaultFontSetClass` + `classNameForFontAlias` omitted.** Folded into `MAT_ICON_CONFIG.fontSet`.
8. **RxJS `Subscription` lifecycle omitted.**
9. **`MAT_ICON_CONFIG` folded into `QwikMaterialProvider.matIconConfig`.** 7th `useContextProvider` call.
10. **`_cleanupFontValue` (trim + first space-separated token)** applied at prop-resolution time, not per-setter as upstream does.
11. **Font-mode vs. SVG-mode via two JSX branches.** `dangerouslySetInnerHTML` and `<Slot />` are mutually exclusive; `svgLiteral` wins if both provided.
12. **`aria-hidden='true'` default via prop merge** (`props['aria-hidden'] ?? 'true'`) instead of upstream's constructor-time `setAttribute`.

## Stub inventory delta

No new stubs — the icon SCSS chain does NOT reference `@angular/cdk` (unlike badge/toolbar/dialog port SCSS which did). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/icon/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon.
```

- [ ] **Step 2: Run the full pipeline**

```bash
pnpm test:qwik-material
```

Expected: all four sub-steps green.
- **Build:** all 6 prebuilt CSS files emit; JS + d.ts under `dist/{dialog,button,card,toolbar,badge,icon}/`.
- **Vitest:** all specs pass across 6 entry-points.
- **Lint:** zero SSR-leak violations.
- **Typecheck:** exit 0.

- [ ] **Step 3: Verify the class-count constraint**

```bash
grep -rnE "^export class" src/qwik-material/icon/ 2>/dev/null
```

Expected: no output.

- [ ] **Step 4: Verify zero SSR globals in the icon entry-point**

```bash
grep -RnE 'document\.|window\.|navigator\.|getComputedStyle\(|requestAnimationFrame\(' src/qwik-material/icon/ | grep -v '\.spec\.'
```

Expected: no output.

- [ ] **Step 5: Verify no `isBrowser` import**

```bash
grep -RnE "from '@builder\.io/qwik/build'" src/qwik-material/icon/
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/qwik-material/icon/SYNC.md
git commit -m "$(cat <<'EOF'
docs(multiple): finalize qwik-material/icon SYNC.md + pipeline verification

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Layout

```
src/qwik-material/
  icon/
    icon-color.ts                  — MatIconColor type (Task 3)
    icon-color.spec.ts
    icon-config.ts                 — MatIconConfig + MAT_ICON_CONFIG (Task 4)
    icon-config.spec.ts
    mat-icon.tsx                   — <MatIcon> (Task 5)
    mat-icon.spec.tsx              — smoke (Task 5)
    mat-icon-scenarios.spec.tsx    — upstream scenario port (Task 8)
    intrinsic-elements.d.ts        — <mat-icon> JSX augmentation (Task 1)
    public-api.ts                  — consumer-facing re-exports (Task 7)
    index.ts                       — `export * from './public-api'` (Task 1 stub / Task 7 real)
    SYNC.md                        — deviation + stub log (Task 10)
  dialog/
    qwik-material-provider.tsx     — MODIFIED in Task 6 (adds matIconConfig)
    qwik-material-provider-icon.spec.tsx — new spec (Task 6)
  scss/
    icon/                          — 4 verbatim SCSS files + icon-prebuilt.scss (Task 2)
  package.json                     — MODIFIED in Task 1 (two new export entries)
  vite.config.ts                   — MODIFIED in Task 1 (entries + sassEntries)

src/qwik-cdk-dev-app/
  src/
    root.tsx                       — MODIFIED in Task 9 (icon-prebuilt.css import)
    routes/
      index.tsx                    — MODIFIED in Task 9 (Icons section)
      mat-icon/                    — 8 new route files (Task 9)

src/qwik-cdk-parity-tests/
  specs/
    material-icon/                 — 8 new Playwright specs (Task 9)
```

## Per-entry-point state

The `icon` entry-point becomes the sixth after `dialog` + `button` + `card` + `toolbar` + `badge` in the qwik-material package. All six live independently; nothing at the entry-point boundary is shared. The single `<QwikMaterialProvider>` (from earlier ports) is the only intersection, extended in Task 6.

## Sync recipe

To re-sync a specific file from upstream `src/material/icon/`:

1. Locate the upstream file's counterpart in the `icon/SYNC.md` sync table.
2. If "synced" state: `cp` the upstream file directly onto the qwik-material path; re-run `pnpm -C src/qwik-material build` to catch any new `@use` paths that need stubbing.
3. If "ported" state: manually port the delta — read the upstream diff since the last-sync commit, apply the equivalent JSX/prop change to the `mat-icon.tsx` file, update the corresponding `.spec.tsx`.
4. Commit with `feat(multiple): re-sync <file> from upstream <SHA>`.

## Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck)
- 8 dev-app routes at `/mat-icon/*` render visibly in browser preview
- 8 Playwright specs pass locally when run against the built dev-app preview
- Every Playwright spec asserts on the `<mat-icon>` custom-element tag AT LEAST ONCE — regression that drops the tag fails loudly
- Zero exported classes on consumer surface (`grep -rE "^export class" src/qwik-material/icon/` returns nothing)
- Zero SSR-leak violations
- SYNC.md populated with all 12 deviations + stub delta
