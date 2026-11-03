# qwik-material/toolbar sync log

Tracks the sync state between this port and `src/material/toolbar/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
and `src/qwik-material/card/SYNC.md`.

## Upstream sync state

| File                                | Upstream path                                     | Sync state | Notes                                                                                    |
| ----------------------------------- | ------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `toolbar/mat-toolbar.tsx`           | `src/material/toolbar/toolbar.ts` (MatToolbar)    | ported     | Component→component$; renders <mat-toolbar>; explicit multipleRows prop replaces @ContentChildren |
| `toolbar/mat-toolbar-row.tsx`       | `src/material/toolbar/toolbar.ts` (MatToolbarRow) | ported     | Directive→component; renders <mat-toolbar-row>                                           |
| `toolbar/toolbar-color.ts`          | `src/material/toolbar/toolbar.ts` (color input type) | ported  | Narrowed from `string \| null` to `'primary' \| 'accent' \| 'warn'` union                |
| `toolbar/intrinsic-elements.d.ts`   | (qwik-material-specific)                          | new        | TS augmentation declaring 2 tag names as QwikIntrinsicElements['div']                    |
| `scss/toolbar/toolbar.scss`         | `src/material/toolbar/toolbar.scss`               | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` — `@angular/cdk` isn't resolvable in this build; only `cdk.high-contrast` is called, and `_cdk-stub.scss` defines it. Same rewrite as dialog + card + button ports. |
| `scss/toolbar/_toolbar-theme.scss`  | `src/material/toolbar/_toolbar-theme.scss`        | synced     | byte-identical copy                                                                      |
| `scss/toolbar/_m2-toolbar.scss`     | `src/material/toolbar/_m2-toolbar.scss`           | synced     | byte-identical copy                                                                      |
| `scss/toolbar/_m3-toolbar.scss`     | `src/material/toolbar/_m3-toolbar.scss`           | synced     | byte-identical copy                                                                      |
| `scss/toolbar/_toolbar-variables.scss` | `src/material/toolbar/_toolbar-variables.scss` | synced     | byte-identical copy                                                                      |
| `scss/toolbar/toolbar-prebuilt.scss` | (qwik-material-specific)                         | new        | `@use` toolbar.scss only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): every `--mat-toolbar-*` token already resolves through a `token-utils.slot(..., var(--mat-sys-*))` fallback chain baked in at Sass-compile time. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

## Removed upstream files

- `toolbar.html` → inlined into `mat-toolbar.tsx` (single unnamed Slot); breadcrumb at `toolbar.html.removed.md`
- `toolbar-module.ts` → Qwik has no module concept
- `toolbar.spec.ts` → port lives in `mat-toolbar-scenarios.spec.tsx` with restructured coverage per the smoke-only vitest constraint

## Deviations from upstream

1. **`multipleRows?: boolean` prop replaces upstream's `@ContentChildren(MatToolbarRow)` runtime detection.** Qwik has no equivalent reflection at render time; consumer opts in explicitly.
2. **`_checkToolbarMixedModes()` dev-mode error skipped.** Upstream throws in dev mode when consumers mix free content + `<mat-toolbar-row>` children. Deferred to a future qwik-material dev-mode subsystem.
3. **`throwToolbarMixedModesError` export omitted.** No consumers of the dev-error helper.
4. **`Platform` + `DOCUMENT` DI dropped.** Only used by the dev-mode check; irrelevant.
5. **Custom-element tag names (`mat-toolbar`, `mat-toolbar-row`) emitted verbatim** via IntrinsicElements augmentation (same pattern as Card).
6. **`toolbar.html` collapses into `mat-toolbar.tsx` JSX.** Single unnamed `<Slot />` — Qwik preserves child source order automatically, matching Angular's ordering of the two adjacent `<ng-content>` projections.
7. **QwikMaterialProvider NOT extended.** Upstream has no `MAT_TOOLBAR_CONFIG` token; per-instance `color` prop is the only consumer knob.
8. **`color` prop widened to `OpenString<MatToolbarColor>` (2026-11-03, open-ended-color task).** Upstream's real `color` Input (`src/material/toolbar/toolbar.ts:59`) is typed `string | null`, not `ThemePalette`. Fixed via `core/open-string.ts`'s `OpenString<T>`.

## Stub inventory delta

No new stubs — toolbar chain reused all existing dialog + button + card port stubs.

## Class count

`grep -nE "^export class" src/qwik-material/toolbar/**/*.ts src/qwik-material/toolbar/**/*.tsx`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar.
