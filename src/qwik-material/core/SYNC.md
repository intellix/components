# qwik-material/core sync log

Tracks the sync state between this port and `src/material/core/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, and `src/qwik-material/button-toggle/SYNC.md`.

New entry point added 2026-10-27 as shared infrastructure for the
qwik-material DOM-parity remediation
(`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`):
first consumer is `button-toggle` (the `.mat-button-toggle-checkbox-wrapper`
indicator); upstream also uses `mat-pseudo-checkbox` for list selection and
`mat-select`, which will reuse this entry point when those are ported.

Upstream's `material/core/` folder holds many cross-cutting pieces (ripple,
animation, theming, option, selection, …), most of which already live under
`src/qwik-material/scss/core/` as shared SCSS (consumed via relative `@use`
from every other component's SCSS — not a TS entry point). This `core/`
folder is the TS-component counterpart: it holds the pieces of
`material/core/` that are actual *components*, mirroring upstream's location
rather than inventing a new one.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `core/mat-pseudo-checkbox.tsx` | `src/material/core/selection/pseudo-checkbox/pseudo-checkbox.ts` | ported | `template: ''` → self-closing `<mat-pseudo-checkbox>`. Reads `useAnimationsDisabled()` (shared with dialog/progress-bar/progress-spinner) for `_mat-animation-noopable`. `state`/`appearance` are echoed as literal DOM attributes (not just consumed for classes) — matches upstream: a *static* (non-bracket) template attribute that also happens to match a component `@Input()` name is both bound AND left as a literal attribute by Angular's compiler (see README.md's "static-attribute input echo" note); `disabled` is NOT echoed because upstream's only caller (`button-toggle.html`) binds it as `[disabled]="disabled"` (bracketed = consumed only, never echoed) |
| `scss/core/selection/pseudo-checkbox/pseudo-checkbox.scss` | `src/material/core/selection/pseudo-checkbox/pseudo-checkbox.scss` | synced | byte-identical copy; no `@angular/cdk` reference (grep-confirmed) |
| `scss/core/selection/pseudo-checkbox/_pseudo-checkbox-common.scss` | `src/material/core/selection/pseudo-checkbox/_pseudo-checkbox-common.scss` | synced | byte-identical copy |
| `scss/core/selection/pseudo-checkbox/_m2-pseudo-checkbox.scss` | `src/material/core/selection/pseudo-checkbox/_m2-pseudo-checkbox.scss` | synced | byte-identical copy |
| `scss/core/selection/pseudo-checkbox/_m3-pseudo-checkbox.scss` | `src/material/core/selection/pseudo-checkbox/_m3-pseudo-checkbox.scss` | synced | byte-identical copy |
| `scss/core/selection/pseudo-checkbox/_pseudo-checkbox-theme.scss` | `src/material/core/selection/pseudo-checkbox/_pseudo-checkbox-theme.scss` | synced | byte-identical copy; theme mixins inert on our end but kept for `diff -q` parity |
| `scss/core/style/_checkbox-common.scss` | `src/material/core/style/_checkbox-common.scss` | synced | byte-identical copy; new shared-SCSS dependency pseudo-checkbox.scss needed (`$size`/`$border-width`/`$transition-duration`) that no prior port had pulled in yet |
| `scss/core/selection/pseudo-checkbox/pseudo-checkbox-prebuilt.scss` | (qwik-material-specific) | new | `@use` pseudo-checkbox.scss + `:root` defaults for every `--mat-pseudo-checkbox-*` variable it emits. Only the fallback for pseudo-checkboxes rendered *outside* a component (like `MatButtonToggle`) that overrides the color variables itself — button-toggle.scss's own `.mat-button-toggle-appearance-standard .mat-pseudo-checkbox { --mat-pseudo-checkbox-minimal-*-selected-checkmark-color: … }` rules win inside that context |

## Removed upstream files

- `pseudo-checkbox-module.ts` — Qwik has no module concept
- `BUILD.bazel` — n/a to this build system

## Deviations from upstream

1. **No Angular DI / `@Component` decorator.** Plain `component$<MatPseudoCheckboxProps>`.
2. **`state`/`appearance`/`disabled` are plain props, not `@Input()`s**, but the DOM output intentionally still distinguishes "echoed as an attribute" (`state`, `appearance`) from "consumed only" (`disabled`) to match upstream's actual rendered DOM for its one current caller (button-toggle always passes `state`/`appearance` as static values and `disabled` as a variable one). A future caller that needs `state`/`appearance` to vary reactively without being echoed as a literal attribute would need a second prop (e.g. `stateNoEcho`) — not needed yet, no current caller does this.
3. **No `_CdkPrivateStyleLoader` / `_StructuralStylesLoader` lazy style injection.** This port's CSS is always-loaded prebuilt CSS, not Angular's per-app lazy stylesheet injection — N/A.

## Class count

`grep -rnE "^export class" src/qwik-material/core/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list + button-toggle + core.

## MatInternalFormField (2026-10-27)

- Source: `src/material/core/internal-form-field/internal-form-field.{ts,scss}`
- Destination: `core/mat-internal-form-field.tsx`, `scss/core/internal-form-field/internal-form-field.scss` (byte-identical)
- Renders `div[mat-internal-form-field].mdc-form-field.mat-internal-form-field`
  (+ `mdc-form-field--align-end` for `labelPosition="before"`). Shared by
  checkbox, radio and slide-toggle. Its CSS ships in `core-prebuilt.css`
  (`scss/core/core-prebuilt.scss` now bundles pseudo-checkbox + internal form field).
