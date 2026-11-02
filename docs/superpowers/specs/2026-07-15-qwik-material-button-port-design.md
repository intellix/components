# qwik-material Button port — design spec

Port `src/material/button/` into a `qwik-material/button` entry-point that consumes qwik-cdk. Second component after Dialog; validates the "small, purely visual, no-lifecycle" component path in the same package.

- **Upstream source:** `src/material/button/` (11 TS files, 14 SCSS files, 561-line spec).
- **New entry-point:** `@angular-community/qwik-material/button` at `src/qwik-material/button/`.
- **New prebuilt CSS:** `@angular-community/qwik-material/button-prebuilt.css`.
- **Branch:** `qwik-cdk-dialog-port` (same working branch as dialog port; renamed later if needed).
- **Base commit:** the tip of the dialog port at spec-write time.

---

## 1. Package layout

Under `src/qwik-material/`:

```
button/
  button-config.ts              — MatButtonConfig + MAT_BUTTON_CONFIG token
  button-appearance.ts          — MatButtonAppearance type + APPEARANCE_CLASSES constant
  mat-button.tsx                — <MatButton>
  mat-icon-button.tsx           — <MatIconButton>
  mat-fab-button.tsx            — <MatFabButton>
  mat-mini-fab-button.tsx       — <MatMiniFabButton>
  internal/
    persistent-ripple.tsx       — <PersistentRipple isFab>
    focus-indicator.tsx         — <FocusIndicator>
    touch-target.tsx            — <TouchTarget>
  public-api.ts                 — re-exports
  index.ts                      — `export * from './public-api'`
  SYNC.md                       — deviation log
  <spec>.spec.ts / .spec.tsx    — one per component
scss/
  button/
    button.scss                 — verbatim copy of src/material/button/button.scss
    fab.scss                    — verbatim copy
    icon-button.scss            — verbatim copy
    button-high-contrast.scss   — verbatim copy
    _button-base.scss           — verbatim copy
    _m2-button.scss, _m3-button.scss, _button-theme.scss  — verbatim
    _m2-fab.scss, _m3-fab.scss, _fab-theme.scss           — verbatim
    _m2-icon-button.scss, _m3-icon-button.scss,
    _icon-button-theme.scss     — verbatim
    button-prebuilt.scss        — NEW: @use the four structural + :root defaults
  <stubs>/ …                     — any additional stubs the button chain needs
                                    (reuses dialog port's stubs where possible)
```

Existing files reused from dialog port (no changes):
- `package.json` (add one export entry for `./button` + one for `./button-prebuilt.css`)
- `tsconfig.json`, `vite.config.ts` (extend `entries` array), `vitest.setup.ts`, `_index.scss`
- `scripts/lint-no-ssr-leaks.mjs`
- `scss/core/**` stubs (dialog created 16; button re-uses most)

**qwik-cdk-dev-app changes:**
- `src/root.tsx`: add `import '@angular-community/qwik-material/button-prebuilt.css';`
- `src/routes/index.tsx`: add a "Buttons" section listing the 16 new routes
- `src/routes/mat-button/<name>/index.tsx`: 16 new route files

**qwik-cdk-parity-tests changes:**
- `specs/material-button/`: 16 new spec files, one per dev-app route

---

## 2. Public API surface

Everything the consumer sees. No exported classes; matches the constraint set for the dialog port.

### 2.1 Types

```ts
export type MatButtonAppearance = 'text' | 'filled' | 'elevated' | 'outlined' | 'tonal';
export type MatButtonColor = 'primary' | 'accent' | 'warn';

export interface MatButtonConfig {
  /** Applied to buttons that don't set an explicit `color` prop. */
  color?: MatButtonColor | null;
  /** Applied when a MatButton doesn't set an explicit `disabledInteractive` prop. */
  disabledInteractive?: boolean;
  /** Default appearance for `<MatButton>` (not applied to icon/fab variants). */
  defaultAppearance?: MatButtonAppearance;
}

export const MAT_BUTTON_CONFIG: ContextId<MatButtonConfig>;
```

### 2.2 Components

