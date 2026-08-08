# qwik-material List Port — Design Spec

**Date:** 2026-08-08
**Branch:** `qwik-cdk-dialog-port` (11th component after Dialog, Button, Card, Toolbar, Badge, Icon, Progress Bar, Progress Spinner, Divider, Grid List).
**Scope tier:** easy (display list only — selection-list deferred).

## 1. Goal

Port the display-list surface of `src/material/list` to a `qwik-material/list` entry-point:

- **10 components:** `MatList`, `MatNavList`, `MatActionList`, `MatSubheader`, `MatListItem` (polymorphic `<div>` / `<a>` / `<button>` host), plus 5 slot components (`MatListItemAvatar`, `MatListItemIcon`, `MatListItemTitle`, `MatListItemLine`, `MatListItemMeta`).
- **Line-count layout via CSS `:has()`** — replaces upstream's `@ContentChildren` + `_updateItemLines` + `cdkObserveContent` JS pipeline. Zero JS at runtime, SSR-safe by definition.
- **CSS grid layout for `MatListItem`** — replaces MDC's ~477-LOC `_list-inherited-structure.scss` flex/positioning mixin chain.

**Non-goals:** `MatSelectionList` + `MatListOption` (interactive form control — deferred to a dedicated later port with the forms tier: checkbox / radio / slide-toggle). Ripple system, focus manager, MDC state layer, CDK focus indicator — all out of scope (matches prior 10-port pattern).

## 2. Architecture

**10 pure `component$` wrappers, zero lifecycle, CSS-driven layout.**

**Container variants (thin — one file `mat-list.tsx`):**
- `MatList` — `<mat-list>` custom element
- `MatNavList` — `<mat-nav-list>` (forces `role="navigation"`)
- `MatActionList` — `<mat-action-list>` (forces `role="group"`)
- `MatSubheader` — `<mat-subheader>` (upstream: `[matSubheader]` directive; ported as a real component for Qwik ergonomics)

**Item component (`mat-list-item.tsx`):**
- `MatListItem` — polymorphic host via `as?: 'div' | 'a' | 'button'` prop. Default `'div'` renders `<mat-list-item>` custom element. `as='a'` renders `<a>` (with `href` prop). `as='button'` renders `<button>` (with `disabled` reflected). Mirrors upstream selectors `a[mat-list-item]` and `button[mat-list-item]`.
- `activated` prop → `aria-current="page"` **only** when `as='a'` (matches upstream `_getAriaCurrent`).
- `disabled` prop → `mdc-list-item--disabled` class + `aria-disabled="true"` + (button only) native `disabled` attribute.

**Slot components (one file `mat-list-item-sections.tsx`):**
- `MatListItemAvatar` — `.mat-mdc-list-item-avatar` + `.mdc-list-item__start`
- `MatListItemIcon` — `.mat-mdc-list-item-icon` + `.mdc-list-item__start`
- `MatListItemTitle` — `.mat-mdc-list-item-title` + `.mdc-list-item__primary-text`
- `MatListItemLine` — `.mat-mdc-list-item-line` + `.mdc-list-item__secondary-text`
- `MatListItemMeta` — `.mat-mdc-list-item-meta` + `.mdc-list-item__end`

Each is a trivial `component$` that renders `<div class="<hooks>"><Slot /></div>`. Zero props beyond `class` / `id`.

**Layout — CSS grid on `MatListItem` positions slot components by class:**

```scss
.mat-mdc-list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-auto-rows: min-content;
  align-items: center;
  gap: 0 16px;
  min-height: 48px;

  .mat-mdc-list-item-avatar,
  .mat-mdc-list-item-icon { grid-column: 1; grid-row: 1 / -1; }
  .mat-mdc-list-item-title,
  .mat-mdc-list-item-line { grid-column: 2; }
  .mat-mdc-list-item-meta { grid-column: 3; grid-row: 1 / -1; }
}

/* Line-count sizing via :has() — no JS, no @ContentChildren */
.mat-mdc-list-item:has(> .mat-mdc-list-item-line) { min-height: 64px; padding: 8px 16px; }
.mat-mdc-list-item:has(> .mat-mdc-list-item-line ~ .mat-mdc-list-item-line) { min-height: 88px; }
```

