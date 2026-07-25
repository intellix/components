# qwik-material Toolbar port — design spec

Port `src/material/toolbar/` into a `qwik-material/toolbar` entry-point. Fourth component after Dialog + Button + Card. Simplest port so far: 2 stateless components (`MatToolbar` + `MatToolbarRow`), 1 M2 color prop, custom-element DOM parity per the CMS constraint.

- **Upstream source:** `src/material/toolbar/` (1 TS file with 2 exports + a helper, 5 SCSS files, 1 HTML template, 129-line spec).
- **New entry-point:** `@angular-community/qwik-material/toolbar` at `src/qwik-material/toolbar/`.
- **New prebuilt CSS:** `@angular-community/qwik-material/toolbar-prebuilt.css`.
- **Branch:** `qwik-cdk-dialog-port` (continues on the same branch as the other qwik-material ports).
- **Base commit:** tip of the Card port after final review — `eb18fde8e`.

---

## 1. Package layout

Under `src/qwik-material/`:

```
toolbar/
  toolbar-color.ts                — MatToolbarColor type
  toolbar-color.spec.ts           — type-only spec
  intrinsic-elements.d.ts         — 2 tag augmentations (mat-toolbar, mat-toolbar-row)
  mat-toolbar.tsx                 — <MatToolbar>
  mat-toolbar.spec.tsx            — smoke
  mat-toolbar-row.tsx             — <MatToolbarRow>
  mat-toolbar-row.spec.tsx        — smoke
  mat-toolbar-scenarios.spec.tsx  — upstream scenario port
  public-api.ts                   — consumer-facing re-exports
  index.ts                        — `export * from './public-api'`
  SYNC.md                         — deviation log
  toolbar.html.removed.md         — breadcrumb for upstream template
scss/
  toolbar/
    toolbar.scss                  — verbatim copy
    _toolbar-theme.scss           — verbatim copy
    _m2-toolbar.scss              — verbatim copy
    _m3-toolbar.scss              — verbatim copy
    _toolbar-variables.scss       — verbatim copy
    toolbar-prebuilt.scss         — NEW: @use toolbar.scss + M3 :root defaults
```

Existing files reused (no changes):
- `tsconfig.json`, `vitest.setup.ts`, `scripts/lint-no-ssr-leaks.mjs`

**Modified:**
- `src/qwik-material/package.json` — add `./toolbar` + `./toolbar-prebuilt.css` exports
- `src/qwik-material/vite.config.ts` — `entries` gains `'toolbar'`; `sassEntries` gains toolbar prebuilt

**qwik-cdk-dev-app changes:**
- `src/root.tsx`: add `import '@angular-community/qwik-material/toolbar-prebuilt.css';`
- `src/routes/index.tsx`: add a "Toolbars" section with 5 route links
- `src/routes/mat-toolbar/<name>/index.tsx`: 5 new route files

**qwik-cdk-parity-tests changes:**
- `specs/material-toolbar/`: 5 Playwright specs asserting tag names + classes

## 2. Public API surface

Everything the consumer sees. No exported classes.

### 2.1 Types

```ts
export type MatToolbarColor = 'primary' | 'accent' | 'warn';
```

No config interface — upstream has no `MAT_TOOLBAR_CONFIG` injection token. `<QwikMaterialProvider>` is NOT extended for toolbar; consumers set `color` per instance.

### 2.2 Components (2)

```ts
export interface MatToolbarProps {
  /** M2 palette color. Deprecated in M3 but honoured. */
  color?: MatToolbarColor;
  /** When true, applies mat-toolbar-multiple-rows class instead of mat-toolbar-single-row. */
  multipleRows?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
export const MatToolbar: Component<MatToolbarProps>;

export interface MatToolbarRowProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}
export const MatToolbarRow: Component<MatToolbarRowProps>;
```

### 2.3 Public API file layout

`toolbar/public-api.ts`:
```ts
export type {MatToolbarColor} from './toolbar-color';
export {MatToolbar, type MatToolbarProps} from './mat-toolbar';
export {MatToolbarRow, type MatToolbarRowProps} from './mat-toolbar-row';
```

`toolbar/index.ts`:
```ts
export * from './public-api';
```

## 3. Internal architecture

### 3.1 Custom-element TypeScript augmentation

`toolbar/intrinsic-elements.d.ts`:

```ts
import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Toolbar's custom-element tag
 * names. External CMS styles may target `mat-toolbar` / `mat-toolbar-row` as
 * element selectors, not just classes.
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

### 3.2 MatToolbar reference implementation

```tsx
// mat-toolbar.tsx
import {component$, Slot} from '@builder.io/qwik';
import type {MatToolbarColor} from './toolbar-color';