```ts
export interface MatButtonProps {
  appearance?: MatButtonAppearance;
  color?: MatButtonColor;
  disabled?: boolean;
  disableRipple?: boolean;
  disabledInteractive?: boolean;
  href?: string;                                  // when set, renders <a>; otherwise <button>
  type?: 'button' | 'submit' | 'reset';           // native <button> type; ignored for anchor
  onClick$?: QRL<(e: MouseEvent) => void>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  id?: string;
  class?: string | ReadonlyArray<string>;          // merged with the component's own classes
  // Any additional HTML attributes are passed through via {...rest}.
}
export const MatButton: Component<MatButtonProps>;

export interface MatIconButtonProps {
  // Same as MatButtonProps but WITHOUT `appearance` (icon button has one appearance).
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
export const MatIconButton: Component<MatIconButtonProps>;

export interface MatFabProps {
  extended?: boolean;                              // FAB only; ignored for mini-FAB
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
export const MatFabButton: Component<MatFabProps>;

export interface MatMiniFabProps extends Omit<MatFabProps, 'extended'> {}
export const MatMiniFabButton: Component<MatMiniFabProps>;
```

### 2.3 QwikMaterialProvider extension

The existing `QwikMaterialProvider` (from the dialog port) gains one new optional prop:

```ts
export interface QwikMaterialProviderProps {
  matDialogDefaults?: Partial<MatDialogConfig>;              // existing
  matDialogScrollStrategyFactory?: () => ScrollStrategy;     // existing
  animationsDisabled?: boolean;                              // existing
  matButtonConfig?: MatButtonConfig;                         // NEW
}
```

If `matButtonConfig` is set, the provider installs `MAT_BUTTON_CONFIG` in the same tree the dialog config uses. Buttons outside a provider get the built-in defaults (`{color: null, disabledInteractive: false, defaultAppearance: 'text'}`).

### 2.4 Public API file layout

`button/public-api.ts`:
```ts
export type {MatButtonAppearance, MatButtonColor} from './button-appearance';
export type {MatButtonConfig} from './button-config';
export {MAT_BUTTON_CONFIG} from './button-config';
export {MatButton, type MatButtonProps} from './mat-button';
export {MatIconButton, type MatIconButtonProps} from './mat-icon-button';
export {MatFabButton, type MatFabProps} from './mat-fab-button';
export {MatMiniFabButton, type MatMiniFabProps} from './mat-mini-fab-button';
```

`button/index.ts`:
```ts
export * from './public-api';
```

---

## 3. Internal architecture

### 3.1 Appearance-class map

`button-appearance.ts`:
```ts
export const APPEARANCE_CLASSES: Record<MatButtonAppearance, readonly string[]> = {
  'text':     ['mat-mdc-button'],
  'filled':   ['mdc-button--unelevated', 'mat-mdc-unelevated-button'],
  'elevated': ['mdc-button--raised',     'mat-mdc-raised-button'],
  'outlined': ['mdc-button--outlined',   'mat-mdc-outlined-button'],
  'tonal':    ['mat-tonal-button'],
};
```

Byte-equivalent to upstream `button.ts` line 16–22 with the Map converted to a plain object (`Record<>`) for zero-runtime lookup and easier serialization.

### 3.2 MatButton reference implementation

```tsx
// mat-button.tsx
import {component$, Slot, useContext, $, type QRL} from '@builder.io/qwik';
import {APPEARANCE_CLASSES, type MatButtonAppearance, type MatButtonColor} from './button-appearance';
import {MAT_BUTTON_CONFIG} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';

export interface MatButtonProps { /* …see §2.2… */ }

const DEFAULTS = {color: null, disabledInteractive: false, defaultAppearance: 'text' as const};

export const MatButton = component$<MatButtonProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const appearance = props.appearance ?? config.defaultAppearance ?? 'text';
  const color = props.color ?? config.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = props.disabled && !disabledInteractive;

  const classes = [
    'mat-mdc-button-base',
    'mdc-button',
    ...APPEARANCE_CLASSES[appearance],
    color ? `mat-${color}` : 'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    disabledInteractive && 'mat-mdc-button-disabled-interactive',
    props.disableRipple && 'mat-mdc-button-ripple-disabled',
    props.class,
  ].filter(Boolean);

  const preventDisabledClick$ = $((e: MouseEvent) => {
    if (props.disabled) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    props.onClick$?.(e);
  });

  if (isAnchor) {
    return (
      <a
        href={props.href}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled || undefined}
        aria-label={props.ariaLabel}
        aria-describedby={props.ariaDescribedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
      >
        <PersistentRipple isFab={false} />
        <span class="mdc-button__label"><Slot /></span>
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
      aria-disabled={disabledInteractive ? true : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
    >
      <PersistentRipple isFab={false} />
      <span class="mdc-button__label"><Slot /></span>
      <FocusIndicator />
      <TouchTarget />
    </button>
  );
});
```