Consumer writes slot components in ANY DOM order — CSS grid places them by class. No `q:slot` needed.

**Family shape:**
- `MatListConfig` — empty (parity with divider / grid-list).
- Extended as the **12th** `useContextProvider` call in `QwikMaterialProvider`.
- Container components read config via `useContext(MAT_LIST_CONFIG, DEFAULTS)` — SSR-safe fallback (Progress Bar / Progress Spinner lesson).
- **No per-instance context.** Unlike grid-list, list items don't need to read parent state.

**File layout:**

```
src/qwik-material/list/
├── intrinsic-elements.d.ts       # <mat-list>, <mat-nav-list>, <mat-action-list>, <mat-list-item>, <mat-subheader>
├── list-config.ts                # MatListConfig + MAT_LIST_CONFIG
├── list-config.spec.ts
├── mat-list.tsx                  # MatList + MatNavList + MatActionList + MatSubheader (4 thin container variants in one file)
├── mat-list.spec.tsx
├── mat-list-item.tsx             # MatListItem (polymorphic host)
├── mat-list-item.spec.tsx
├── mat-list-item-sections.tsx    # 5 slot components in one file
├── mat-list-item-sections.spec.tsx
├── public-api.ts                 # 18 exports
├── index.ts                      # export * from './public-api';
├── mat-list-scenarios.spec.tsx   # smoke-only scenario port
└── SYNC.md                       # deviation catalog

src/qwik-material/scss/list/
├── list.scss                     # heavily REWRITTEN (~80 LOC — CSS grid + :has() + typography)
├── _list-theme.scss              # synced byte-identical
├── _list-item-hcm-indicator.scss # synced byte-identical
├── _m2-list.scss                 # synced byte-identical
├── _m3-list.scss                 # synced byte-identical
└── list-prebuilt.scss            # new — :root var defaults
```

## 3. Component API

### 3.1 Container variants — `MatList`, `MatNavList`, `MatActionList`, `MatSubheader`

```ts
export interface MatListProps {
  /** ARIA role passthrough. Upstream defaults to nothing (decorative).
   *  Consumers may pass "list" per list.md guidance. */
  role?: string;
  /** When true, sets aria-disabled on the container; CSS cascades disabled
   *  styling to all descendant list items. */
  disabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export interface MatNavListProps extends MatListProps {}
export interface MatActionListProps extends MatListProps {}

export interface MatSubheaderProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
```

**Rendered DOM (`MatList` with `role="list"`):**
```html
<mat-list class="mat-mdc-list mat-mdc-list-base mdc-list" role="list">
  <!-- projected items -->
</mat-list>
```

**Rendered DOM (`MatNavList`):**
```html
<mat-nav-list class="mat-mdc-nav-list mat-mdc-list-base mdc-list" role="navigation">
  <!-- ... -->
</mat-nav-list>
```

**Rendered DOM (`MatActionList`):**
```html
<mat-action-list class="mat-mdc-action-list mat-mdc-list-base mdc-list" role="group">
  <!-- ... -->
</mat-action-list>
```

**Rendered DOM (`MatSubheader`):**
```html
<mat-subheader class="mat-mdc-subheader mdc-list-group__subheader">Inbox</mat-subheader>
```

**Rendered DOM (`MatList disabled`):**
```html
<mat-list class="mat-mdc-list mat-mdc-list-base mdc-list" role="list" aria-disabled="true">
  <!-- descendant items get styled via CSS cascade: .mat-mdc-list[aria-disabled='true'] .mat-mdc-list-item -->
</mat-list>
```

### 3.2 `MatListItem` (polymorphic host)

