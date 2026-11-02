# qwik-material Divider port — design spec

Port `src/material/divider/` into a `qwik-material/divider` entry-point. Ninth component after Dialog + Button + Card + Toolbar + Badge + Icon + Progress Bar + Progress Spinner. The smallest port in the series so far: a single self-closing `<MatDivider>` component with 2 boolean props + 3 aria-* passthroughs. No factory, no computation, no lifecycle, no template body — CSS handles the entire line rendering via `border-top` / `border-right`.

- **Upstream source:** `src/material/divider/` (46-LOC component with empty template + 5 SCSS files, ~152 total LOC + 68-LOC spec).
- **New entry-point:** `@angular-community/qwik-material/divider` at `src/qwik-material/divider/`.
- **New prebuilt CSS:** `@angular-community/qwik-material/divider-prebuilt.css`.
- **Branch:** `qwik-cdk-dialog-port` (continues on the same branch).
- **Base commit:** tip of the Progress Spinner port after the final-review fix wave — `1216323c5`.

---

## 1. Package layout

Under `src/qwik-material/`:

```
divider/
  divider-config.ts             — MatDividerConfig + MAT_DIVIDER_CONFIG token
  divider-config.spec.ts
  mat-divider.tsx               — <MatDivider>
  mat-divider.spec.tsx          — smoke
  mat-divider-scenarios.spec.tsx — upstream scenario port
  intrinsic-elements.d.ts       — <mat-divider> JSX declaration
  public-api.ts                 — consumer-facing re-exports
  index.ts                      — `export * from './public-api'`
  SYNC.md                       — deviation log
scss/
  divider/
    divider.scss                — byte-identical copy (no @angular/cdk to rewrite)
    _divider-theme.scss         — byte-identical copy
    _divider-offset.scss        — byte-identical copy
    _m2-divider.scss            — byte-identical copy
    _m3-divider.scss            — byte-identical copy
    divider-prebuilt.scss       — NEW: @use divider.scss + M3 :root defaults
```

Notably absent (unlike prior ports): no `divider-color.ts` (divider color is theme-driven, no palette variant) and no `divider-mode.ts` (only 2 boolean props). The type/mode files that padded prior ports' Task 3/4/5 shape collapse into a single `divider-config.ts`.

**Modified:**
- `src/qwik-material/package.json` — add `./divider` + `./divider-prebuilt.css` exports (after `./progress-spinner` entries)
- `src/qwik-material/vite.config.ts` — `entries` gains `'divider'`; `sassEntries` gains divider prebuilt
- `src/qwik-material/dialog/qwik-material-provider.tsx` — add `matDividerConfig?: MatDividerConfig` prop + `useContextProvider(MAT_DIVIDER_CONFIG, ...)` call (10th provider call)

**qwik-cdk-dev-app changes:**
- `src/root.tsx`: add `import '@angular-community/qwik-material/divider-prebuilt.css';`
- `src/routes/index.tsx`: add a "Dividers" section with 6 route links after Progress spinners
- `src/routes/mat-divider/<name>/index.tsx`: 6 new route files

**qwik-cdk-parity-tests changes:**
- `specs/material-divider/`: 6 Playwright specs

---

## 2. Public API surface

No exported classes.

### 2.1 Config token

```ts
import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every <MatDivider> in a subtree. Consumers provide this
 * via <QwikMaterialProvider matDividerConfig={...}>. Currently empty — the
 * divider has no consumer-configurable defaults today. Kept for family shape
 * parity with the other qwik-material components and to allow future fields
 * without an API break.
 */
export interface MatDividerConfig {}

/**
 * Context id used by <MatDivider> to read config. The id string is exposed
 * publicly and MUST remain stable across releases.
 */
export const MAT_DIVIDER_CONFIG = createContextId<MatDividerConfig>(
  'qwik-material/divider-config',
);
```

### 2.2 Component props

```ts
export interface MatDividerProps {
  /** Renders as a vertical divider (right border) instead of horizontal (top border). */
  vertical?: boolean;
  /** Applies inset margin (80px start-side, RTL-aware). */
  inset?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
```

### 2.3 Component

```ts
export declare const MatDivider: Component<MatDividerProps>;
```

### 2.4 Public API re-exports (`divider/public-api.ts`)

```ts
export type {MatDividerConfig} from './divider-config';
export {MAT_DIVIDER_CONFIG} from './divider-config';
export {MatDivider, type MatDividerProps} from './mat-divider';
```

