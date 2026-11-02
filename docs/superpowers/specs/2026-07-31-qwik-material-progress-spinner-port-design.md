# qwik-material Progress Spinner port — design spec

Port `src/material/progress-spinner/` into a `qwik-material/progress-spinner` entry-point. Eighth component after Dialog + Button + Card + Toolbar + Badge + Icon + Progress Bar. Ships TWO components that share the same underlying JSX + logic via a top-level factory: `<MatProgressSpinner>` renders `<mat-progress-spinner>` with `mode='determinate'` default; `<MatSpinner>` renders `<mat-spinner>` with `mode='indeterminate'` default.

- **Upstream source:** `src/material/progress-spinner/` (219-LOC component + 40-LOC template + 4 SCSS files + 457-LOC spec).
- **New entry-point:** `@angular-community/qwik-material/progress-spinner` at `src/qwik-material/progress-spinner/`.
- **New prebuilt CSS:** `@angular-community/qwik-material/progress-spinner-prebuilt.css`.
- **Branch:** `qwik-cdk-dialog-port` (continues on the same branch as Dialog + Button + Card + Toolbar + Badge + Icon + Progress Bar).
- **Base commit:** tip of the Progress Bar port after final review — `523a8e2da`.

---

## 1. Package layout

Under `src/qwik-material/`:

```
progress-spinner/
  progress-spinner-color.ts              — MatProgressSpinnerColor type
  progress-spinner-color.spec.ts
  progress-spinner-mode.ts               — MatProgressSpinnerMode type
  progress-spinner-mode.spec.ts
  progress-spinner-config.ts             — MatProgressSpinnerConfig + MAT_PROGRESS_SPINNER_CONFIG token
  progress-spinner-config.spec.ts
  mat-progress-spinner.tsx               — createSpinner() factory + MatProgressSpinner + MatSpinner exports
  mat-progress-spinner.spec.tsx          — smoke
  mat-progress-spinner-scenarios.spec.tsx — upstream scenario port
  intrinsic-elements.d.ts                — <mat-progress-spinner> + <mat-spinner> JSX declarations + mode attr
  public-api.ts                          — consumer-facing re-exports
  index.ts                               — `export * from './public-api'`
  SYNC.md                                — deviation log
scss/
  progress-spinner/
    progress-spinner.scss                — copy with `@use '@angular/cdk'` → `@use '../cdk-stub' as cdk` rewrite
    _progress-spinner-theme.scss         — verbatim copy
    _m2-progress-spinner.scss            — verbatim copy
    _m3-progress-spinner.scss            — verbatim copy
    progress-spinner-prebuilt.scss       — NEW: @use progress-spinner.scss + M3 :root defaults
```

Both `<mat-progress-spinner>` and `<mat-spinner>` are custom-element tags. The JSX augmentation declares BOTH.

**Modified:**
- `src/qwik-material/package.json` — add `./progress-spinner` + `./progress-spinner-prebuilt.css` exports (after `./progress-bar` entries)
- `src/qwik-material/vite.config.ts` — `entries` gains `'progress-spinner'`; `sassEntries` gains progress-spinner prebuilt
- `src/qwik-material/dialog/qwik-material-provider.tsx` — add `matProgressSpinnerConfig?: MatProgressSpinnerConfig` prop + `useContextProvider(MAT_PROGRESS_SPINNER_CONFIG, ...)` call (9th provider call)

**qwik-cdk-dev-app changes:**
- `src/root.tsx`: add `import '@angular-community/qwik-material/progress-spinner-prebuilt.css';`
- `src/routes/index.tsx`: add a "Progress spinners" section with 8 route links after Progress bars
- `src/routes/mat-progress-spinner/<name>/index.tsx`: 8 new route files

**qwik-cdk-parity-tests changes:**
- `specs/material-progress-spinner/`: 8 Playwright specs

---

## 2. Public API surface

No exported classes.

### 2.1 Types

```ts
export type MatProgressSpinnerColor = 'primary' | 'accent' | 'warn';

export type MatProgressSpinnerMode = 'determinate' | 'indeterminate';

export interface MatProgressSpinnerConfig {
  color?: MatProgressSpinnerColor;
  /** Default pixel diameter. Upstream default is 100. */
  diameter?: number;
  /** Default pixel stroke width. Falls back to diameter / 10 at render time when unset. */
  strokeWidth?: number;
}
```