```ts
export interface MatListItemProps {
  /** Which host tag to render. Default `'div'` renders `<mat-list-item>` custom element.
   *  `'a'` renders `<a>` (for nav-list items — combine with `href`).
   *  `'button'` renders `<button>` (for action-list items — combine with `onClick$`). */
  as?: 'div' | 'a' | 'button';
  /** When `as='a'`, sets the href. Ignored for other tags. */
  href?: string;
  /** For nav-list items: marks this as the current page → emits aria-current="page".
   *  Only emitted when `as='a'` (matches upstream _getAriaCurrent). */
  activated?: boolean;
  /** Applies mdc-list-item--disabled + aria-disabled=true.
   *  When `as='button'`, also reflects the native disabled attribute. */
  disabled?: boolean;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
```

**Rendered DOM (default `as='div'`):**
```html
<mat-list-item class="mat-mdc-list-item mdc-list-item" role="listitem">
  <!-- slot components in any order — CSS grid places by class -->
</mat-list-item>
```

**Rendered DOM (`as='a' href='/foo' activated`):**
```html
<a class="mat-mdc-list-item mdc-list-item mdc-list-item--activated" href="/foo" aria-current="page">
  <!-- ... -->
</a>
```

**Rendered DOM (`as='button' disabled`):**
```html
<button class="mat-mdc-list-item mdc-list-item mdc-list-item--disabled"
        disabled aria-disabled="true">
  <!-- ... -->
</button>
```

### 3.3 Five slot components

Shared props interface — trivial wrappers, one file.

```ts
export interface MatListItemSectionProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatListItemAvatar = component$<MatListItemSectionProps>(props => (
  <div class={['mat-mdc-list-item-avatar', 'mdc-list-item__start', props.class]
              .filter(Boolean) as string[]} id={props.id}>
    <Slot />
  </div>
));

export const MatListItemIcon = component$<MatListItemSectionProps>(props => (
  <div class={['mat-mdc-list-item-icon', 'mdc-list-item__start', props.class]
              .filter(Boolean) as string[]} id={props.id}>
    <Slot />
  </div>
));

export const MatListItemTitle = component$<MatListItemSectionProps>(props => (
  <div class={['mat-mdc-list-item-title', 'mdc-list-item__primary-text', props.class]
              .filter(Boolean) as string[]} id={props.id}>
    <Slot />
  </div>
));

export const MatListItemLine = component$<MatListItemSectionProps>(props => (
  <div class={['mat-mdc-list-item-line', 'mdc-list-item__secondary-text', props.class]
              .filter(Boolean) as string[]} id={props.id}>
    <Slot />
  </div>
));

export const MatListItemMeta = component$<MatListItemSectionProps>(props => (
  <div class={['mat-mdc-list-item-meta', 'mdc-list-item__end', props.class]
              .filter(Boolean) as string[]} id={props.id}>
    <Slot />
  </div>
));
```

### 3.4 Composition example (consumer)

```tsx
<MatList role="list">
  <MatSubheader>Inbox</MatSubheader>
  <MatListItem>
    <MatListItemAvatar><img src="/avatar.jpg" alt="" /></MatListItemAvatar>
    <MatListItemTitle>Sender name</MatListItemTitle>
    <MatListItemLine>Subject line</MatListItemLine>
    <MatListItemLine>Preview text</MatListItemLine>
    <MatListItemMeta>12:34</MatListItemMeta>
  </MatListItem>
</MatList>
```

CSS grid places avatar left, title/lines stacked in center column, meta right — regardless of the DOM order the consumer wrote them. `:has()` sizes the item to 88px (two `.mat-mdc-list-item-line` descendants detected). Zero JS at runtime.

### 3.5 Config token

```ts
// list-config.ts
export interface MatListConfig {}

export const MAT_LIST_CONFIG = createContextId<MatListConfig>(
  'qwik-material/list-config',
);
```

Empty for family-shape parity. No fields today; kept as a stable token so future config fields plug in without an API break.

### 3.6 Public API — 18 exports

```ts
// public-api.ts
export type {MatListConfig} from './list-config';
export {MAT_LIST_CONFIG} from './list-config';

export {
  MatList, type MatListProps,
  MatNavList, type MatNavListProps,
  MatActionList, type MatActionListProps,
  MatSubheader, type MatSubheaderProps,
} from './mat-list';

export {MatListItem, type MatListItemProps} from './mat-list-item';

export {
  MatListItemAvatar,
  MatListItemIcon,
  MatListItemTitle,
  MatListItemLine,
  MatListItemMeta,
  type MatListItemSectionProps,
} from './mat-list-item-sections';
```