Zero `export declare class`. Zero `class` declarations on the consumer surface.

### 2.5 Provider extension

```tsx
<QwikMaterialProvider matDividerConfig={{}}>
  <p>Section 1</p>
  <MatDivider />
  <p>Section 2</p>
</QwikMaterialProvider>
```

Empty config is valid (and currently the only meaningful shape).

---

## 3. Internal architecture

### 3.1 Rendered DOM shape

**Horizontal divider (default):**

```html
<mat-divider role="separator" aria-orientation="horizontal" class="mat-divider mat-divider-horizontal"></mat-divider>
```

**Vertical divider (`vertical={true}`):**

```html
<mat-divider role="separator" aria-orientation="vertical" class="mat-divider mat-divider-vertical"></mat-divider>
```

**Inset divider (`inset={true}`):**

```html
<mat-divider role="separator" aria-orientation="horizontal" class="mat-divider mat-divider-horizontal mat-divider-inset"></mat-divider>
```

**Labeled divider (`aria-label="End of comments"`):**

```html
<mat-divider role="separator" aria-orientation="horizontal" aria-label="End of comments" class="mat-divider mat-divider-horizontal"></mat-divider>
```

Self-closing element with no children — the CSS `border-top` / `border-right` renders the actual line.

### 3.2 Prop resolution chain

```
vertical = props.vertical ?? false
inset    = props.inset    ?? false
```

Config is read (`useContext(MAT_DIVIDER_CONFIG, DEFAULTS)`) but currently has no fields to resolve. The read pattern is established so future config fields plug in without a component-file rewrite.

### 3.3 Class ladder (exact order)

```ts
const classes = [
  'mat-divider',
  vertical ? 'mat-divider-vertical' : 'mat-divider-horizontal',
  inset && 'mat-divider-inset',
  props.class,
].filter(Boolean) as string[];
```

Established `.filter(Boolean) as string[]` cast — Qwik's `ClassList` type rejects `(string | ReadonlyArray<string>)[]`.

Upstream host bindings parity:
- `mat-divider` — static (matches `'class': 'mat-divider'`).
- `mat-divider-vertical` OR `mat-divider-horizontal` — mutually exclusive, matches upstream's `[class.mat-divider-vertical]: 'vertical'` + `[class.mat-divider-horizontal]: '!vertical'` bindings.
- `mat-divider-inset` — matches `[class.mat-divider-inset]: 'inset'`.

### 3.4 Host attributes

- `id={props.id}` (optional)
- `class={classes}` (see §3.3)
- `role="separator"` (always — matches `'role': 'separator'`)
- `aria-orientation={vertical ? 'vertical' : 'horizontal'}` — matches `[attr.aria-orientation]: 'vertical ? "vertical" : "horizontal"'`
- `aria-label` / `aria-labelledby` / `aria-describedby` — passthroughs (undefined omission)

No `mode` attribute (unlike Progress Bar / Progress Spinner). No inline style.

### 3.5 No lifecycle work

- Zero `useVisibleTask$`, zero `useTask$`, zero `useSignal` for state, zero id counter, zero event listeners.
- Pure function of `(props, context)` → JSX.

---

## 4. SSR & rendering safety

- Zero browser globals (`document.` / `window.` / `navigator.` / `getComputedStyle(` / `requestAnimationFrame(` all absent).
- No `isBrowser` import from `@builder.io/qwik/build` (banned per Global Constraints).
- No `useVisibleTask$` — no client-side event binding needed. CSS renders the line at both SSR and hydrate time.
- SSR lint (`lint:no-ssr-leaks`) will find zero violations.

---

## 5. CSS delivery

### 5.1 SCSS chain

Byte-identical copies (all 5 files, verified zero `@angular/cdk` references):
- `divider.scss` (29 LOC)
- `_divider-theme.scss` (75 LOC)
- `_divider-offset.scss` (12 LOC)
- `_m2-divider.scss` (17 LOC)
- `_m3-divider.scss` (19 LOC)

No `@use '../cdk-stub' as cdk` rewrite needed — second port after Icon to skip the rewrite entirely.

If Task 2's iterative reconciliation surfaces a hidden `cdk.*` call from a transitive `@use` path, apply the established rewrite pattern; expected outcome is zero rewrite based on the grep-confirmed absence of `@angular/cdk` references in any of the 5 files.