### 3.3 MatIconButton reference implementation

Same shape as MatButton, but:
- No `appearance` prop
- `class` host adds `mdc-icon-button mat-mdc-icon-button` (not `mdc-button`)
- No `<span class="mdc-button__label">` wrapper — icon goes directly in default `<Slot />`
- `<PersistentRipple isFab={false} />` still emitted (upstream uses same span structurally; centered variant handled by CSS)

### 3.4 MatFabButton reference implementation

- Host classes: `mdc-fab mat-mdc-fab-base mat-mdc-fab` + conditional `mdc-fab--extended mat-mdc-extended-fab` when `props.extended === true`
- `<PersistentRipple isFab={true} />`
- `<span class="mdc-button__label"><Slot /></span>` retained (extended FAB shows label; normal FAB just holds an icon slot)
- Default `color` falls back to `'accent'` when neither prop nor config sets it, matching upstream `fab.ts` line 84–90

### 3.5 MatMiniFabButton reference implementation

Same as MatFabButton but:
- Host classes: `mdc-fab mat-mdc-fab-base mdc-fab--mini mat-mdc-mini-fab`
- No `extended` prop
- Same default-`accent` behaviour

### 3.6 Internal helper components

`internal/persistent-ripple.tsx`:
```tsx
export const PersistentRipple = component$<{isFab: boolean}>(({isFab}) => (
  <span
    class={['mat-mdc-button-persistent-ripple', isFab ? 'mdc-fab__ripple' : 'mdc-button__ripple']}
  />
));
```

`internal/focus-indicator.tsx`:
```tsx
export const FocusIndicator = component$(() => <span class="mat-focus-indicator" />);
```

`internal/touch-target.tsx`:
```tsx
export const TouchTarget = component$(() => <span class="mat-mdc-button-touch-target" />);
```

Each is ≤10 LOC and keeps the four button components under ~60 LOC of JSX apiece.

### 3.7 Config token

`button-config.ts`:
```ts
import {createContextId} from '@builder.io/qwik';
export interface MatButtonConfig { /* …see §2.1… */ }
export const MAT_BUTTON_CONFIG = createContextId<MatButtonConfig>('qwik-material/button-config');
```

Plain data — no `NoSerialize` needed. The type is serializable-safe.

---

## 4. SSR safety

Every button component is 100% pure JSX from props/context:

- No `document.*` / `window.*` / `navigator.*` access
- No `useVisibleTask$`
- No `useSignal` or `useStore` inside any button (state lives in the consumer)
- The `preventDisabledClick$` QRL closes over `props.disabled` + `props.onClick$` — both serializable

The `scripts/lint-no-ssr-leaks.mjs` check should report zero violations across the entire `button/` folder without any `// ssr-leak-ok:` opt-outs.

SSR emits the exact same DOM tree the client hydrates, including all class names and ARIA attributes. Hydration is a no-op event listener attachment on `onClick$`.

---

## 5. Reactivity

Props flow through directly. Any Qwik signal passed as a prop causes a re-render when its `.value` changes because the JSX reads `props.disabled` etc. on every render pass. No manual `useTask$` needed.

Config from `MAT_BUTTON_CONFIG` is read via `useContext(MAT_BUTTON_CONFIG, DEFAULTS)`. If the consumer changes the config, the tree re-renders; buttons pick up the new defaults. Standard Qwik context behaviour.