export interface MatToolbarProps {
  color?: MatToolbarColor;
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

### 3.3 MatToolbarRow reference implementation

```tsx
// mat-toolbar-row.tsx
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

### 3.4 MatToolbarColor type

`toolbar-color.ts`:

```ts
/**
 * M2 palette color for <MatToolbar>. Deprecated in M3 but honoured for
 * backwards compatibility. Applying `color` adds a `mat-<color>` class.
 */
export type MatToolbarColor = 'primary' | 'accent' | 'warn';
```

## 4. SSR safety

Every toolbar component is 100% pure JSX from props:

- No `document.*` / `window.*` / `navigator.*` / `getComputedStyle(` / `requestAnimationFrame(`
- No `useVisibleTask$`, no `useContext`, no `useSignal`, no `useStore`

`scripts/lint-no-ssr-leaks.mjs` should report zero violations without any opt-outs.

## 5. Reactivity

Props flow through directly on every render. Signal-backed props re-render the correct class list because JSX reads `props.color` / `props.multipleRows` on each pass.

## 6. CSS delivery

### 6.1 Prebuilt entry

`src/qwik-material/scss/toolbar/toolbar-prebuilt.scss`:

```scss
@use './toolbar';

// Minimal Material Design 3 defaults so a bare consumer sees a themed
// toolbar. Values sourced from @angular/material/toolbar M3 tokens.
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

*Note:* the actual custom-property names above are placeholders drawn from spec-level guesses. The Task 2 implementer MUST verify the real emitted `--mat-toolbar-*` variable names by grepping `dist/toolbar-prebuilt.css` after the build and updating this `:root` block to match — same class of bug we caught in Card Task 2 where `--mdc-*-card-*` didn't connect to the structural CSS's `--mat-card-*` references. If the real emitted names differ from those listed here, use the real names.

### 6.2 Vite plumbing

`vite.config.ts` gains one entry pair:

```ts
const entries = ['dialog', 'button', 'card', 'toolbar'];
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],
  ['scss/card/card-prebuilt.scss', 'dist/card-prebuilt.css'],
  ['scss/toolbar/toolbar-prebuilt.scss', 'dist/toolbar-prebuilt.css'],
];
```

`package.json` gains two export entries:

```json
"./toolbar": {
  "qwik": "./toolbar/index.ts",
  "types": "./dist/toolbar/index.d.ts",
  "import": "./dist/toolbar/index.js"
},
"./toolbar-prebuilt.css": "./dist/toolbar-prebuilt.css",
```

### 6.3 SCSS stub reuse

Expected: 0 new stubs. Toolbar's SCSS chain is minimal (color mixin, elevation, typography — all covered by existing Dialog/Button/Card core stubs). The Task 2 implementer confirms via iterative build.

## 7. Testing strategy

### 7.1 Vitest scenarios

Ported from `src/material/toolbar/toolbar.spec.ts` (129 LOC). Enumerate upstream `it()` blocks via grep first (roughly ~7 tests: color binding, single-row default class, multi-row class, mixed-modes error, row-count reactivity, custom class merge, etc.).

Restructured for the smoke-only vitest constraint (createDOM hangs Qwik optimizer):
- **Live sanity tests (~4):** `MatToolbar` + `MatToolbarRow` typeof + import checks
- **describe.skip block:** upstream `it()` names preserved as todo stubs for future porting; DOM-render coverage deferred to Playwright.
- **describe.skip (1 Angular-only):** the mixed-modes error test cannot port without DOM inspection.

Total target: ~4 passing + upstream-count skipped.

### 7.2 Dev-app routes (5)

Under `src/qwik-cdk-dev-app/src/routes/mat-toolbar/`:

| Route            | Renders                                                                    |
|------------------|----------------------------------------------------------------------------|
| `basic/`         | `<MatToolbar>My Application</MatToolbar>` (single-row default)             |
| `color-primary/` | `<MatToolbar color="primary">Primary toolbar</MatToolbar>`                 |
| `color-accent/`  | `<MatToolbar color="accent">Accent toolbar</MatToolbar>`                   |
| `color-warn/`    | `<MatToolbar color="warn">Warn toolbar</MatToolbar>`                       |
| `multiple-rows/` | `<MatToolbar multipleRows>` with 2 `<MatToolbarRow>` children              |

Each route renders `<main data-scenario-ready>ready</main>` after mount for Playwright wait. Adds a new "Toolbars" `<section>` to `src/qwik-cdk-dev-app/src/routes/index.tsx` alongside the existing Dialogs / Buttons / Cards sections.

### 7.3 Playwright parity specs (5)

Under `src/qwik-cdk-parity-tests/specs/material-toolbar/`. Each spec asserts BOTH the custom-element tag name (`page.locator('mat-toolbar')`) AND class list.

Example (`basic.spec.ts`):

```ts
import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-toolbar/basic — <mat-toolbar> with single-row class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-toolbar/basic/`);
  await page.waitForSelector('[data-scenario-ready]');
  const toolbar = page.locator('mat-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/mat-toolbar(\s|$)/);
  await expect(toolbar).toHaveClass(/mat-toolbar-single-row/);
  await expect(toolbar).not.toHaveClass(/mat-toolbar-multiple-rows/);
});
```

Similar structure for the other 4 routes.

## 8. Deviations from upstream

Recorded in `src/qwik-material/toolbar/SYNC.md`:

1. **`multipleRows?: boolean` prop replaces upstream's `@ContentChildren(MatToolbarRow)` runtime detection.** Qwik has no equivalent reflection at render time; consumer opts in explicitly.
2. **`_checkToolbarMixedModes()` dev-mode error skipped.** Upstream throws in dev mode when consumers mix free content + `<mat-toolbar-row>` children. Deferred to a future qwik-material dev-mode subsystem.
3. **`throwToolbarMixedModesError` export omitted.** No consumers of the dev-error helper.
4. **`Platform` + `DOCUMENT` DI dropped.** Only used by the dev-mode check; irrelevant.
5. **Custom-element tag names (`mat-toolbar`, `mat-toolbar-row`) emitted verbatim** via IntrinsicElements augmentation (same pattern as Card).
6. **`toolbar.html` collapses into `mat-toolbar.tsx` JSX** with a `toolbar.html.removed.md` breadcrumb — qwik-material file-naming convention.
7. **QwikMaterialProvider NOT extended.** Upstream has no `MAT_TOOLBAR_CONFIG` token; per-instance `color` prop is the only consumer knob. No new provider surface.

## 9. Success criteria (final self-check)

- `pnpm test:qwik-material` chain green (build + vitest + lint + typecheck), including toolbar coverage
- All 5 toolbar variants in the dev-app (`/mat-toolbar/*`) render with visible M3 styling in preview mode
- SSR-leak lint reports zero violations
- 0 exported classes on the consumer surface
- Playwright material-toolbar specs pass locally against the built dev-app preview
- **Every Playwright spec asserts on the tag name AT LEAST ONCE** (`mat-toolbar` / `mat-toolbar-row`) so a regression to `<div>` fails loudly
- `src/qwik-material/toolbar/SYNC.md` populated with all 7 deviations + stub inventory delta (expected: zero new stubs)

## 10. Task decomposition preview

Estimated ~8 tasks. Smaller than Card (14 tasks) — no config token, no q:slot structure, no image variants, only 2 components. Rough breakdown:

- **Phase 1 — Scaffolding** (1 task): extend vite.config entries + package.json exports + intrinsic-elements.d.ts + empty index.ts stub
- **Phase 2 — SCSS chain** (1 task): copy 5 SCSS files, verify build, emit `toolbar-prebuilt.css` with M3 :root defaults (verify emitted `--mat-toolbar-*` variable names match `:root` block — same bug class as Card Task 2)
- **Phase 3 — Foundation type** (1 task): `toolbar-color.ts`
- **Phase 4 — Components** (1 combined task): MatToolbar + MatToolbarRow (both trivial ~15 LOC files with smoke specs)
- **Phase 5 — Public API + build validation** (1 task): `public-api.ts` + `index.ts` + build verify + zero-classes check
- **Phase 6 — Scenario tests** (1 task): vitest scenario port
- **Phase 7 — Dev-app + Playwright** (1 task): 5 mat-toolbar routes + index tile + root.tsx CSS import + 5 Playwright specs
- **Phase 8 — Finalisation** (1 task): SYNC.md + pipeline verification

Rough total: 8 Toolbar tasks. Simplest port yet.

## 11. Out of scope for this port

- `_checkToolbarMixedModes()` dev-mode error and `throwToolbarMixedModesError` helper (deferred to future qwik-material dev-mode subsystem)
- Auto-detection of row count via `@ContentChildren` equivalent (explicit `multipleRows` prop instead)
- `MAT_TOOLBAR_CONFIG` injection token (upstream has none)
- Full M3 theming DSL (blocked on qwik-material/core; `toolbar-prebuilt.css` ships :root defaults as a stopgap)
