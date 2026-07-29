# qwik-material Progress Bar port — design spec

Port `src/material/progress-bar/` into a `qwik-material/progress-bar` entry-point. Seventh component after Dialog + Button + Card + Toolbar + Badge + Icon. Ships the full 4-mode linear progress bar as a stateless `<MatProgressBar>` component. No animation state coordination beyond CSS keyframes; the one imperative behavior (`animationEnd` Output) becomes a Qwik-idiomatic QRL callback attached in `useVisibleTask$`.

- **Upstream source:** `src/material/progress-bar/` (256-LOC `MatProgressBar` component + 4 SCSS files + 346-LOC spec).
- **New entry-point:** `@angular-community/qwik-material/progress-bar` at `src/qwik-material/progress-bar/`.
- **New prebuilt CSS:** `@angular-community/qwik-material/progress-bar-prebuilt.css`.
- **Branch:** `qwik-cdk-dialog-port` (continues on the same branch as Dialog + Button + Card + Toolbar + Badge + Icon).
- **Base commit:** tip of the Icon port after final review + polish — `23d9c55ae`.

---

## 1. Package layout

Under `src/qwik-material/`:

```
progress-bar/
  progress-bar-color.ts              — MatProgressBarColor type
  progress-bar-color.spec.ts
  progress-bar-mode.ts               — MatProgressBarMode type
  progress-bar-mode.spec.ts
  progress-bar-config.ts             — MatProgressBarConfig + MAT_PROGRESS_BAR_CONFIG token
  progress-bar-config.spec.ts
  mat-progress-bar.tsx               — <MatProgressBar>
  mat-progress-bar.spec.tsx          — smoke
  mat-progress-bar-scenarios.spec.tsx — upstream scenario port
  intrinsic-elements.d.ts            — <mat-progress-bar> JSX declaration + mode attr
  public-api.ts                      — consumer-facing re-exports
  index.ts                           — `export * from './public-api'`
  SYNC.md                            — deviation log
scss/
  progress-bar/
    progress-bar.scss                — copy with `@use '@angular/cdk'` → `@use '../cdk-stub' as cdk` rewrite
    _progress-bar-theme.scss         — verbatim copy
    _m2-progress-bar.scss            — verbatim copy
    _m3-progress-bar.scss            — verbatim copy
    progress-bar-prebuilt.scss       — NEW: @use progress-bar.scss + M3 :root defaults
```

`<mat-progress-bar>` is a custom-element tag (matches Card / Toolbar / Dialog / Icon).

**Modified:**
- `src/qwik-material/package.json` — add `./progress-bar` + `./progress-bar-prebuilt.css` exports (after `./icon` entries)
- `src/qwik-material/vite.config.ts` — `entries` gains `'progress-bar'`; `sassEntries` gains progress-bar prebuilt
- `src/qwik-material/dialog/qwik-material-provider.tsx` — add `matProgressBarConfig?: MatProgressBarConfig` prop + `useContextProvider(MAT_PROGRESS_BAR_CONFIG, ...)` call (8th provider call)

**qwik-cdk-dev-app changes:**
- `src/root.tsx`: add `import '@angular-community/qwik-material/progress-bar-prebuilt.css';`
- `src/routes/index.tsx`: add a "Progress bars" section with 8 route links after Icons
- `src/routes/mat-progress-bar/<name>/index.tsx`: 8 new route files

**qwik-cdk-parity-tests changes:**
- `specs/material-progress-bar/`: 8 Playwright specs

---

## 2. Public API surface

No exported classes.

### 2.1 Types

```ts
export type MatProgressBarColor = 'primary' | 'accent' | 'warn';

export type MatProgressBarMode = 'determinate' | 'indeterminate' | 'buffer' | 'query';

export interface MatProgressBarConfig {
  color?: MatProgressBarColor;
  mode?: MatProgressBarMode;
}
```

### 2.2 Context token

```ts
import {createContextId} from '@builder.io/qwik';

export const MAT_PROGRESS_BAR_CONFIG = createContextId<MatProgressBarConfig>(
  'qwik-material/progress-bar-config',
);
```

### 2.3 Component props