### 5.2 Prebuilt CSS

New file `scss/divider/divider-prebuilt.scss`: `@use './divider';` first (Sass syntax) + `:root { … }` block declaring every `--mat-divider-*` reference emitted by the compiled CSS.

Task 2 verifies with the iterative grep-vs-`:root` reconciliation loop (established since Icon Task 2). Plan-author's candidate is a guess; compiled CSS is the source of truth.

### 5.3 Consumer wiring

```ts
import '@angular-community/qwik-material/divider-prebuilt.css';
```

Independent of other prebuilt entries.

---

## 6. Deviations catalog

Recorded verbatim in `src/qwik-material/divider/SYNC.md` (Task 9).

1. **`<mat-divider>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation. Typed as `QwikIntrinsicElements['hr']` (closest semantic HTML element — an `<hr>` IS a separator in HTML). No custom attribute widening needed.
2. **`BooleanInput` + `coerceBooleanProperty` omitted.** Qwik JSX passes booleans directly; consumer writes `<MatDivider vertical={true}>` or omits the prop. No attribute-string coercion needed.
3. **`MAT_DIVIDER_CONFIG` folded into `QwikMaterialProvider.matDividerConfig`.** 10th `useContextProvider` call. Config is currently `{}` (no fields) — kept for family shape parity + future extensibility.
4. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatDividerProps` and forwarded to `<mat-divider>`. Decorative default (`role="separator"` + `aria-orientation`) preserved; consumers may add labels.
5. **No `template: ''` explicit declaration.** Qwik's self-closing `<mat-divider />` renders an empty element naturally — matches upstream's empty template.
6. **`intrinsic-elements.d.ts` types `<mat-divider>` as `QwikIntrinsicElements['hr']`.** Semantic HTML closest match. No `& {mode?: string}`-style widening needed since divider emits no custom camelCase attributes.
7. **No `useVisibleTask$` / no lifecycle work.** Pure `(props, context) → JSX` component. No id counter (no internal ids), no signals, no event listeners.
8. **5 SCSS files copied byte-identical.** No `@angular/cdk` reference in any file (grep-confirmed) — no cdk-stub rewrite needed. Second port after Icon to skip the rewrite.

Additional deviations discovered during implementation get appended to the SYNC.md list.

---

## 7. Test coverage strategy

### 7.1 Vitest (smoke-only)

`divider/mat-divider-scenarios.spec.tsx` mirrors prior port structure. `createDOM(<component$/>)` hangs the Qwik optimizer worker under vitest — every prior port confirmed this — so specs use module-import assertions only.

**Live sanity tests (~5):**
1. `MatDivider` is exported (typeof === 'function')
2. `MAT_DIVIDER_CONFIG.id === 'qwik-material/divider-config'`
3. `MatDividerConfig` accepts an empty object
4. `MatDividerProps` accepts the boolean + aria surface
5. Public API re-exports resolve

**describe.skip DOM-rendered (~8):** deferred to Playwright Task 8
- host classes: `mat-divider`, `mat-divider-horizontal` (default), `mat-divider-vertical`, `mat-divider-inset`
- host attrs: `role="separator"`, `aria-orientation` (horizontal/vertical)
- aria-label / aria-labelledby / aria-describedby forwarding
- self-closing DOM (no children in the rendered `<mat-divider>` element)

**describe.skip Angular-only (~3):** deferred forever per §6 deviations
- `BooleanInput` coercion (`coerceBooleanProperty` accepts empty-string / "true" attribute values)
- `NgModule` (`divider-module.ts`) declaration
- Angular `@Input()` decorator field-shape

### 7.2 Dev-app routes (6)

Under `src/qwik-cdk-dev-app/src/routes/mat-divider/`:

| Route | Scenario |
| --- | --- |
| `basic/` | `<MatDivider />` — default horizontal, no inset, decorative |
| `vertical/` | `<MatDivider vertical />` — asserts `mat-divider-vertical` class + `aria-orientation="vertical"` |
| `inset/` | `<MatDivider inset />` — asserts `mat-divider-inset` class alongside horizontal default |
| `vertical-inset/` | `<MatDivider vertical inset />` — both booleans active, asserts both classes |
| `aria-labeled/` | `<MatDivider aria-label="End of comments" />` — asserts aria-label passthrough |
| `list-context/` | 3 `<div>` items with `<MatDivider />` between each — realistic list-separator usage; asserts 2 dividers rendered, each with correct role |

