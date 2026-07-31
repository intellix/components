# qwik-material/progress-bar sync log

Tracks the sync state between this port and `src/material/progress-bar/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, and `src/qwik-material/icon/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `progress-bar/mat-progress-bar.tsx` | `src/material/progress-bar/progress-bar.ts` (MatProgressBar component + progress-bar.html template) | ported | Directive→component$; JSX template inlined; transitionend handler moved into useVisibleTask$ (reads props at fire time) |
| `progress-bar/progress-bar-color.ts` | `src/material/progress-bar/progress-bar.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' | 'accent' | 'warn'` union |
| `progress-bar/progress-bar-mode.ts` | `src/material/progress-bar/progress-bar.ts` (ProgressBarMode type) | ported | Verbatim 4-value union |
| `progress-bar/progress-bar-config.ts` | `src/material/progress-bar/progress-bar.ts` (MatProgressBarDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matProgressBarConfig |
| `scss/progress-bar/progress-bar.scss` | `src/material/progress-bar/progress-bar.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — only `cdk.high-contrast` is called and `_cdk-stub.scss` defines it. Same rewrite as dialog + button + card + toolbar + badge ports. |
| `scss/progress-bar/_progress-bar-theme.scss` | `src/material/progress-bar/_progress-bar-theme.scss` | synced | byte-identical copy |
| `scss/progress-bar/_m2-progress-bar.scss` | `src/material/progress-bar/_m2-progress-bar.scss` | synced | byte-identical copy |
| `scss/progress-bar/_m3-progress-bar.scss` | `src/material/progress-bar/_m3-progress-bar.scss` | synced | byte-identical copy |
| `scss/progress-bar/progress-bar-prebuilt.scss` | (qwik-material-specific) | new | @use progress-bar.scss + M3 :root defaults matching emitted --mat-progress-bar-* references |

## Removed upstream files

- `progress-bar-module.ts` → Qwik has no module concept
- `progress-bar.html` → template inlined as JSX inside `mat-progress-bar.tsx`
- `testing/` (MatProgressBarTestingModule + harness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (see `public-api.ts`)
- `progress-bar.spec.ts` → ported to `mat-progress-bar-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-progress-bar>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation, widened to include the `mode` custom attribute (mirrors upstream's `[attr.mode]` host binding). Consistent with the CMS-parity constraint.
2. **`animationEnd: EventEmitter<{value: number}>` Output** → `onAnimationEnd$?: QRL<(value: number) => void>` prop, attached via `useVisibleTask$` + `addEventListener('transitionend')`. Filtered exactly like upstream's `_transitionendHandler`: target's classList contains `mdc-linear-progress__primary-bar` AND `mode ∈ {determinate, buffer}`.
3. **`_getAnimationsState()` `di-disabled` branch** replaced by `animationsDisabled = useAnimationsDisabled()` helper (established at Dialog port) which calls `useContext(MAT_ANIMATIONS_DISABLED, _ANIMATIONS_ENABLED_DEFAULT)` with a frozen `{value: false}` fallback — required to avoid a `QError_notFoundContext` (Code 13) SSR crash when the component renders outside a `<QwikMaterialProvider>` ancestor.
4. **`.mat-progress-bar-reduced-motion` class omitted.** Upstream's constructor detects reduced-motion via `_getAnimationsState()`. The port relies on the SCSS's own `@media (prefers-reduced-motion: reduce)` selectors to handle motion-reduced rendering. No client-side matchMedia.
5. **`MAT_PROGRESS_BAR_LOCATION` context omitted.** SSR-hostile Safari SPA-nav workaround; irrelevant to Qwik's resume model.
6. **`Renderer2` / `NgZone.runOutsideAngular` / `ChangeDetectorRef` omitted.** Qwik's reactivity + `useVisibleTask$` cover the same ground.
7. **`ProgressAnimationEnd` interface omitted.** Its only field (`{value: number}`) is inlined into the QRL signature.
8. **`ThemePalette` narrowed** to `MatProgressBarColor = 'primary' | 'accent' | 'warn'`.
9. **`numberAttribute` transform omitted.** Port accepts JSX `number` and clamps at render time via top-level `clamp()`.
10. **`MAT_PROGRESS_BAR_CONFIG` folded into `QwikMaterialProvider.matProgressBarConfig`.** 8th `useContextProvider` call.
11. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatProgressBarProps` and forwarded to `<mat-progress-bar>`. Icon-precedent adjudication.
12. **`intrinsic-elements.d.ts` widens `<mat-progress-bar>` to `QwikIntrinsicElements['div'] & {mode?: string}`.** The `mode` custom attribute mirrors upstream's `[attr.mode]` host binding. Same widening pattern as Icon's `fontIcon` attr.
13. **`useVisibleTask$` transitionend handler reads live prop values via the Qwik props proxy at fire time**, not render-time-derived locals. Ensures mid-animation `mode` swaps are respected in the filter.

## Stub inventory delta

No new stubs — the progress-bar SCSS chain calls only `cdk.high-contrast`, already provided by `_cdk-stub.scss` from prior ports. No additions to any existing stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/progress-bar/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar.