```ts
export interface MatProgressBarProps {
  /** Progress percentage 0-100 (clamped). Ignored in indeterminate/query mode. */
  value?: number;
  /** Buffer percentage 0-100 (clamped). Only visually applied in `buffer` mode. */
  bufferValue?: number;
  color?: MatProgressBarColor;
  mode?: MatProgressBarMode;
  /**
   * Fires when the primary bar's `transitionend` event completes in
   * `determinate` or `buffer` mode. Not called for `indeterminate` / `query`.
   * The callback receives the current clamped value.
   */
  onAnimationEnd$?: QRL<(value: number) => void>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
```

### 2.4 Component

```ts
export declare const MatProgressBar: Component<MatProgressBarProps>;
```

### 2.5 Public API re-exports (`progress-bar/public-api.ts`)

```ts
export type {MatProgressBarColor} from './progress-bar-color';
export type {MatProgressBarMode} from './progress-bar-mode';
export type {MatProgressBarConfig} from './progress-bar-config';
export {MAT_PROGRESS_BAR_CONFIG} from './progress-bar-config';
export {MatProgressBar, type MatProgressBarProps} from './mat-progress-bar';
```

### 2.6 Provider extension

```tsx
<QwikMaterialProvider
  matProgressBarConfig={{color: 'accent', mode: 'determinate'}}
>
  <MatProgressBar value={42} />
</QwikMaterialProvider>
```

Both fields optional; empty `{}` is valid.

---

## 3. Internal architecture

### 3.1 Rendered DOM shape

```html
<mat-progress-bar
  role="progressbar"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="42"
  tabindex="-1"
  mode="determinate"
  class="mat-mdc-progress-bar mdc-linear-progress mat-primary mdc-linear-progress--animation-ready"
>
  <div class="mdc-linear-progress__buffer" aria-hidden="true">
    <div class="mdc-linear-progress__buffer-bar" style="flex-basis: 100%;"></div>
  </div>
  <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar" aria-hidden="true" style="transform: scaleX(0.42);">
    <span class="mdc-linear-progress__bar-inner"></span>
  </div>
  <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar" aria-hidden="true">
    <span class="mdc-linear-progress__bar-inner"></span>
  </div>
</mat-progress-bar>
```

Buffer mode variant additionally renders `<div class="mdc-linear-progress__buffer-dots"></div>` inside the buffer wrapper, and the `mdc-linear-progress__buffer-bar` gets `style="flex-basis: <bufferValue>%;"`. Indeterminate/query modes add `mdc-linear-progress--indeterminate` to the host class ladder and omit `aria-valuenow`.

### 3.2 Prop resolution chain

```
color   = props.color ?? config.color ?? 'primary'
mode    = props.mode  ?? config.mode  ?? 'determinate'
value       = clamp(props.value ?? 0)
bufferValue = clamp(props.bufferValue ?? 0)
```

`clamp(v)` = `Math.max(0, Math.min(100, v || 0))`. Top-level function, not inline inside `component$` (Rollup safety precedent from Badge Task 5).

### 3.3 Class ladder (exact order)

```ts
const isIndeterminate = mode === 'indeterminate' || mode === 'query';
const noopable = animationsDisabled.value;

const classes = [
  'mat-mdc-progress-bar',
  'mdc-linear-progress',
  `mat-${color}`,
  noopable && '_mat-animation-noopable',
  !noopable && 'mdc-linear-progress--animation-ready',
  isIndeterminate && 'mdc-linear-progress--indeterminate',
  props.class,
].filter(Boolean) as string[];
```

Established `.filter(Boolean) as string[]` cast — Qwik's `ClassList` type rejects `(string | ReadonlyArray<string>)[]`.

Upstream host bindings parity:
- `mat-mdc-progress-bar mdc-linear-progress` — static (matches upstream line 98).
- `mat-<color>` — matches `[class]: '"mat-" + color'` (line 99).
- `_mat-animation-noopable` — matches `[class._mat-animation-noopable]: '_isNoopAnimation'`. The port reads `animationsDisabled` from `MAT_ANIMATIONS_DISABLED` context (established at Dialog port); this replaces `_getAnimationsState()`'s `di-disabled` branch (§6 deviation #3).
- `mdc-linear-progress--animation-ready` — inverse of above (matches upstream line 101).
- `mdc-linear-progress--indeterminate` — matches `[class.mdc-linear-progress--indeterminate]: '_isIndeterminate()'` (line 102).

### 3.4 Host attributes