**Breakdown:** 7 types (`MatListConfig`, `MatListProps`, `MatNavListProps`, `MatActionListProps`, `MatSubheaderProps`, `MatListItemProps`, `MatListItemSectionProps`) + 1 value (`MAT_LIST_CONFIG`) + 10 components. Largest export surface of any port so far.

## 4. SCSS strategy

**Upstream inventory (6 files, ~1030 LOC):**

| File | Upstream LOC | Action | Notes |
|---|---|---|---|
| `list.scss` | 185 | **rewritten** (~80 LOC target) | CSS grid + `:has()` + typography token wiring; drops MDC state-layer / ripple / focus-indicator selectors |
| `_list-inherited-structure.scss` | **477** | **DROPPED entirely** | MDC flex-positioning mixin chain + state-layer + ripple hooks + activated-state gradients — all replaced by CSS grid or scoped out |
| `_list-item-hcm-indicator.scss` | 29 | synced byte-identical | Small high-contrast helper; inert on our end |
| `_list-theme.scss` | 201 | synced byte-identical | Theme mixin inert |
| `_m2-list.scss` | 92 | synced byte-identical | M2 typography tokens |
| `_m3-list.scss` | 93 | synced byte-identical | M3 typography tokens |

**Rewritten `list.scss` — target shape:**

```scss
@use './m3-list';
@use '../core/tokens/token-utils';

$fallbacks: m3-list.get-tokens();

.mat-mdc-list,
.mat-mdc-nav-list,
.mat-mdc-action-list {
  display: block;
  padding: 8px 0;
  margin: 0;
  list-style: none;

  &[aria-disabled='true'] .mat-mdc-list-item {
    pointer-events: none;
    opacity: 0.38;
  }
}

.mat-mdc-subheader {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 16px;
  font-size: token-utils.slot(list-subheader-text-size, $fallbacks);
  font-weight: 500;
  color: var(--mat-list-list-item-supporting-text-color, rgba(0, 0, 0, 0.6));
  margin: 0;
}

.mat-mdc-list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-auto-rows: min-content;
  align-items: center;
  gap: 0 16px;
  min-height: 48px;
  padding: 0 16px;
  color: var(--mat-list-list-item-label-text-color, rgba(0, 0, 0, 0.87));
  font-size: token-utils.slot(list-item-label-text-size, $fallbacks);

  &.mdc-list-item--activated {
    background-color: rgba(0, 0, 0, 0.08);
  }

  &.mdc-list-item--disabled {
    pointer-events: none;
    opacity: 0.38;
  }

  .mat-mdc-list-item-avatar,
  .mat-mdc-list-item-icon { grid-column: 1; grid-row: 1 / -1; }
  .mat-mdc-list-item-title,
  .mat-mdc-list-item-line { grid-column: 2; }
  .mat-mdc-list-item-meta { grid-column: 3; grid-row: 1 / -1; }
}

.mat-mdc-list-item-title {
  font-size: token-utils.slot(list-item-label-text-size, $fallbacks);
  color: var(--mat-list-list-item-label-text-color, rgba(0, 0, 0, 0.87));
  line-height: 1.5;
}

.mat-mdc-list-item-line {
  font-size: token-utils.slot(list-item-supporting-text-size, $fallbacks);
  color: var(--mat-list-list-item-supporting-text-color, rgba(0, 0, 0, 0.6));
  line-height: 1.4;
}

.mat-mdc-list-item-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; }
.mat-mdc-list-item-icon { width: 24px; height: 24px; }
.mat-mdc-list-item-meta { font-size: 12px; color: var(--mat-list-list-item-supporting-text-color, rgba(0, 0, 0, 0.6)); }

.mat-mdc-list-item:has(> .mat-mdc-list-item-line) { min-height: 64px; padding: 8px 16px; }
.mat-mdc-list-item:has(> .mat-mdc-list-item-line ~ .mat-mdc-list-item-line) { min-height: 88px; }

a.mat-mdc-list-item {
  color: inherit;
  text-decoration: none;
}

button.mat-mdc-list-item {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: inherit;
  font: inherit;

  &:disabled { cursor: default; }
}
```