### 2.2 Context token

```ts
import {createContextId} from '@builder.io/qwik';

export const MAT_PROGRESS_SPINNER_CONFIG = createContextId<MatProgressSpinnerConfig>(
  'qwik-material/progress-spinner-config',
);
```

### 2.3 Component props

```ts
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
```

### 2.4 Components

```ts
/** Renders <mat-progress-spinner>; `mode` defaults to 'determinate'. */
export declare const MatProgressSpinner: Component<MatProgressSpinnerProps>;

/** Renders <mat-spinner>; `mode` defaults to 'indeterminate'. Non-deprecated alias per upstream. */
export declare const MatSpinner: Component<MatSpinnerProps>;
```

### 2.5 Public API re-exports (`progress-spinner/public-api.ts`)

```ts
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

Zero `export declare class`. Zero `class` declarations on the consumer surface.

### 2.6 Provider extension

```tsx
<QwikMaterialProvider
  matProgressSpinnerConfig={{color: 'accent', diameter: 40, strokeWidth: 3}}
>
  <MatProgressSpinner value={42} />
  <MatSpinner />
</QwikMaterialProvider>
```

All fields optional; empty `{}` is valid.

---

## 3. Internal architecture

### 3.1 Rendered DOM shape

**Determinate mode** (via `<MatProgressSpinner value={42} />`):

```html
<mat-progress-spinner
  role="progressbar"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="42"
  tabindex="-1"
  mode="determinate"
  class="mat-mdc-progress-spinner mdc-circular-progress mat-primary"
  style="width: 100px; height: 100px; --mat-progress-spinner-size: 100px; --mat-progress-spinner-active-indicator-width: 100px;"
>
  <div class="mdc-circular-progress__determinate-container" aria-hidden="true">
    <svg viewBox="0 0 100 100" class="mdc-circular-progress__determinate-circle-graphic" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <circle r="45" style="stroke-dasharray: 282.7433388230814px; stroke-dashoffset: 164.03713651538722px; stroke-width: 10%;"
              class="mdc-circular-progress__determinate-circle" cx="50%" cy="50%" />
    </svg>
  </div>
  <div class="mdc-circular-progress__indeterminate-container" aria-hidden="true">
    <div class="mdc-circular-progress__spinner-layer">
      <div class="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-left">
        <svg viewBox="0 0 100 100" class="mdc-circular-progress__indeterminate-circle-graphic" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <circle r="45" style="stroke-dasharray: 282.7433388230814px; stroke-dashoffset: 141.3716694115407px; stroke-width: 10%;" cx="50%" cy="50%" />
        </svg>
      </div>
      <div class="mdc-circular-progress__gap-patch">
        <svg viewBox="0 0 100 100" class="mdc-circular-progress__indeterminate-circle-graphic" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <circle r="45" style="stroke-dasharray: 282.7433388230814px; stroke-dashoffset: 141.3716694115407px; stroke-width: 10%;" cx="50%" cy="50%" />
        </svg>
      </div>
      <div class="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-right">
        <svg viewBox="0 0 100 100" class="mdc-circular-progress__indeterminate-circle-graphic" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <circle r="45" style="stroke-dasharray: 282.7433388230814px; stroke-dashoffset: 141.3716694115407px; stroke-width: 10%;" cx="50%" cy="50%" />
        </svg>
      </div>
    </div>
  </div>