- `role="progressbar"` (static)
- `aria-valuemin={0}` (static)
- `aria-valuemax={100}` (static)
- `aria-valuenow={isIndeterminate ? undefined : value}` — Qwik omits `undefined` attrs, matching upstream's `[attr.aria-valuenow]: '_isIndeterminate() ? null : value'`
- `aria-label={props['aria-label']}`, `aria-labelledby={props['aria-labelledby']}`, `aria-describedby={props['aria-describedby']}` — undefined omission (Icon precedent)
- `tabIndex={-1}` (static)
- `mode={mode}` — custom attribute mirroring upstream's `[attr.mode]` host binding. `intrinsic-elements.d.ts` widens the tag type to accept it.
- `id={props.id}` (optional)
- `class={classes}` (see §3.3)
- `ref={hostRef}` — used by the transitionend listener

### 3.5 Inner template

Two mutually-shared branches with conditional buffer-dots div:

```tsx
<div class="mdc-linear-progress__buffer" aria-hidden="true">
  <div class="mdc-linear-progress__buffer-bar" style={{flexBasis: bufferFlexBasis}} />
  {mode === 'buffer' && <div class="mdc-linear-progress__buffer-dots" />}
</div>
<div
  class="mdc-linear-progress__bar mdc-linear-progress__primary-bar"
  aria-hidden="true"
  style={{transform: primaryTransform}}
>
  <span class="mdc-linear-progress__bar-inner" />
</div>
<div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar" aria-hidden="true">
  <span class="mdc-linear-progress__bar-inner" />
</div>
```

Where:
- `primaryTransform = ``scaleX(${isIndeterminate ? 1 : value / 100})``` — matches upstream `_getPrimaryBarTransform()`
- `bufferFlexBasis = ``${mode === 'buffer' ? bufferValue : 100}%``` — matches upstream `_getBufferBarFlexBasis()`

### 3.6 Animation-end callback

```tsx
const hostRef = useSignal<Element>();

useVisibleTask$(({cleanup}) => {
  const el = hostRef.value;
  if (!el) return;
  const handler = (event: TransitionEvent) => {
    // Filter to the primary bar's own transitionend (children bubble).
    const target = event.target as HTMLElement | null;
    if (!target || !target.classList.contains('mdc-linear-progress__primary-bar')) return;

    // Read the LIVE prop values via the props proxy — the handler may fire
    // long after this useVisibleTask$ callback ran, and `mode` / `value` /
    // `onAnimationEnd$` may have changed. The Qwik props proxy stays valid
    // across renders, so `props.X` is always current.
    const currentMode = props.mode ?? config.mode ?? 'determinate';
    if (currentMode !== 'determinate' && currentMode !== 'buffer') return;
    const cb = props.onAnimationEnd$;
    if (!cb) return;
    cb(clamp(props.value ?? 0));
  };
  el.addEventListener('transitionend', handler);
  cleanup(() => el.removeEventListener('transitionend', handler));
});
```