Actual token references reconciled against compiled CSS at Task 2 (iterative loop — precedent from every prior port).

**New `list-prebuilt.scss`:**

```scss
@use './list';

:root {
  --mat-list-list-item-label-text-color: rgba(0, 0, 0, 0.87);
  --mat-list-list-item-supporting-text-color: rgba(0, 0, 0, 0.6);
  // Additional --mat-* tokens discovered during Task 2 reconciliation.
}
```

**No `@use '../cdk-stub' as cdk` needed.** Verified at Task 2 via `grep '@angular/cdk' src/material/list/*.scss`. If a hidden reference surfaces, apply the established rewrite pattern (badge/toolbar/dialog/progress-bar/progress-spinner precedent).

**Stub inventory delta:** none (assuming Task 2 grep clean).

## 5. Deviations catalog

10 numbered deviations documented in SYNC.md at Task 12.

1. **Ripple system removed entirely.** Upstream `MatListItemBase` integrates `RippleRenderer` + `MAT_RIPPLE_GLOBAL_OPTIONS` + `RippleTarget`. Consumers who want tap feedback style `:active` / `:focus-visible` themselves.

2. **`@ContentChildren` line-count JS removed.** Upstream `_updateItemLines` + `cdkObserveContent` inspect projected content on every mutation. Replaced by CSS `:has()` selectors — reacts naturally, zero JS, SSR-safe. Depends on browsers that ship `:has()` (Baseline Late 2023 — Chrome ≥ 105, Safari ≥ 15.4, Firefox ≥ 121).

3. **`AfterViewInit` / `OnDestroy` lifecycle removed.** No lifecycle work needed — port is pure `component$`(props) → JSX.

4. **`NgZone` + `Platform` dependencies removed.** Only used by ripple + line-count observer.

5. **Focus indicator `<div class="mat-focus-indicator">` removed.** Upstream renders it for CDK focus-indicator; we don't ship that stack. Browser-default `:focus-visible` outline on `<a>` / `<button>` variants.

6. **`MAT_LIST` and `MAT_NAV_LIST` DI tokens removed.** Nothing in the display-list scope reads them. Family-shape config ships as `MAT_LIST_CONFIG`.

7. **`_list-inherited-structure.scss` (477 LOC) dropped entirely.** MDC flex-positioning + ripple hooks + state layer + activated gradients. Replaced by CSS-grid rewrite of `list.scss`.

8. **`MatListSubheaderCssMatStyler` (upstream `[matSubheader]` directive) → `MatSubheader` custom-element component.** Angular directive pattern doesn't map cleanly to Qwik. CSS class hooks preserved.

9. **Slot directives (`[matListItemAvatar]` / `[matListItemIcon]` / `[matListItemTitle]` / `[matListItemLine]` / `[matListItemMeta]`) replaced with 5 wrapper components.** Same reasoning. No `q:slot` required from consumer since CSS grid places by class regardless of DOM order.

10. **Angular-specific removals:**
   - `@Input()` + `BooleanInput`/`NumberInput` coercion — replaced by TypeScript types + inline defaults.
   - `signal()` for reactive disabled — plain prop consumed each render.
   - `Directive` scaffolding + `MatListBase` / `MatListItemBase` abstract classes — collapsed to plain `component$`.
   - `exportAs: 'matList' / 'matListItem' / ...` — Angular template-ref concept, N/A.
   - Host bindings (`[attr.aria-disabled]`, `[attr.disabled]`, `[attr.aria-current]`, `[class.mdc-list-item--*]`) — plain JSX attribute passthrough.
   - `providers: [{provide: MatListBase, useExisting: MatList}]` — no Angular DI graph.
   - `<ng-content select="mat-divider">` slot inside `MatListItem` — dropped; consumers place `<MatDivider />` between items.