---

## 6. CSS delivery

### 6.1 Prebuilt entry

`src/qwik-material/scss/button/button-prebuilt.scss`:
```scss
@use './button';
@use './fab';
@use './icon-button';
@use './button-high-contrast';

// Minimal Material Design 3 defaults so a bare consumer sees a themed button.
// Values sourced from @angular/material/button M3 tokens. Every value can be
// overridden by the consumer at :root or on any ancestor of the button.
:root {
  // Common
  --mat-sys-primary: #6750a4;
  --mat-sys-on-primary: #ffffff;
  --mat-sys-surface: #fef7ff;
  --mat-sys-on-surface: rgba(0, 0, 0, 0.87);
  --mat-sys-outline: rgba(0, 0, 0, 0.12);

  // Text button
  --mdc-text-button-container-height: 40px;
  --mdc-text-button-container-shape: 20px;
  --mdc-text-button-label-text-color: var(--mat-sys-primary);
  --mdc-text-button-label-text-font: Roboto, "Helvetica Neue", sans-serif;
  --mdc-text-button-label-text-size: 0.875rem;
  --mdc-text-button-label-text-weight: 500;
  --mdc-text-button-label-text-tracking: 0.0892857143em;
  --mdc-text-button-disabled-label-text-color: rgba(0, 0, 0, 0.38);

  // Filled button
  --mdc-filled-button-container-color: var(--mat-sys-primary);
  --mdc-filled-button-label-text-color: var(--mat-sys-on-primary);
  --mdc-filled-button-container-height: 40px;
  --mdc-filled-button-container-shape: 20px;
  --mdc-filled-button-disabled-container-color: rgba(0, 0, 0, 0.12);
  --mdc-filled-button-disabled-label-text-color: rgba(0, 0, 0, 0.38);

  // Elevated (protected in MDC)
  --mdc-protected-button-container-color: var(--mat-sys-surface);
  --mdc-protected-button-label-text-color: var(--mat-sys-primary);
  --mdc-protected-button-container-height: 40px;
  --mdc-protected-button-container-shape: 20px;
  --mdc-protected-button-container-elevation-shadow:
    0 3px 1px -2px rgba(0, 0, 0, 0.2),
    0 2px 2px 0   rgba(0, 0, 0, 0.14),
    0 1px 5px 0   rgba(0, 0, 0, 0.12);
  --mdc-protected-button-disabled-container-color: rgba(0, 0, 0, 0.12);
  --mdc-protected-button-disabled-label-text-color: rgba(0, 0, 0, 0.38);

  // Outlined
  --mdc-outlined-button-outline-color: var(--mat-sys-outline);
  --mdc-outlined-button-label-text-color: var(--mat-sys-primary);
  --mdc-outlined-button-container-height: 40px;
  --mdc-outlined-button-container-shape: 20px;
  --mdc-outlined-button-outline-width: 1px;
  --mdc-outlined-button-disabled-outline-color: rgba(0, 0, 0, 0.12);
  --mdc-outlined-button-disabled-label-text-color: rgba(0, 0, 0, 0.38);

  // Tonal (Mat-specific)
  --mat-tonal-button-container-color: #eaddff;
  --mat-tonal-button-label-text-color: #21005d;

  // FAB
  --mdc-fab-container-color: var(--mat-sys-primary);
  --mdc-fab-container-shape: 16px;
  --mdc-fab-container-elevation-shadow:
    0 3px 5px -1px rgba(0, 0, 0, 0.2),
    0 6px 10px 0   rgba(0, 0, 0, 0.14),
    0 1px 18px 0   rgba(0, 0, 0, 0.12);
  --mdc-fab-icon-color: var(--mat-sys-on-primary);
  --mdc-fab-icon-size: 24px;

  // Icon button
  --mdc-icon-button-icon-color: var(--mat-sys-on-surface);
  --mdc-icon-button-icon-size: 24px;
  --mdc-icon-button-state-layer-size: 40px;

  // State layer opacities (govern the ripple-lite hover/focus/press feedback)
  --mat-mdc-button-persistent-ripple-color: currentColor;
  --mat-mdc-button-ripple-color: currentColor;
}
```