Every route ends with `<main data-scenario-ready>ready</main>`.

### 7.3 Playwright parity specs (6)

Under `src/qwik-cdk-parity-tests/specs/material-divider/`. One spec per dev-app route. Each spec asserts:
- Locator `mat-divider` (custom-element tag — same as Card / Toolbar / Icon).
- Class ladder tokens per scenario.
- Host attrs: `role="separator"`, `aria-orientation`, `aria-label` where applicable.
- Divider is self-closing (no children inside the `<mat-divider>` element — `page.locator('mat-divider').textContent()` returns empty string).

CMS parity gate: every spec asserts on the `mat-divider` tag AT LEAST ONCE.

---

## 8. SYNC.md format

`src/qwik-material/divider/SYNC.md` follows the same table + deviation-catalog + stub-inventory-delta shape as prior ports. Rows:

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `divider/mat-divider.tsx` | `src/material/divider/divider.ts` (MatDivider component) | ported | Directive→component$; JSX self-closing element; BooleanInput coercion omitted (Qwik JSX passes booleans directly) |
| `divider/divider-config.ts` | (no upstream equivalent) | new | MatDividerConfig = {} interface + MAT_DIVIDER_CONFIG context id; folded into QwikMaterialProvider.matDividerConfig for family shape parity |
| `scss/divider/divider.scss` | `src/material/divider/divider.scss` | synced | byte-identical copy — no `@use '@angular/cdk'` present (unlike badge/toolbar/dialog/progress-bar/progress-spinner ports which needed the cdk-stub rewrite) |
| `scss/divider/_divider-theme.scss` | `src/material/divider/_divider-theme.scss` | synced | byte-identical copy |
| `scss/divider/_divider-offset.scss` | `src/material/divider/_divider-offset.scss` | synced | byte-identical copy |
| `scss/divider/_m2-divider.scss` | `src/material/divider/_m2-divider.scss` | synced | byte-identical copy |
| `scss/divider/_m3-divider.scss` | `src/material/divider/_m3-divider.scss` | synced | byte-identical copy |
| `scss/divider/divider-prebuilt.scss` | (qwik-material-specific) | new | @use divider.scss + M3 :root defaults matching emitted --mat-divider-* references |

Removed upstream files:
- `divider-module.ts` → Qwik has no module concept
- `testing/` (MatDividerHarness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (§2.4)
- `divider.spec.ts` → ported to `mat-divider-scenarios.spec.tsx` with restructured coverage

---

## 9. Explicit non-goals

- No `BooleanInput` / `coerceBooleanProperty` shim — Qwik JSX passes booleans directly.
- No custom-attribute widening in `intrinsic-elements.d.ts` — divider has no camelCase custom attrs (unlike Icon's `fontIcon` / Progress Bar / Progress Spinner's `mode`).
- No `useVisibleTask$` / no lifecycle work.
- No color/size/mode variants beyond `vertical` + `inset` booleans.
- No animation.
- No config fields on `MatDividerConfig` today — the interface is intentionally empty for shape parity + future extensibility.

---

## 10. Rough task decomposition

Plan-writer will refine, but the shape mirrors prior ports with fewer type/mode tasks:

1. **Entry-point wiring** — package.json + vite.config.ts + intrinsic-elements.d.ts + empty index.ts stub
2. **SCSS chain + prebuilt** — copy 5 upstream files (all byte-identical; no `@angular/cdk` rewrite needed) + write divider-prebuilt.scss with iterative `:root` reconciliation
3. **MatDividerConfig + MAT_DIVIDER_CONFIG** — empty interface + context id + spec
4. **MatDivider component** — mat-divider.tsx with prop resolution + class ladder + host attrs + smoke spec
5. **Provider extension** — extend `QwikMaterialProvider` with `matDividerConfig?` field (10th `useContextProvider` call)
6. **Public API** — public-api.ts re-exports + swap index.ts stub for real re-export + build validation
7. **Vitest scenario port** — mat-divider-scenarios.spec.tsx with restructured coverage
8. **Dev-app routes + Playwright specs** — 6 routes + 6 parity specs + root.tsx CSS import + index.tsx tile section
9. **SYNC.md + pipeline verification** — final `pnpm test:qwik-material` gate

Every task ends with a commit using scope `multiple` per the project-wide commit-msg hook constraint.
