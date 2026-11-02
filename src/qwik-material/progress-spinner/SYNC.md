# qwik-material/progress-spinner sync log

Tracks the sync state between this port and `src/material/progress-spinner/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`, and
`src/qwik-material/progress-bar/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `progress-spinner/mat-progress-spinner.tsx` | `src/material/progress-spinner/progress-spinner.ts` (MatProgressSpinner component + progress-spinner.html template) | ported | Directive→component$ factory; JSX template inlined; NgTemplateOutlet replaced by internal SpinnerCircle helper; MatSpinner ships as second real component (not const alias); all geometry helpers hoisted to top-level pure functions |
| `progress-spinner/progress-spinner-color.ts` | `src/material/progress-spinner/progress-spinner.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' \| 'accent' \| 'warn'` union |
| `progress-spinner/progress-spinner-mode.ts` | `src/material/progress-spinner/progress-spinner.ts` (ProgressSpinnerMode type) | ported | Verbatim 2-value union |
| `progress-spinner/progress-spinner-config.ts` | `src/material/progress-spinner/progress-spinner.ts` (MatProgressSpinnerDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matProgressSpinnerConfig; `_forceAnimations` field omitted |
| `scss/progress-spinner/progress-spinner.scss` | `src/material/progress-spinner/progress-spinner.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — only `cdk.high-contrast` is called (2 sites) and `_cdk-stub.scss` defines it. Same rewrite as dialog + button + card + toolbar + badge + progress-bar ports. |
| `scss/progress-spinner/_progress-spinner-theme.scss` | `src/material/progress-spinner/_progress-spinner-theme.scss` | synced | byte-identical copy |
| `scss/progress-spinner/_m2-progress-spinner.scss` | `src/material/progress-spinner/_m2-progress-spinner.scss` | synced | byte-identical copy |
| `scss/progress-spinner/_m3-progress-spinner.scss` | `src/material/progress-spinner/_m3-progress-spinner.scss` | synced | byte-identical copy |
| `scss/progress-spinner/progress-spinner-prebuilt.scss` | (qwik-material-specific) | new | `@use` progress-spinner.scss only — no `:root` token defaults (removed 2026-10-30, see `core/SYNC.md` "Default theme"): every `--mat-progress-spinner-*` token already carries a real fallback to `--mat-sys-*` baked in via `token-utils.slot()`, and the animation-multiplier default is already set structurally on `.mat-mdc-progress-spinner` itself |

## Removed upstream files

- `progress-spinner-module.ts` → Qwik has no module concept
- `progress-spinner.html` → template inlined as JSX inside `mat-progress-spinner.tsx` (with NgTemplateOutlet replaced by internal SpinnerCircle helper)
- `testing/` (MatProgressSpinnerTestingModule + harness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (§2.5)
- `progress-spinner.spec.ts` → ported to `mat-progress-spinner-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-progress-spinner>` AND `<mat-spinner>` custom-element tags both preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation — both tags widened to `QwikIntrinsicElements['div'] & {mode?: string}`.
2. **`MatSpinner` shipped as a separate real component**, NOT `export const MatSpinner = MatProgressSpinner` as upstream does. Qwik cannot sniff host tag name at constructor time; two components sharing a `createSpinner()` factory produce the same DOM shape with different host tag + different default mode.
3. **`_getAnimationsState()` `di-disabled` branch** replaced by `animationsDisabled = useAnimationsDisabled()` helper (established at Dialog port) which calls `useContext(MAT_ANIMATIONS_DISABLED, _ANIMATIONS_ENABLED_DEFAULT)` with a frozen `{value: false}` fallback — required to avoid a `QError_notFoundContext` (Code 13) SSR crash when the component renders outside a `<QwikMaterialProvider>` ancestor.
4. **`.mat-progress-spinner-reduced-motion` class omitted.** SCSS `@media (prefers-reduced-motion: reduce)` handles it. No client-side matchMedia.
5. **`_forceAnimations` config field omitted.** Obscure Angular DI toggle; `matAnimationsDisabled` context already gives consumers the escape hatch.
6. **`NgTemplateOutlet` template mechanism replaced by an internal `SpinnerCircle` helper component.** Upstream reuses one `<ng-template #circle>` across 4 render sites (1 determinate + 3 indeterminate clippers); the port inlines an internal component with the same output.
7. **`ViewChild('determinateSpinner')` reference omitted.** Port doesn't need reactive DOM node access.
8. **`numberAttribute` transforms omitted.** Port accepts JSX `number` and clamps `value` at render time via top-level `clampValue()`.
9. **`MAT_PROGRESS_SPINNER_CONFIG` folded into `QwikMaterialProvider.matProgressSpinnerConfig`.** 9th `useContextProvider` call.
10. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatProgressSpinnerProps` (and re-used by `MatSpinnerProps`) and forwarded to both host tags.
11. **`ThemePalette` narrowed** to `MatProgressSpinnerColor = 'primary' | 'accent' | 'warn'`.
12. **Deprecated Angular `MatSpinner` const alias** (`export const MatSpinner = MatProgressSpinner`) replaced by a first-class real component with distinct DOM tag (`<mat-spinner>`) and distinct default mode (`indeterminate`).
13. **`intrinsic-elements.d.ts` widens BOTH `<mat-progress-spinner>` AND `<mat-spinner>` to `QwikIntrinsicElements['div'] & {mode?: string}`.** Both tag types need the widening because both components emit the `mode` custom attribute.

## Stub inventory delta

No new stubs — the progress-spinner SCSS chain calls only `cdk.high-contrast` (2 sites), already provided by `_cdk-stub.scss` from prior ports. No additions to any existing stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/progress-spinner/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner.