</mat-progress-spinner>
```

**Indeterminate mode** (via `<MatSpinner />` or `<MatProgressSpinner mode="indeterminate" />`):

Same tree structure as above, EXCEPT:
- Host tag is `<mat-spinner>` when rendered via `MatSpinner`
- Host adds `mdc-circular-progress--indeterminate` class
- Host attribute `mode="indeterminate"`
- Host attribute `aria-valuenow` is OMITTED (Qwik omits undefined attrs)
- Determinate-container's inner `<circle>` inline style OMITS the `stroke-dashoffset` property (CSS keyframes drive it)
- Indeterminate-container's three inner `<circle>` elements keep the `circumference / 2` dashoffset (constant, matches upstream's `<ng-template>` binding)

Both containers ALWAYS render regardless of mode. CSS toggles visibility via the `mdc-circular-progress--indeterminate` class on the host.

### 3.2 Prop resolution chain

```
color        = props.color        ?? config.color        ?? 'primary'
mode         = props.mode         ?? <per-component default>          (determinate for MatProgressSpinner, indeterminate for MatSpinner)
diameter     = props.diameter     ?? config.diameter     ?? 100
strokeWidth  = props.strokeWidth  ?? config.strokeWidth  ?? diameter / 10
value        = clampValue(props.value ?? 0)
```

`clampValue(v)` = `Math.max(0, Math.min(100, v || 0))`.
All computation helpers (`clampValue`, `circleRadius`, `viewBoxSide`, `strokeCircumference`, `strokeDashOffset`, `circleStrokeWidthPct`) are top-level pure functions (Rollup safety precedent from Badge Task 5).

### 3.3 Computed geometry

```ts
const BASE_SIZE = 100;
const BASE_STROKE_WIDTH = 10;

circleRadius(diameter)              = (diameter - BASE_STROKE_WIDTH) / 2
viewBoxSide(diameter, strokeWidth)  = circleRadius(diameter) * 2 + strokeWidth
strokeCircumference(diameter)       = 2 * Math.PI * circleRadius(diameter)
strokeDashOffset(diameter, value)   = (strokeCircumference(diameter) * (100 - value)) / 100
circleStrokeWidthPct(diameter, sw)  = (sw / diameter) * 100
```

The determinate `<circle>` gets `stroke-dashoffset = strokeDashOffset(diameter, value)` in determinate mode; omitted (via `undefined`) in indeterminate mode. All three indeterminate `<circle>` elements always get `stroke-dashoffset = strokeCircumference(diameter) / 2` (matches upstream's `<ng-template>` binding).

### 3.4 Class ladder (exact order)

```ts
const isIndeterminate = mode === 'indeterminate';
const noopable = animationsDisabled.value;

const classes = [
  'mat-mdc-progress-spinner',
  'mdc-circular-progress',
  `mat-${color}`,
  noopable && '_mat-animation-noopable',
  isIndeterminate && 'mdc-circular-progress--indeterminate',
  props.class,
].filter(Boolean) as string[];
```

Established `.filter(Boolean) as string[]` cast — Qwik's `ClassList` type rejects `(string | ReadonlyArray<string>)[]`.

Upstream host bindings parity:
- `mat-mdc-progress-spinner mdc-circular-progress` — static (matches upstream line 68).
- `mat-<color>` — matches `[class]: '"mat-" + color'` (line 72).
- `_mat-animation-noopable` — matches `[class._mat-animation-noopable]: '_noopAnimations'` (line 73). The port reads `animationsDisabled` from `MAT_ANIMATIONS_DISABLED` context (established at Dialog port) — replaces `_getAnimationsState()`'s `di-disabled` branch (§6 deviation #3). Upstream's `_forceAnimations` DI toggle is omitted (§6 deviation #5).
- `mdc-circular-progress--indeterminate` — matches `[class.mdc-circular-progress--indeterminate]: 'mode === "indeterminate"'` (line 74).

Note that upstream does NOT emit an `mdc-circular-progress--determinate` class — the determinate case is the absence of `--indeterminate`.

### 3.5 Host attributes

- `id={props.id}` (optional)
- `class={classes}` (see §3.4)
- `role="progressbar"` (always)
- `aria-valuemin={0}` (always)
- `aria-valuemax={100}` (always)
- `aria-valuenow={isIndeterminate ? undefined : value}` — Qwik omits `undefined` attrs, matching upstream's `[attr.aria-valuenow]: 'mode === "determinate" ? value : null'`
- `aria-label` / `aria-labelledby` / `aria-describedby` — passthroughs (undefined omission)
- `tabIndex={-1}` (always)
- `mode={mode}` — custom attribute mirroring upstream's `[attr.mode]` host binding. `intrinsic-elements.d.ts` widens BOTH tag types to accept it.
- Inline `style` object:
  - `width: ${diameter}px`
  - `height: ${diameter}px`
  - `--mat-progress-spinner-size: ${diameter}px`
  - `--mat-progress-spinner-active-indicator-width: ${diameter}px`

### 3.6 Factory + component pair

Both components come from a top-level `createSpinner(hostTag, defaultMode)` factory that returns the `component$` with the two tag-specific values baked in. This avoids duplicating ~40 LOC of shared JSX.

```ts
function createSpinner(
  hostTag: 'mat-progress-spinner' | 'mat-spinner',
  defaultMode: MatProgressSpinnerMode,
): Component<MatProgressSpinnerProps> {
  return component$<MatProgressSpinnerProps>(props => {
    // …read config, compute geometry, build class ladder, return JSX…
    // The JSX renders the hostTag via a `HostTag` local (see below).
  });
}