### 6.2 Vite plumbing

`vite.config.ts` gains one entry pair:
```ts
const entries = ['dialog', 'button'];
// …
const sassEntries: [string, string][] = [
  ['scss/dialog/dialog-prebuilt.scss', 'dist/dialog-prebuilt.css'],
  ['scss/button/button-prebuilt.scss', 'dist/button-prebuilt.css'],   // NEW
];
```

`package.json` gains two export entries:
```json
"./button": {
  "qwik": "./button/index.ts",
  "types": "./dist/button/index.d.ts",
  "import": "./dist/button/index.js"
},
"./button-prebuilt.css": "./dist/button-prebuilt.css",
```

### 6.3 SCSS stub reuse

The dialog port created 16 stubs under `scss/core/**` (m2-utils, m3-utils, token-utils, sass-utils, elevation, private, inspection, etc.). The button SCSS chain almost certainly `@use`s the same paths. Stubs already present are reused as-is.

Task-3-of-dialog-style iterative stubbing loop:
1. Copy the button SCSS files verbatim
2. Run `pnpm -C src/qwik-material build`
3. Read the first Sass error
4. Either add a symbol to an existing stub OR create a new stub file
5. Repeat until `dist/button-prebuilt.css` emits successfully with `>50` matches of `mat-mdc-button`

Cap at ~10 iterations before flagging. Any new stub carries the same `// STUB: …` header pointing at the (shared) `SYNC.md`.

### 6.4 Ripple-lite

No new SCSS is written for ripple-lite. Upstream's `button.scss` / `fab.scss` / `icon-button.scss` already emit the `.mat-mdc-button-persistent-ripple::before` pseudo-element and its `opacity` transitions driven by `:hover` / `:focus-visible` / `:active`. The `<span class="mat-mdc-button-persistent-ripple">` element in our template gives those rules their target. The JS ripple loader that upstream lazily instantiates would provide the click-position-aware circle animation on top of that; we skip that layer entirely.

---

## 7. Testing strategy

### 7.1 Vitest scenarios (~55 tests)

Ported from `src/material/button/button.spec.ts` (561 LOC, ~60 upstream `it` blocks):

- **Appearance class binding** (5): each appearance sets the correct classes on the host
- **Color palette classes** (4): none / primary / accent / warn produce `mat-unthemed` or `mat-<color>`
- **Disabled** (6): `disabled` prop sets `disabled` attr on button, `tabindex=-1` on anchor, `.mat-mdc-button-disabled` class always
- **disabledInteractive** (4): sets `aria-disabled`, keeps focus reachable, keeps clicks reachable, does NOT set native `disabled`
- **disableRipple** (2): toggles `.mat-mdc-button-ripple-disabled` class
- **href switches tag** (4): with-href renders `<a>`; without renders `<button>`
- **Anchor disabled-click preventer** (2): click on disabled anchor calls `preventDefault` + `stopImmediatePropagation`
- **Icon button** (4): distinct host classes, no `mdc-button__label` wrapper, centered ripple class
- **FAB** (5): default color is accent, `extended` toggle, correct host classes
- **Mini-FAB** (3): distinct host classes, no `extended` prop
- **Config context propagation** (6): `MAT_BUTTON_CONFIG.defaultAppearance` / `color` / `disabledInteractive` flow to buttons without explicit props
- **Prop reactivity** (5): signal-backed props re-render the correct class list
- **Class list snapshot per variant** (5): freeze expected class list per component

Skipped upstream tests (documented in SYNC.md):

- **Renderer2 / NgZone specifics** (~5): Angular-only
- **JS ripple** (~8): deferred with `describe.skip('ripple JS animation — deferred to qwik-cdk/MatRipple', …)`
- **FocusMonitor origin discrimination** (~4): deferred with `describe.skip('mouse-vs-keyboard focus origin — deferred', …)`

### 7.2 Dev-app routes (15)

Under `src/qwik-cdk-dev-app/src/routes/mat-button/`:

| Route                    | Renders                                                         |
|--------------------------|-----------------------------------------------------------------|
| `text/`                  | `<MatButton>Text</MatButton>`                                   |
| `filled/`                | `<MatButton appearance="filled">Filled</MatButton>`             |
| `elevated/`              | `<MatButton appearance="elevated">Elevated</MatButton>`         |
| `outlined/`              | `<MatButton appearance="outlined">Outlined</MatButton>`         |
| `tonal/`                 | `<MatButton appearance="tonal">Tonal</MatButton>`               |
| `text-link/`             | `<MatButton href="/about">Text link</MatButton>`                |
| `filled-link/`           | `<MatButton appearance="filled" href="/about">Filled link</MatButton>` |
| `disabled/`              | `<MatButton disabled>Disabled</MatButton>`                      |
| `disabled-interactive/`  | `<MatButton disabled disabledInteractive>Disabled interactive</MatButton>` |
| `color-primary/`         | `<MatButton color="primary" appearance="filled">Primary</MatButton>` |
| `color-accent/`          | `<MatButton color="accent" appearance="filled">Accent</MatButton>` |
| `color-warn/`            | `<MatButton color="warn" appearance="filled">Warn</MatButton>`  |
| `icon-button/`           | `<MatIconButton aria-label="Menu"><Menu icon/></MatIconButton>` |
| `fab/`                   | `<MatFabButton>+</MatFabButton>`                                |
| `fab-extended/`          | `<MatFabButton extended>+  New</MatFabButton>`                  |
| `mini-fab/`              | `<MatMiniFabButton>+</MatMiniFabButton>`                        |

Each route renders `<main data-scenario-ready>ready</main>` after the button mounts so Playwright can wait deterministically.

The dev-app's `src/routes/index.tsx` gets a new "Buttons" `<section>` listing all 16 routes; the existing "Dialogs" section is preserved.

### 7.3 Playwright parity specs (15)

Under `src/qwik-cdk-parity-tests/specs/material-button/`, one spec per dev-app route, following the same template as the material-dialog specs:

```ts
test('material button — text', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/text/`);
  await page.waitForSelector('[data-scenario-ready]');
  const button = page.locator('.mat-mdc-button-base');
  await expect(button).toBeVisible();
  await expect(button).toHaveClass(/mat-mdc-button/);
  await expect(button).toHaveClass(/mdc-button/);
  await expect(button).toHaveText('Text');
  await expect(button).not.toHaveClass(/mat-mdc-button-disabled/);
});
```

Structural DOM assertions rather than full-page snapshots. Angular parity comparison is deferred (same caveat as the dialog specs — Angular dev-app URL mapping requires manual coordination).

---

## 8. Deviations from upstream

Recorded in `src/qwik-material/button/SYNC.md`:

1. **No JS ripple.** CSS-only state layer via existing MDC persistent-ripple SCSS. Follow-up: port `MatRipple` as a first-class qwik-cdk primitive, then wire buttons through it.
2. **No FocusMonitor integration.** `:focus-visible` covers the common case (state layer only lights up for keyboard focus, not mouse). Follow-up: consume `useFocusMonitor` when we have a use-case that discriminates mouse / keyboard / program focus.
3. **No `showProgress` + `[progressIndicator]` slot.** Deferred per user scope decision on 2026-07-15.
4. **No icon-position slot.** No dedicated `<Slot name="icon"/>` before or `<Slot name="icon-end"/>` after the label. Consumers place icons in the default slot (before or after any text) at v1.
5. **No `tabIndex` prop.** Qwik JSX forwards `tabIndex` as a standard HTML attribute; consumers can set it directly on the component and it flows through to the rendered `<button>` / `<a>` via the JSX spread.
6. **No `MatAnchor` / `MatIconAnchor` / `MatFabAnchor` / `MatMiniFabAnchor` type aliases.** Upstream declares them as `const X = Y; type X = Y;` for the anchor form; that pattern doesn't map to Qwik's single-render component model. Anchor form is opt-in via `href`.
7. **`_isFab` / `_isAnchor` internal fields not exposed.** Upstream keeps them protected on `MatButtonBase`; qwik-material's split-into-4-components architecture makes them redundant.
8. **`MAT_FAB_DEFAULT_OPTIONS` folded into `MAT_BUTTON_CONFIG`.** Upstream has a separate injection token for FAB's default color. Qwik-material collapses this into the single `MatButtonConfig.color` field (already applied to all four components).
9. **Config-provided `color` is now a top-level `QwikMaterialProviderProps.matButtonConfig` field rather than a distinct provider.** Consistent with the dialog port's pattern of gathering component defaults on the single provider.
10. **No `_animationsDisabled` runtime propagation to `.mat-animation-noopable` class.** The dialog port's `useAnimationsDisabled()` helper is available; we just don't consume it in button v1 since the ripple-lite state layer transitions can be turned off globally via `prefers-reduced-motion: reduce` CSS. Follow-up if that turns out to be insufficient.

---

## 9. Success criteria (final self-check at end of port)

- `pnpm test:qwik-material` chain still green (build + vitest + lint + typecheck), including button coverage
- `pnpm -C src/qwik-material vitest button` reports the target ~55 passing + ~17 skipped tests
- Every button variant in the dev-app (`/mat-button/*`) renders with visible M3 styling in preview mode
- `pnpm -C src/qwik-material lint:no-ssr-leaks` reports zero violations
- 0 exported classes on the consumer surface (`grep -E "^export class" src/qwik-material/button/**/*.ts` returns nothing)
- Playwright material-button specs pass locally against the built dev-app preview
- `src/qwik-material/button/SYNC.md` populated with all 10 deviations + stub inventory delta

---

## 10. Task decomposition preview

The implementation plan (next skill) will split the work into roughly the following phases; sizing based on the dialog port's 20-task plan:

- **Phase 1 — Scaffolding** (1 task): extend vite.config entries + package.json exports; empty `button/index.ts` stub so the build succeeds
- **Phase 2 — SCSS chain** (1 task): copy 14 SCSS files, stub loop, emit `button-prebuilt.css`, add M3 :root defaults
- **Phase 3 — Foundation types** (2 tasks): `button-config.ts` + `button-appearance.ts`
- **Phase 4 — Internal components** (1 task): `<PersistentRipple>`, `<FocusIndicator>`, `<TouchTarget>`
- **Phase 5 — Button components** (4 tasks): `<MatButton>`, `<MatIconButton>`, `<MatFabButton>`, `<MatMiniFabButton>` — one task each, each with its spec
- **Phase 6 — Provider extension** (1 task): extend `QwikMaterialProvider` with `matButtonConfig`
- **Phase 7 — Public API + build validation** (1 task): `public-api.ts`, `index.ts`, full build
- **Phase 8 — Scenario tests** (1 task): port scenarios from upstream `button.spec.ts`
- **Phase 9 — Dev-app** (2 tasks): scaffold routes 1–8, then routes 9–16 + index tile
- **Phase 10 — Playwright parity** (1 task): 16 material-button parity specs
- **Phase 11 — Finalisation** (1 task): SYNC.md updates, root `pnpm test:qwik-material` re-run, docs

Rough total: 16 tasks. Smaller than the dialog port (20 tasks) because there's no lifecycle / ref / overlay integration, and the scaffolding already exists.

---

## 11. Out of scope for this port

Explicitly not planned for this iteration; documented so future maintainers don't chase them:

- JS ripple (deferred to qwik-cdk MatRipple primitive)
- FocusMonitor integration (deferred until needed)
- `showProgress` + progress indicator slot (deferred per scope decision)
- Icon-position slot (`iconPositionEnd` variant) (deferred)
- Angular-parity Playwright snapshots (blocked on Angular dev-app URL mapping)
- Full M3 theming DSL (blocked on qwik-material/core; button-prebuilt.css ships :root defaults as a stopgap, same pattern as dialog-prebuilt.css)
- Button toggle group (`MatButtonToggle` / `MatButtonToggleGroup`) — separate upstream package (`src/material/button-toggle/`), separate port
- MatButtonModule — Qwik has no module concept; consumers import components directly
