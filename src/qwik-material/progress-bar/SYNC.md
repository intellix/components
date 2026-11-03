# qwik-material/progress-bar sync log

Tracks the sync state between this port and `src/material/progress-bar/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, and `src/qwik-material/icon/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `progress-bar/mat-progress-bar.tsx` | `src/material/progress-bar/progress-bar.ts` (MatProgressBar component + progress-bar.html template) | ported | Directive→component$; JSX template inlined; transitionend handler wired lazily via `useOn()` (reads props at fire time) — see deviation 2 |
| `progress-bar/progress-bar-color.ts` | `src/material/progress-bar/progress-bar.ts` (ThemePalette narrowing) | ported | Narrowed to `'primary' | 'accent' | 'warn'` union |
| `progress-bar/progress-bar-mode.ts` | `src/material/progress-bar/progress-bar.ts` (ProgressBarMode type) | ported | Verbatim 4-value union |
| `progress-bar/progress-bar-config.ts` | `src/material/progress-bar/progress-bar.ts` (MatProgressBarDefaultOptions) | ported | InjectionToken→createContextId; folded into QwikMaterialProvider.matProgressBarConfig |
| `scss/progress-bar/progress-bar.scss` | `src/material/progress-bar/progress-bar.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — only `cdk.high-contrast` is called and `_cdk-stub.scss` defines it. Same rewrite as dialog + button + card + toolbar + badge ports. |
| `scss/progress-bar/_progress-bar-theme.scss` | `src/material/progress-bar/_progress-bar-theme.scss` | synced | byte-identical copy |
| `scss/progress-bar/_m2-progress-bar.scss` | `src/material/progress-bar/_m2-progress-bar.scss` | synced | byte-identical copy |
| `scss/progress-bar/_m3-progress-bar.scss` | `src/material/progress-bar/_m3-progress-bar.scss` | synced | byte-identical copy |
| `scss/progress-bar/progress-bar-prebuilt.scss` | (qwik-material-specific) | new | `@use` progress-bar.scss only — no `:root` token defaults (removed 2026-10-30, see `core/SYNC.md` "Default theme"): every `--mat-progress-bar-*` token already carries a real fallback to `--mat-sys-*` baked in via `token-utils.slot()`, and the animation-multiplier default is already set structurally on `.mat-mdc-progress-bar` itself |

## Removed upstream files

- `progress-bar-module.ts` → Qwik has no module concept
- `progress-bar.html` → template inlined as JSX inside `mat-progress-bar.tsx`
- `testing/` (MatProgressBarTestingModule + harness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (see `public-api.ts`)
- `progress-bar.spec.ts` → ported to `mat-progress-bar-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-progress-bar>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation, widened to include the `mode` custom attribute (mirrors upstream's `[attr.mode]` host binding). Consistent with the CMS-parity constraint.
2. **`animationEnd: EventEmitter<{value: number}>` Output** → `onAnimationEnd$?: QRL<(value: number) => void>` prop, attached via `useOn('transitionend', ...)` (updated 2026-10-27, lazy-interactions remediation, rule 7 — no per-instance `useVisibleTask$` for interaction/measuring plumbing in components that appear many times per page; previously wired via `useVisibleTask$` + `addEventListener`, which loaded+ran its handler chunk on every resumed instance regardless of whether a transition ever fired). `transitionend` bubbles, so a host-level `useOn()` listener sees the same bubbled events the old host-level `addEventListener` call did — `useOn()` attaches a serialized `on:transitionend` reference to the component's own host (`<mat-progress-bar>`) at SSR time, and qwikloader loads/runs the handler only the first time a transition actually completes on it (e.g. never for an `indeterminate`/`query` bar). Filtered exactly like upstream's `_transitionendHandler`: target's classList contains `mdc-linear-progress__primary-bar` AND `mode ∈ {determinate, buffer}`. No `hostRef`/`ref` plumbing needed — `useOn()`'s handler would receive the host element as its second argument if required, but the filter only needs `event.target`.
3. **`_getAnimationsState()` `di-disabled` branch** replaced by `animationsDisabled = useAnimationsDisabled()` helper (established at Dialog port) which calls `useContext(MAT_ANIMATIONS_DISABLED, _ANIMATIONS_ENABLED_DEFAULT)` with a frozen `{value: false}` fallback — required to avoid a `QError_notFoundContext` (Code 13) SSR crash when the component renders outside a `<QwikMaterialProvider>` ancestor.
4. **`.mat-progress-bar-reduced-motion` class omitted.** Upstream's constructor detects reduced-motion via `_getAnimationsState()`. The port relies on the SCSS's own `@media (prefers-reduced-motion: reduce)` selectors to handle motion-reduced rendering. No client-side matchMedia.
5. **`MAT_PROGRESS_BAR_LOCATION` context omitted.** SSR-hostile Safari SPA-nav workaround; irrelevant to Qwik's resume model.
6. **`Renderer2` / `NgZone.runOutsideAngular` / `ChangeDetectorRef` omitted.** Qwik's reactivity + `useOn()` cover the same ground.
7. **`ProgressAnimationEnd` interface omitted.** Its only field (`{value: number}`) is inlined into the QRL signature.
8. **`ThemePalette` narrowed** to `MatProgressBarColor = 'primary' | 'accent' | 'warn'`.
9. **`numberAttribute` transform omitted.** Port accepts JSX `number` and clamps at render time via top-level `clamp()`.
10. **`MAT_PROGRESS_BAR_CONFIG` folded into `QwikMaterialProvider.matProgressBarConfig`.** 8th `useContextProvider` call.
11. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatProgressBarProps` and forwarded to `<mat-progress-bar>`. Icon-precedent adjudication.
12. **`intrinsic-elements.d.ts` widens `<mat-progress-bar>` to `QwikIntrinsicElements['div'] & {mode?: string}`.** The `mode` custom attribute mirrors upstream's `[attr.mode]` host binding. Same widening pattern as Icon's `fontIcon` attr.
13. **`useOn('transitionend', ...)` handler reads live prop values via the Qwik props proxy at fire time**, not render-time-derived locals. Ensures mid-animation `mode` swaps are respected in the filter.
14. **`color` prop widened to `OpenString<MatProgressBarColor>` (2026-11-03, open-ended-color task).** Upstream's real `color` setter (`src/material/progress-bar/progress-bar.ts:156`) is typed `string | null | undefined`, not `ThemePalette` (deviation #8 above narrowed it incorrectly). Fixed by widening just the prop (not `MatProgressBarConfig.color`) to `OpenString<MatProgressBarColor>` (`core/open-string.ts`).

## Stub inventory delta

No new stubs — the progress-bar SCSS chain calls only `cdk.high-contrast`, already provided by `_cdk-stub.scss` from prior ports. No additions to any existing stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/progress-bar/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar.