export const MatProgressSpinner = createSpinner('mat-progress-spinner', 'determinate');
export const MatSpinner = createSpinner('mat-spinner', 'indeterminate');
```

The dynamic-host-tag pattern in Qwik JSX may require a `FunctionComponent`-typed local variable (`const HostTag = hostTag as unknown as FunctionComponent<Record<string, unknown>>`) to render the tag string as a JSX element. If Task 6's implementer finds this doesn't typecheck against Qwik's current JSX intrinsics, the fallback is to eliminate the factory and hard-code two return blocks — one per exported component, ~30 LOC extra. Log the outcome in Task 6's report.

### 3.7 Internal `SpinnerCircle` helper

The `<svg><circle/></svg>` element appears 4 times per render: once in the determinate container, three times across the indeterminate clippers. To avoid textual duplication, an internal (non-exported) `SpinnerCircle` helper component takes props for `variant` (determinate|indeterminate), `viewBox`, `radius`, `circumference`, `dashOffset`, `strokeWidthPct`, and renders the SVG with the appropriate inline style + class.

The determinate variant emits `class="mdc-circular-progress__determinate-circle-graphic"` on the SVG + `class="mdc-circular-progress__determinate-circle"` on the circle. The indeterminate variant emits `class="mdc-circular-progress__indeterminate-circle-graphic"` on the SVG + no class on the circle. Matches upstream's `<ng-template #circle>` (no class on the circle for the indeterminate variant) + `<svg class="mdc-circular-progress__determinate-circle-graphic">` (in the determinate container).

### 3.8 No lifecycle work

- Zero `useVisibleTask$`, zero `useTask$`, zero `useResource$`, zero `useSignal` for internal state.
- No id counter, no event listeners, no cleanup callbacks.
- Pure function of `(props, context)` → JSX.

---

## 4. SSR & rendering safety

- Zero browser globals (`document.` / `window.` / `navigator.` / `getComputedStyle(` / `requestAnimationFrame(` all absent).
- No `useVisibleTask$` — no client-side event binding needed. CSS keyframes in the copied `progress-spinner.scss` drive the indeterminate animation from the moment the DOM is present.
- No `isBrowser` import from `@builder.io/qwik/build` (banned per Global Constraints).
- `animationsDisabled` is a `Signal<boolean>` read via `useContext(MAT_ANIMATIONS_DISABLED)`. SSR value is whatever the provider seeded (default: `signal(false)`).
- SVG tree is fully deterministic from props at SSR time — no hydration mismatch possible.
- SSR lint (`lint:no-ssr-leaks`) will find zero violations.

---

## 5. CSS delivery

### 5.1 SCSS chain

Byte-identical copies:
- `_progress-spinner-theme.scss` (95 LOC)
- `_m2-progress-spinner.scss` (25 LOC)
- `_m3-progress-spinner.scss` (27 LOC)

Copy with documented rewrite (verified in Task 2):
- `progress-spinner.scss` (232 LOC) — top-level `@use '@angular/cdk';` present at line 1 (grep-confirmed). Task 2 rewrites to `@use '../cdk-stub' as cdk;` following the established pattern. `_cdk-stub.scss` provides `cdk.high-contrast`; verify no other `cdk.*` symbols are needed.

### 5.2 Prebuilt CSS

New file `scss/progress-spinner/progress-spinner-prebuilt.scss`: `@use './progress-spinner';` first (Sass syntax) + `:root { … }` M3 defaults for every `--mat-progress-spinner-*` and `--mat-sys-*` reference emitted by the compiled CSS.