**Removed upstream files:**
- `list-module.ts` — Qwik has no module concept.
- `testing/` — Angular test harness surface; no equivalent needed.
- Upstream `public-api.ts` — replaced with our own re-export shape.
- `list.spec.ts` (650 LOC) — ported to `mat-list-scenarios.spec.tsx` per smoke-only vitest constraint.
- `list-base.ts` (350 LOC) — MatListBase + MatListItemBase abstract classes; replaced by plain `component$` wrappers.
- `list-option.ts`, `list-option.html`, `list-option.scss`, `list-option-types.ts` — MatListOption is selection-list territory, out of scope.
- `selection-list.ts` (482 LOC), `selection-list.spec.ts` (1970 LOC) — future dedicated port.
- `tokens.ts` — inlined via SCSS token references.
- `_list-inherited-structure.scss` — replaced by CSS-grid rewrite.

## 6. Test strategy

### 6.1 Vitest — `mat-list-scenarios.spec.tsx`

Smoke-only (no `createDOM(<component$/>)`). 19 `it()` blocks:

**7 live sanity:**
1. All 10 components exported and function-shaped.
2. `MAT_LIST_CONFIG.id === 'qwik-material/list-config'`.
3. Empty `MatListConfig` accepts `{}`.
4. `MatListProps` + `MatNavListProps` + `MatActionListProps` accept aria + role + disabled + class + id.
5. `MatListItemProps` accepts `as` / `href` / `activated` / `disabled` + aria + role + class + id.
6. `MatSubheaderProps` accepts aria + class + id.
7. `MatListItemSectionProps` accepts class + id (shared by all 5 slot components).

**8 describe.skip DOM stubs** (deferred to Playwright Task 11, each with a `see routes/mat-list/<name>` pointer):
1. `MatList` renders `<mat-list>` with class ladder + role passthrough.
2. `MatNavList` renders `<mat-nav-list role="navigation">`.
3. `MatActionList` renders `<mat-action-list role="group">`.
4. `MatListItem` polymorphism — `as='div'` → `<mat-list-item>`; `as='a' href='/foo'` → `<a href="/foo">`; `as='button'` → `<button>`.
5. `MatListItem activated` on `<a>` emits `aria-current="page"`; on `<div>` does not.
6. Slot components render `<div>` with expected class hooks.
7. CSS grid layout — avatar left, title/lines center, meta right.
8. `:has()` line-count sizing — 1/2/3 lines → 48/64/88px min-height.

**4 describe.skip Angular-only stubs** (deferred forever per §5):
1. `BooleanInput` / `NumberInput` coercion.
2. `@ContentChildren` QueryList + `_updateItemLines` + `cdkObserveContent`.
3. `MatListBase` / `MatListItemBase` inheritance chain.
4. Ripple / focus-manager / MDC state layer.

