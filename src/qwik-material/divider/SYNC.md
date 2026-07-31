# qwik-material/divider sync log

Tracks the sync state between this port and `src/material/divider/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`, and
`src/qwik-material/progress-spinner/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `divider/mat-divider.tsx` | `src/material/divider/divider.ts` (MatDivider component) | ported | Directive→component$; JSX self-closing element; BooleanInput coercion omitted (Qwik JSX passes booleans directly); reads MAT_DIVIDER_CONFIG with default for SSR safety |
| `divider/divider-config.ts` | (no upstream equivalent) | new | MatDividerConfig = {} interface + MAT_DIVIDER_CONFIG context id; folded into QwikMaterialProvider.matDividerConfig for family shape parity |
| `scss/divider/divider.scss` | `src/material/divider/divider.scss` | synced | byte-identical copy — no `@use '@angular/cdk'` present, unlike badge/toolbar/dialog/progress-bar/progress-spinner ports which needed the cdk-stub rewrite. Second port after Icon to skip the rewrite. |
| `scss/divider/_divider-theme.scss` | `src/material/divider/_divider-theme.scss` | synced | byte-identical copy |
| `scss/divider/_divider-offset.scss` | `src/material/divider/_divider-offset.scss` | synced | byte-identical copy |
| `scss/divider/_m2-divider.scss` | `src/material/divider/_m2-divider.scss` | synced | byte-identical copy |
| `scss/divider/_m3-divider.scss` | `src/material/divider/_m3-divider.scss` | synced | byte-identical copy |
| `scss/divider/divider-prebuilt.scss` | (qwik-material-specific) | new | @use divider.scss + M3 :root defaults matching emitted --mat-divider-* references |

## Removed upstream files

- `divider-module.ts` → Qwik has no module concept
- `testing/` (MatDividerHarness) → Angular test harness surface; no equivalent needed
- `public-api.ts` → replaced with our own re-export shape (§2.4)
- `divider.spec.ts` → ported to `mat-divider-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`<mat-divider>` custom-element tag preserved.** Emitted via `intrinsic-elements.d.ts` JSX augmentation. Typed as `QwikIntrinsicElements['hr']` (closest semantic HTML element — an `<hr>` IS a separator in HTML). No custom-attribute widening needed.
2. **`BooleanInput` + `coerceBooleanProperty` omitted.** Qwik JSX passes booleans directly; consumer writes `<MatDivider vertical={true}>` or omits the prop. No attribute-string coercion needed.
3. **`MAT_DIVIDER_CONFIG` folded into `QwikMaterialProvider.matDividerConfig`.** 10th `useContextProvider` call. Config is currently `{}` (no fields) — kept for family shape parity + future extensibility.
4. **Three explicit aria-* passthrough props** (`aria-label` / `aria-labelledby` / `aria-describedby`) declared on `MatDividerProps` and forwarded to `<mat-divider>`. Decorative default (`role="separator"` + `aria-orientation`) preserved; consumers may add labels.
5. **No `template: ''` explicit declaration.** Qwik's self-closing `<mat-divider />` renders an empty element naturally — matches upstream's empty template.
6. **`intrinsic-elements.d.ts` types `<mat-divider>` as `QwikIntrinsicElements['hr']`.** Semantic HTML closest match. No `& {mode?: string}`-style widening needed since divider emits no custom camelCase attributes.
7. **No `useVisibleTask$` / no lifecycle work.** Pure `(props, context) → JSX` component. No id counter, no signals, no event listeners.
8. **5 SCSS files copied byte-identical.** No `@angular/cdk` reference in any file (grep-confirmed) — no cdk-stub rewrite needed. Second port after Icon to skip the rewrite.

## Stub inventory delta

No new stubs — the divider SCSS chain does NOT reference `@angular/cdk` (unlike badge/toolbar/dialog/progress-bar/progress-spinner port SCSS which did). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

## Class count

`grep -rnE "^export class" src/qwik-material/divider/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider.