Task 2 verifies with the iterative grep-vs-`:root` reconciliation loop (Icon Task 2 precedent). Plan-author's candidate is a guess; compiled CSS is the source of truth.

### 5.3 Consumer wiring

```ts
import '@angular-community/qwik-material/progress-spinner-prebuilt.css';
```

Independent of other prebuilt entries.

---

## 6. Deviations catalog

Recorded verbatim in `src/qwik-material/progress-spinner/SYNC.md` (Task 11).

1. **`<mat-progress-spinner>` AND `<mat-spinner>` custom-element tags both preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation — both tags widened to `QwikIntrinsicElements['div'] & {mode?: string}` (same widening pattern as Icon `fontIcon` / Progress Bar `mode`).
2. **`MatSpinner` shipped as a separate real component**, NOT `export const MatSpinner = MatProgressSpinner` as upstream does. Qwik cannot sniff host tag name at constructor time; two components sharing a `createSpinner()` factory produce the same DOM shape with different host tag + different default mode.
3. **`_getAnimationsState()` `di-disabled` branch** replaced by `animationsDisabled = useContext(MAT_ANIMATIONS_DISABLED)` reading a `Signal<boolean>` from `QwikMaterialProvider`. Established at Dialog port.
4. **`.mat-progress-spinner-reduced-motion` class omitted.** Upstream's constructor detects reduced-motion via `_getAnimationsState()`. The port relies on the SCSS's own `@media (prefers-reduced-motion: reduce)` selectors. No client-side matchMedia.
5. **`_forceAnimations` config field omitted.** Obscure Angular DI toggle for forcing animations even when DI-disabled. `matAnimationsDisabled` context already gives consumers the escape hatch.
6. **`NgTemplateOutlet` template mechanism replaced by an internal `SpinnerCircle` helper component.** Upstream reuses one `<ng-template #circle>` across 4 render sites (1 determinate + 3 indeterminate clippers); the port inlines an internal component with the same output.
7. **`ViewChild('determinateSpinner')` reference omitted.** Port doesn't need reactive DOM node access.
8. **`numberAttribute` transforms omitted.** Port accepts JSX `number` and clamps `value` at render time via top-level `clampValue()`.
9. **`MAT_PROGRESS_SPINNER_CONFIG` folded into `QwikMaterialProvider.matProgressSpinnerConfig`.** 9th `useContextProvider` call.
10. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatProgressSpinnerProps` (and re-used by `MatSpinnerProps`) and forwarded to both host tags.
11. **`ThemePalette` narrowed** to `MatProgressSpinnerColor = 'primary' | 'accent' | 'warn'`.
12. **Deprecated Angular `MatSpinner` const alias** (`export const MatSpinner = MatProgressSpinner`) replaced by a first-class real component with distinct DOM tag (`<mat-spinner>`) and distinct default mode (`indeterminate`).
13. **`intrinsic-elements.d.ts` widens BOTH `<mat-progress-spinner>` AND `<mat-spinner>` to `QwikIntrinsicElements['div'] & {mode?: string}`.** Both tag types need the widening because both components emit the `mode` custom attribute.

Additional deviations discovered during implementation get appended to the SYNC.md list.

---

## 7. Test coverage strategy

### 7.1 Vitest (smoke-only)

`progress-spinner/mat-progress-spinner-scenarios.spec.tsx` mirrors Progress Bar structure. `createDOM(<component$/>)` hangs the Qwik optimizer worker under vitest — every prior port confirmed this — so specs use module-import assertions only.

**Live sanity tests (~8):**
1. `MatProgressSpinner` is exported (typeof === 'function')
2. `MatSpinner` is exported (typeof === 'function')
3. `MAT_PROGRESS_SPINNER_CONFIG.id === 'qwik-material/progress-spinner-config'`
4. `MatProgressSpinnerColor` accepts the 3 documented values
5. `MatProgressSpinnerMode` accepts the 2 documented values
6. `MatProgressSpinnerConfig` accepts empty `{}` + every documented field
7. `MatProgressSpinnerProps` accepts the numeric + geometry + color surface
8. `MatSpinnerProps` is structurally identical to `MatProgressSpinnerProps` (type-level assertion)

**describe.skip DOM-rendered (~15):** deferred to Playwright Task 10
- host classes (`mat-mdc-progress-spinner`, `mdc-circular-progress`, `mat-<color>`, `_mat-animation-noopable`, `mdc-circular-progress--indeterminate`)
- host attrs (`role`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` presence/absence, `tabindex`, `mode`)
- inline style (`width`, `height`, `--mat-progress-spinner-size`, `--mat-progress-spinner-active-indicator-width`)
- viewBox computation for varying diameter/strokeWidth
- `stroke-dasharray` and `stroke-dashoffset` computation for varying diameter/value
- `stroke-width%` computation for varying strokeWidth
- both containers always render regardless of mode
- 4 SVG copies (1 determinate + 3 indeterminate clippers)
- `<mat-spinner>` tag emission via `MatSpinner`
- `<mat-progress-spinner>` tag emission via `MatProgressSpinner`
- `MatSpinner`'s default mode is `indeterminate`
- `MatProgressSpinner`'s default mode is `determinate`
- aria-label / aria-labelledby / aria-describedby forwarding
- value clamping (over 100, negative, NaN, undefined)
- explicit `mode` prop overrides per-component default