Expected: **7 pass + 12 skip = 19 total**. Full suite target after this task ≈ **219 pass** (baseline post-grid-list = 212 + this task's live contribution).

### 6.2 Dev-app routes (8 under `src/qwik-cdk-dev-app/src/routes/mat-list/`)

1. `basic/` — `<MatList>` with 4 items, each title only. Baseline single-line rendering.
2. `two-line/` — 3 items with title + one line. Verifies `:has()` 64px sizing.
3. `three-line/` — 3 items with title + two lines. Verifies `:has()` 88px sizing.
4. `avatar/` — 3 items with avatar + title + line. Grid-column-1 placement.
5. `icon-meta/` — 3 items with icon + title + meta. Grid-column-3 placement + icon size.
6. `nav/` — `<MatNavList>` with 3 `<MatListItem as='a' href>`, one `activated`. Anchor + `aria-current="page"`.
7. `action/` — `<MatActionList>` with 3 `<MatListItem as='button'>`, one disabled. Button + `disabled` attribute.
8. `with-subheader/` — mixed layout: subheader + 2 items + `<MatDivider />` + subheader + 2 items.

### 6.3 Playwright specs (8 under `src/qwik-cdk-parity-tests/specs/material-list/`)

Locators: `page.locator('mat-list')`, `page.locator('mat-list-item')`, `page.locator('mat-nav-list')`, `page.locator('mat-action-list')`, `page.locator('mat-subheader')` for custom-element tags. `page.locator('a.mat-mdc-list-item')` / `page.locator('button.mat-mdc-list-item')` for the polymorphic-item variants where the host tag isn't `mat-list-item`.

- **basic.spec.ts** — `<mat-list>` with `role="list"`, 4 items, `min-height ≈ 48px` (±3px).
- **two-line.spec.ts** — item `min-height ≈ 64px`.
- **three-line.spec.ts** — item `min-height ≈ 88px`.
- **avatar.spec.ts** — avatar at grid column 1 (leftmost); title right of it; `border-radius: 50%`.
- **icon-meta.spec.ts** — meta at grid column 3 (rightmost); icon size ≈ 24px.
- **nav.spec.ts** — 3 `<a class="mat-mdc-list-item">`, activated has `aria-current="page"`.
- **action.spec.ts** — 3 `<button class="mat-mdc-list-item">`, disabled has `disabled` attribute + `aria-disabled="true"` + `opacity: 0.38`.
- **with-subheader.spec.ts** — 2 subheaders + 1 divider + 4 items in correct DOM order.

## 7. Task decomposition

12 tasks. Every commit uses scope `multiple` per branch convention.

| # | Task | Deliverable |
|---|---|---|
| 1 | Wire entry-point | `package.json` `./list` + `./list-prebuilt.css`; `vite.config.ts` entries + sassEntries; `intrinsic-elements.d.ts` for 5 custom tags typed as `QwikIntrinsicElements['div']`; empty `index.ts`. |
| 2 | Copy + rewrite SCSS | 4 partials byte-identical; DROP `_list-inherited-structure.scss`; new rewritten `list.scss` (~80 LOC); new `list-prebuilt.scss`. Iterative reconciliation. Verify no cdk refs. |
| 3 | Config token | `list-config.ts` + smoke spec (2 it()). |
| 4 | Container variants | `mat-list.tsx` — 4 components in one file (MatList, MatNavList, MatActionList, MatSubheader). Smoke spec (4 it()). |
| 5 | `MatListItem` | `mat-list-item.tsx` — polymorphic `as` prop. Smoke spec (1 it()). |
| 6 | 5 slot components | `mat-list-item-sections.tsx` — Avatar, Icon, Title, Line, Meta. Smoke spec (5 it()). |
| 7 | Extend `QwikMaterialProvider` | 12th `useContextProvider` after `MAT_GRID_LIST_CONFIG`. Purely additive. 3 provider specs. |
| 8 | `public-api.ts` + build validation | 18 exports; replace Task 1 stub. `dist/list/public-api.d.ts` clean. |
| 9 | Vitest scenario port | 19 it() per §6.1. Full suite target ≈ 219 pass. |
| 10 | Dev-app routes | 8 routes per §6.2. `root.tsx` += `list-prebuilt.css`. Manifest = exactly 8 `mat-list` routes. |
| 11 | Playwright specs | 8 specs per §6.3. All use tag or `<tag>.mat-mdc-list-item` locators. |
| 12 | SYNC.md + pipeline verification | 10 deviations per §5, sync-state table (~10-11 rows), header referencing 10 prior port SYNC.md companions. `pnpm test:qwik-material` exit 0. |

## 8. Global constraints

- **Commit hook scope:** `multiple` on every commit.
- **Zero exported classes** in `src/qwik-material/list/`.
- **Zero SSR globals** (`document`, `window`, `navigator`, `getComputedStyle`, `requestAnimationFrame`) outside `.spec.tsx`.
- **Zero `@builder.io/qwik/build` `isBrowser` imports.**
- **Every `useContext` call carries a defaults fallback** (Progress Bar / Progress Spinner lesson).
- **Custom-element tag names must match upstream selectors** — `<mat-list>`, `<mat-nav-list>`, `<mat-action-list>`, `<mat-list-item>`, `<mat-subheader>`.
- **No `useVisibleTask$`** — pure `component$`(props) → JSX for all 10 components.
- **No `--no-verify`, no hook bypass.**
- **Pipeline gate at Task 12:** `pnpm test:qwik-material` exit 0 across build + vitest + lint-no-ssr-leaks + typecheck.