- Client-only by construction (`useVisibleTask$` never runs during SSR).
- Handler reads `props.mode` / `props.value` / `props.onAnimationEnd$` via the Qwik props proxy at fire time, NOT from render-time-derived locals. This matters: consumers can swap `mode` mid-animation (e.g. `determinate` → `indeterminate` when a request errors out) and the filter must reflect the current mode.
- Cleanup guarantees no listener leak on unmount.
- Filters exactly like upstream `_transitionendHandler` (§6 deviation #2).

### 3.7 No id counter, no `useSignal` for internal state

The component reads props + context on every render and returns JSX. No `_idSeq`, no local state signals. The one signal (`hostRef`) is only for the `useVisibleTask$` DOM handle. Pure function of `(props, context)` → JSX aside from the visible-task side effect.

---

## 4. SSR & rendering safety

- Zero browser globals (`document.` / `window.` / `navigator.` / `getComputedStyle(` / `requestAnimationFrame(`) accessed in the render body.
- `useVisibleTask$` runs only after client hydration — its `addEventListener` call cannot execute during SSR.
- `animationsDisabled` is a `Signal<boolean>` read via `useContext(MAT_ANIMATIONS_DISABLED)`. Its SSR value is whatever the provider seeded (default: `signal(false)`). Reading `.value` in the render body correctly participates in Qwik's reactivity — flipping it at runtime re-renders the class array.
- Indeterminate/query CSS keyframes ship in the copied `progress-bar.scss` and animate the moment the DOM is present, needing no component involvement.
- No `isBrowser` import from `@builder.io/qwik/build` (banned per Global Constraints).
- SSR lint (`lint:no-ssr-leaks`) will find zero violations.

---

## 5. CSS delivery

Same pattern as prior ports.

### 5.1 SCSS chain

Byte-identical copies:
- `_progress-bar-theme.scss` (93 LOC)
- `_m2-progress-bar.scss` (36 LOC)
- `_m3-progress-bar.scss` (29 LOC)

Copy with documented rewrite (verified in Task 2):
- `progress-bar.scss` (311 LOC) — top-level `@use '@angular/cdk';` is present (grep confirmed). Task 2 rewrites this to `@use '../cdk-stub' as cdk;` following the established pattern from Dialog / Button / Card / Toolbar / Badge ports. `_cdk-stub.scss` from prior ports already provides the `high-contrast` mixin the progress-bar SCSS invokes.

### 5.2 Prebuilt CSS

New file `scss/progress-bar/progress-bar-prebuilt.scss`: `@use './progress-bar';` (must come first per Sass syntax) + a `:root { … }` block declaring every `--mat-progress-bar-*` and `--mat-sys-*` reference emitted by the compiled CSS.

Task 2 verifies with the iterative grep-vs-`:root` reconciliation loop (established after Icon Task 2's plan-bug where the controller guessed `--mat-icon-icon-color` but the real emitted variable was `--mat-icon-color`). The implementer greps `dist/progress-bar-prebuilt.css` for `var(--mat-*)` references, adds missing declarations to `:root`, rebuilds, and repeats until the reference set equals the declaration set.

M3 defaults sourced from `src/material/core/tokens/m3/_md-sys-color.scss` etc.

### 5.3 Consumer wiring

```ts
import '@angular-community/qwik-material/progress-bar-prebuilt.css';
```

Independent of other prebuilt entries.

---

## 6. Deviations catalog

Recorded verbatim in `src/qwik-material/progress-bar/SYNC.md` (Task 10).

1. **`<mat-progress-bar>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation. Consistent with the CMS-parity constraint.
2. **`animationEnd: EventEmitter<{value: number}>` Output** → `onAnimationEnd$?: QRL<(value: number) => void>` prop, attached via `useVisibleTask$` + `addEventListener('transitionend')`. Filtered exactly like upstream's `_transitionendHandler`: target's classList contains `mdc-linear-progress__primary-bar` AND `mode ∈ {determinate, buffer}`.
3. **`_getAnimationsState()` `di-disabled` branch** replaced by `animationsDisabled = useContext(MAT_ANIMATIONS_DISABLED)` reading a `Signal<boolean>` from `QwikMaterialProvider`. Established at Dialog port.
4. **`.mat-progress-bar-reduced-motion` class omitted.** Upstream's constructor calls `matchMedia('(prefers-reduced-motion: reduce)')` and adds the class. The port relies on the SCSS's own `@media (prefers-reduced-motion: reduce)` selectors to handle motion-reduced rendering. No client-side matchMedia.
5. **`MAT_PROGRESS_BAR_LOCATION` context + Safari SPA-nav FuncIRI path-prepending omitted.** SSR-hostile; irrelevant to Qwik's resume model.
6. **`Renderer2` / `NgZone.runOutsideAngular` / `ChangeDetectorRef` omitted.** Qwik's reactivity + `useVisibleTask$` cover the same ground.
7. **`ProgressAnimationEnd` interface omitted.** Its only field (`{value: number}`) is inlined into the QRL signature.
8. **`ThemePalette` narrowed** to `MatProgressBarColor = 'primary' | 'accent' | 'warn'`.
9. **`numberAttribute` transform omitted.** Port accepts JSX `number` and clamps at render time via top-level `clamp()`.
10. **`MAT_PROGRESS_BAR_CONFIG` folded into `QwikMaterialProvider.matProgressBarConfig`.** 8th `useContextProvider` call.
11. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatProgressBarProps` and forwarded to `<mat-progress-bar>`. Icon-precedent adjudication.
12. **`intrinsic-elements.d.ts` widens `<mat-progress-bar>` to `QwikIntrinsicElements['div'] & {mode?: string}`.** The `mode` custom attribute mirrors upstream's `[attr.mode]` host binding. Same widening pattern as Icon's `fontIcon` attr.

Additional deviations discovered during implementation get appended to the SYNC.md list.

---

## 7. Test coverage strategy

### 7.1 Vitest (smoke-only)

`progress-bar/mat-progress-bar-scenarios.spec.tsx` mirrors Badge/Icon structure. `createDOM(<component$/>)` hangs the Qwik optimizer worker under vitest — every prior port confirmed this — so specs use module-import assertions only.

**Live sanity tests (~7):**
1. `MatProgressBar` is exported (typeof === 'function')
2. `MAT_PROGRESS_BAR_CONFIG.id === 'qwik-material/progress-bar-config'`
3. `MatProgressBarColor` accepts the 3 documented values
4. `MatProgressBarMode` accepts the 4 documented values
5. `MatProgressBarConfig` accepts empty `{}` + every documented field
6. `MatProgressBarProps` accepts the numeric/mode/color surface
7. `MatProgressBarProps` accepts the aria-* + `onAnimationEnd$` surface

**describe.skip DOM-rendered (~15):** deferred to Playwright Task 9
- host classes: `mat-mdc-progress-bar`, `mdc-linear-progress`, `mat-<color>`, `_mat-animation-noopable`, `mdc-linear-progress--animation-ready`, `mdc-linear-progress--indeterminate`
- host attrs: `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow` (present in determinate/buffer, absent in indeterminate/query), `tabindex="-1"`, `mode` reflection
- value/bufferValue clamping (over 100, negative, NaN, undefined)
- primary-bar transform in each mode
- buffer flex-basis in each mode
- buffer-dots div only in buffer mode
- aria-label/labelledby/describedby forwarding
- onAnimationEnd$ QRL callback fires on transitionend

**describe.skip Angular-only (~10):** deferred forever per §6 deviations
- `Renderer2.listen('transitionend', ...)` inside `NgZone.runOutsideAngular`
- `ChangeDetectorRef.markForCheck()` on setter mutation
- `_getAnimationsState()` DI-disabled detection
- `_getAnimationsState()` reduced-motion detection
- `MAT_PROGRESS_BAR_LOCATION` path resolution
- `EventEmitter.observers.length` guard on transitionend
- `numberAttribute` decorator transform on `value` / `bufferValue`
- `_defaultColor = 'primary'` mutation on setter
- Angular DI injection of `MAT_PROGRESS_BAR_DEFAULT_OPTIONS`
- Angular `providedIn: 'root'` factory for `MAT_PROGRESS_BAR_LOCATION`

### 7.2 Dev-app routes (8)

Under `src/qwik-cdk-dev-app/src/routes/mat-progress-bar/`:

| Route | Scenario |
| --- | --- |
| `basic/` | `<MatProgressBar value={50} />` — default determinate mode, primary color |
| `determinate/` | `<MatProgressBar mode="determinate" value={75} />` — explicit mode, higher value |
| `indeterminate/` | `<MatProgressBar mode="indeterminate" />` — asserts `mdc-linear-progress--indeterminate` class + no aria-valuenow |
| `buffer/` | `<MatProgressBar mode="buffer" value={30} bufferValue={65} />` — asserts buffer-dots div present + buffer-bar flex-basis="65%" |
| `query/` | `<MatProgressBar mode="query" />` — asserts `mdc-linear-progress--indeterminate` class + `mode="query"` attr |
| `colors/` | 3 bars: `color="primary"`, `"accent"`, `"warn"` — asserts distinct `mat-<color>` classes |
| `animation-end/` | `<MatProgressBar value=…/>` with `onAnimationEnd$` updating a signal on completion; Playwright asserts the callback ran (via a rendered "fired" text marker) |
| `aria-labeled/` | `<MatProgressBar value={25} aria-label="Uploading" />` — asserts `aria-label` attribute on host |

Every route ends with `<main data-scenario-ready>ready</main>`.

### 7.3 Playwright parity specs (8)

Under `src/qwik-cdk-parity-tests/specs/material-progress-bar/`. One spec per dev-app route. Each spec asserts:
- Locator `mat-progress-bar` (custom-element tag).
- Class ladder tokens per scenario.
- Host attrs: `role`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` presence/absence, `tabindex`, `mode`.
- Inner DOM: `.mdc-linear-progress__buffer`, `.mdc-linear-progress__primary-bar`, `.mdc-linear-progress__secondary-bar` present; `.mdc-linear-progress__buffer-dots` present only in buffer route.
- `style="transform: scaleX(...)"` on primary bar for determinate/buffer.
- `style="flex-basis: ...%"` on buffer bar.

CMS parity gate: every spec asserts on the `mat-progress-bar` tag AT LEAST ONCE.

---

## 8. SYNC.md format

`src/qwik-material/progress-bar/SYNC.md` follows the same table + deviation-catalog + stub-inventory-delta shape as Badge / Icon. Rows:

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `progress-bar/mat-progress-bar.tsx` | `src/material/progress-bar/progress-bar.ts` (MatProgressBar component + progress-bar.html template) | ported | Directive→component$; JSX template inlined; transitionend handler moved into useVisibleTask$ |
| `progress-bar/progress-bar-color.ts` | `src/material/progress-bar/progress-bar.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union |
| `progress-bar/progress-bar-mode.ts` | `src/material/progress-bar/progress-bar.ts` (ProgressBarMode type) | ported | Verbatim 4-value union |
| `progress-bar/progress-bar-config.ts` | `src/material/progress-bar/progress-bar.ts` (MatProgressBarDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matProgressBarConfig |
| `scss/progress-bar/progress-bar.scss` | `src/material/progress-bar/progress-bar.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — same rewrite as dialog + button + card + toolbar + badge ports |
| `scss/progress-bar/_progress-bar-theme.scss` | `src/material/progress-bar/_progress-bar-theme.scss` | synced | byte-identical copy |
| `scss/progress-bar/_m2-progress-bar.scss` | `src/material/progress-bar/_m2-progress-bar.scss` | synced | byte-identical copy |
| `scss/progress-bar/_m3-progress-bar.scss` | `src/material/progress-bar/_m3-progress-bar.scss` | synced | byte-identical copy |
| `scss/progress-bar/progress-bar-prebuilt.scss` | (qwik-material-specific) | new | @use progress-bar.scss + M3 :root defaults matching emitted --mat-progress-bar-* references |

Removed upstream files:
- `progress-bar-module.ts` → Qwik has no module concept
- `progress-bar.spec.ts` → ported to `mat-progress-bar-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint
- `testing/` (MatProgressBarTestingModule + harness) → Angular test harness surface; no equivalent needed

---

## 9. Explicit non-goals

- No client-side `matchMedia('(prefers-reduced-motion: reduce)')` — SCSS media queries handle it.
- No Angular Renderer2 abstraction — use JSX directly.
- No `EventEmitter` translation layer — `onAnimationEnd$` is the port's chosen shape.
- No FuncIRI SVG path munging (progress-bar has no SVG).
- No `numberAttribute` decorator emulation — port assumes JSX-time numeric values.
- No `_isNoopAnimation` mutable field — port reads `animationsDisabled` from context on every render.

---

## 10. Rough task decomposition

Plan-writer will refine, but the shape mirrors Badge/Icon exactly:

1. **Entry-point wiring** — package.json + vite.config.ts + intrinsic-elements.d.ts (with `mode` widening) + empty index.ts stub
2. **SCSS chain + prebuilt** — copy 4 upstream files (with the documented `@angular/cdk` rewrite in `progress-bar.scss`) + write progress-bar-prebuilt.scss with iterative `:root` reconciliation
3. **MatProgressBarColor type** — 3-value union + spec
4. **MatProgressBarMode type** — 4-value union + spec
5. **MatProgressBarConfig + MAT_PROGRESS_BAR_CONFIG** — interface + context id + spec
6. **MatProgressBar component** — mat-progress-bar.tsx with prop resolution + class ladder + inner template + transitionend `useVisibleTask$` + smoke spec
7. **Provider extension** — extend `QwikMaterialProvider` with `matProgressBarConfig?` field (8th `useContextProvider` call)
8. **Public API** — public-api.ts re-exports + swap index.ts stub for real re-export + build validation
9. **Vitest scenario port** — mat-progress-bar-scenarios.spec.tsx with restructured coverage
10. **Dev-app routes + Playwright specs** — 8 routes + 8 parity specs + root.tsx CSS import + index.tsx tile section
11. **SYNC.md + pipeline verification** — final `pnpm test:qwik-material` gate

Every task ends with a commit using scope `multiple` per the project-wide commit-msg hook constraint.