**describe.skip Angular-only (~10):** deferred forever per §6 deviations
- `NgTemplateOutlet` template usage
- `ViewChild('determinateSpinner')` reference
- `MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS` DI injection with factory
- `_getAnimationsState()` DI-disabled detection
- `_getAnimationsState()` reduced-motion detection
- `_forceAnimations` DI toggle
- `numberAttribute` decorator transform on value/diameter/strokeWidth
- `ThemePalette` (full palette union) support
- `_defaultColor = 'primary'` mutation on setter
- `export const MatSpinner = MatProgressSpinner` const-alias pattern (upstream's deprecated import path)

### 7.2 Dev-app routes (8)

Under `src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/`:

| Route | Scenario |
| --- | --- |
| `basic/` | `<MatProgressSpinner value={50} />` — default determinate mode, primary color, default diameter |
| `determinate/` | `<MatProgressSpinner mode="determinate" value={75} />` — explicit mode |
| `indeterminate/` | `<MatProgressSpinner mode="indeterminate" />` — asserts `mdc-circular-progress--indeterminate` class + no aria-valuenow |
| `mat-spinner-alias/` | `<MatSpinner />` — asserts `<mat-spinner>` tag + `mdc-circular-progress--indeterminate` class + no aria-valuenow |
| `colors/` | 3 spinners: primary/accent/warn — distinct `mat-<color>` classes |
| `custom-diameter/` | `<MatProgressSpinner value={50} diameter={40} />` — inline width/height/CSS custom props reflect 40, viewBox and stroke geometry recomputed |
| `custom-stroke/` | `<MatProgressSpinner value={50} diameter={40} strokeWidth={3} />` — stroke-width% recomputed |
| `aria-labeled/` | `<MatProgressSpinner value={25} aria-label="Loading" />` — host carries aria-label |

Every route ends with `<main data-scenario-ready>ready</main>`.

### 7.3 Playwright parity specs (8)

Under `src/qwik-cdk-parity-tests/specs/material-progress-spinner/`. One spec per dev-app route. Each spec asserts:
- Locator uses the correct custom-element tag (`mat-progress-spinner` for 7 routes; `mat-spinner` for the alias route).
- Class ladder tokens per scenario.
- Host attrs: `role`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` presence/absence, `tabindex`, `mode`.
- Inline style tokens (`width`, `height`, `--mat-progress-spinner-size`).
- Inner DOM: `.mdc-circular-progress__determinate-container` + `.mdc-circular-progress__indeterminate-container` both present; determinate SVG carries the correct `stroke-dashoffset` in determinate scenarios; 3 clipper divs present in the indeterminate container.

CMS parity gate: every spec asserts on the tag it renders AT LEAST ONCE.

---

## 8. SYNC.md format

`src/qwik-material/progress-spinner/SYNC.md` follows the same table + deviation-catalog + stub-inventory-delta shape as prior ports. Rows:

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `progress-spinner/mat-progress-spinner.tsx` | `src/material/progress-spinner/progress-spinner.ts` (MatProgressSpinner component + progress-spinner.html template) | ported | Directive→component$ factory; JSX template inlined; NgTemplateOutlet replaced by internal SpinnerCircle helper; MatSpinner ships as second real component (not const alias) |
| `progress-spinner/progress-spinner-color.ts` | `src/material/progress-spinner/progress-spinner.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union |
| `progress-spinner/progress-spinner-mode.ts` | `src/material/progress-spinner/progress-spinner.ts` (ProgressSpinnerMode type) | ported | Verbatim 2-value union |
| `progress-spinner/progress-spinner-config.ts` | `src/material/progress-spinner/progress-spinner.ts` (MatProgressSpinnerDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matProgressSpinnerConfig; `_forceAnimations` field omitted |
| `scss/progress-spinner/progress-spinner.scss` | `src/material/progress-spinner/progress-spinner.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — same rewrite as dialog + button + card + toolbar + badge + progress-bar ports |
| `scss/progress-spinner/_progress-spinner-theme.scss` | `src/material/progress-spinner/_progress-spinner-theme.scss` | synced | byte-identical copy |
| `scss/progress-spinner/_m2-progress-spinner.scss` | `src/material/progress-spinner/_m2-progress-spinner.scss` | synced | byte-identical copy |
| `scss/progress-spinner/_m3-progress-spinner.scss` | `src/material/progress-spinner/_m3-progress-spinner.scss` | synced | byte-identical copy |
| `scss/progress-spinner/progress-spinner-prebuilt.scss` | (qwik-material-specific) | new | @use progress-spinner.scss + M3 :root defaults matching emitted --mat-progress-spinner-* references |

Removed upstream files:
- `progress-spinner-module.ts` → Qwik has no module concept
- `progress-spinner.html` → template inlined as JSX inside `mat-progress-spinner.tsx` (with NgTemplateOutlet replaced by internal SpinnerCircle helper)
- `testing/` (MatProgressSpinnerTestingModule + harness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (§2.5)
- `progress-spinner.spec.ts` → ported to `mat-progress-spinner-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

---

## 9. Explicit non-goals

- No client-side `matchMedia('(prefers-reduced-motion: reduce)')` — SCSS media queries handle it.
- No Angular Renderer2 / ChangeDetectorRef / ViewChild abstractions.
- No `_forceAnimations` toggle.
- No support for arbitrary `color` string beyond the 3-value palette union.
- No `numberAttribute` decorator emulation — port assumes JSX-time numeric values.
- No runtime template mechanism — `SpinnerCircle` is a compile-time internal component.
- No `MatSpinner` const-alias re-export path — the port's `MatSpinner` is a distinct component with its own DOM tag.

---

## 10. Rough task decomposition

Plan-writer will refine, but the shape mirrors Progress Bar exactly:

1. **Entry-point wiring** — package.json + vite.config.ts + intrinsic-elements.d.ts (widening BOTH tags with `mode` attr) + empty index.ts stub
2. **SCSS chain + prebuilt** — copy 4 upstream files (with `@angular/cdk` rewrite in `progress-spinner.scss`) + write progress-spinner-prebuilt.scss with iterative `:root` reconciliation
3. **MatProgressSpinnerColor type** — 3-value union + spec
4. **MatProgressSpinnerMode type** — 2-value union + spec
5. **MatProgressSpinnerConfig + MAT_PROGRESS_SPINNER_CONFIG** — interface + context id + spec
6. **MatProgressSpinner + MatSpinner components** — mat-progress-spinner.tsx with `createSpinner()` factory + geometry helpers + `SpinnerCircle` internal component + smoke spec
7. **Provider extension** — extend `QwikMaterialProvider` with `matProgressSpinnerConfig?` field (9th `useContextProvider` call)
8. **Public API** — public-api.ts re-exports (both components + all types + token) + swap index.ts stub for real re-export + build validation
9. **Vitest scenario port** — mat-progress-spinner-scenarios.spec.tsx with restructured coverage
10. **Dev-app routes + Playwright specs** — 8 routes + 8 parity specs + root.tsx CSS import + index.tsx tile section
11. **SYNC.md + pipeline verification** — final `pnpm test:qwik-material` gate

Every task ends with a commit using scope `multiple` per the project-wide commit-msg hook constraint.
