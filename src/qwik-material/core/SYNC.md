# qwik-material/core sync log

Tracks the sync state between this port and `src/material/core/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
`src/qwik-material/checkbox/SYNC.md`, and `src/qwik-material/select/SYNC.md`.

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

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list + button-toggle + checkbox + core.

## MatInternalFormField (2026-10-27)

- Source: `src/material/core/internal-form-field/internal-form-field.{ts,scss}`
- Destination: `core/mat-internal-form-field.tsx`, `scss/core/internal-form-field/internal-form-field.scss` (byte-identical)
- Renders `div[mat-internal-form-field].mdc-form-field.mat-internal-form-field`
  (+ `mdc-form-field--align-end` for `labelPosition="before"`). Shared by
  checkbox, radio and slide-toggle. Its CSS ships in `core-prebuilt.css`
  (`scss/core/core-prebuilt.scss` now bundles pseudo-checkbox + internal form field).

## MatInternalFormField gains an `onClick$` prop (2026-10-28)

Added an optional `onClick$` prop (forwarded straight onto the rendered div)
for `checkbox/mat-checkbox.tsx` — the first real consumer, and upstream's
`checkbox.html` puts `(click)="_preventBubblingFromLabel($event)"` directly
on the same element that carries the `mat-internal-form-field` selector
(Angular lets a template bind both a component selector and a plain event on
one element; `_MatInternalFormField` itself has no click handling of its
own). No existing caller is affected — the prop defaults to `undefined`. See
`checkbox/SYNC.md`.

## `MatOption` / `MatOptgroup` (2026-10-28)

Added `mat-option.tsx` / `mat-optgroup.tsx`, porting
`src/material/core/option/{option,optgroup}.ts` + their `.html` templates +
synced SCSS. First consumer: `qwik-material/select`. Documented as reusable
by a future autocomplete/datepicker/timepicker port (upstream itself shares
these the same way).

### Upstream sync state

| File | Upstream path | Sync state |
|------|---------------|------------|
| `scss/core/option/option.scss` | `src/material/core/option/option.scss` | synced (cdk-stub swap only) |
| `scss/core/option/optgroup.scss` | `src/material/core/option/optgroup.scss` | synced, byte-identical |
| `scss/core/option/_m2-option.scss` / `_m3-option.scss` | same | synced, byte-identical |
| `scss/core/option/_m2-optgroup.scss` / `_m3-optgroup.scss` | same | synced, byte-identical |
| `scss/core/option/_option-theme.scss` / `_optgroup-theme.scss` | same | synced, byte-identical (not referenced by the prebuilt CSS — same as every other `*-theme.scss`, kept for completeness/custom-theming) |
| `scss/core/option/option-prebuilt.scss` | n/a (qwik-material-specific) | new — no `:root` overrides needed; every `--mat-option-*`/`--mat-optgroup-*` variable already gets a real fallback baked in via `token-utils.slot(..., $fallbacks)`, where `$fallbacks` resolves the default M3 system theme at Sass compile time (same situation as `list-prebuilt.scss`'s majority case) |

### Public API

```tsx
<MatOption id="mat-option-0" value="apple" selected={false} active={false}>
  Apple
</MatOption>
<MatOptgroup label="Grass" labelId="mat-optgroup-label-0">
  <MatOption .../>
</MatOptgroup>
```

Both are **plain, fully props-controlled presentational components** — they
own no internal state of their own. `selected`/`active`/`disabled` are
computed and passed in by whatever owns the option list (`MatSelect` today);
this mirrors upstream's `ActiveDescendantKeyManager` role declaratively (see
`qwik-cdk/a11y/key-manager/list-key-manager.ts`'s own doc comment: this
port's rendering model has no imperative `setActiveStyles()`/
`setInactiveStyles()` step left to port — "active" is just
`index === activeItemIndex`, re-rendered by whoever owns that signal).

Renders the literal `<mat-option>`/`<mat-optgroup>` custom elements (same
convention as `<mat-form-field>`/`<mat-pseudo-checkbox>` elsewhere in this
project — see `intrinsic-elements.d.ts`).

`id`/`labelId` are optional on the props (a fallback module-level id
generator mints one if omitted — the same "simplified singleton" pattern
`MatBadge`/`MatTooltip` already use for their own fallback ids) — in
practice every option `MatSelect` renders gets an explicit one from its own
`select-option-resolver.ts`, so this is a pure safety net for a
hypothetically standalone `<MatOption>`, not load-bearing for any parity
scenario.

### Deviations from upstream

- **No `<ng-content select="mat-icon">` slot.** No scenario in this port's
  current consumers projects an icon into an option. `content`/children are
  rendered as-is; a future consumer wanting an icon can simply put a
  `<MatIcon>` inside the children/`content` it hands to whatever's building
  the option list.
- **`MatOptgroup`'s `_inert` a11y mode (Safari-only VoiceOver workaround,
  upstream: `MatAutocomplete` sets `inertGroups`, `MatSelect` never does) is
  supported structurally (`inert` prop + `groupInertLabel` prop on
  `MatOption`, mirroring `option.html`'s `@if (group && group._inert)`
  visually-hidden span) but unexercised — no current consumer sets `inert`.
- **Ripple**: the option's own ripple container (`.mat-mdc-option-ripple
  .mat-focus-indicator`) is rendered as a static, always-present element
  with the bare `mat-ripple` directive-selector attribute — same "static
  containers, not the lazy JS behind them" scope line the remediation design
  doc draws for every other ripple-bearing component (radio/tab-label/
  slide-toggle already establish this exact pattern: a plain `mat-ripple`
  attribute + classes, no `MatRippleLoader`-style lazy-init machinery, which
  only button/icon-button/fab need). No interactive ripple animation is
  ported.

### `MAT_FORM_FIELD_CONNECTED_ORIGIN` / `MatFormFieldControlState` additions

`core/mat-form-field-control.ts` gained, for `qwik-material/select`:

- `MAT_FORM_FIELD_CONNECTED_ORIGIN` — a context carrying a `Signal` ref to
  `MatFormField`'s own `.mat-mdc-text-field-wrapper` div, the Qwik-port
  equivalent of upstream `MatFormField.getConnectedOverlayOrigin()`
  (returns `this._textField`, an `ElementRef` to that same wrapper).
- `MatFormFieldControlState.labelId` — the id of `MatFormField`'s own
  floating `<label>`, when it has one. Needed because `MatSelect` must build
  its own `aria-labelledby` itself (`disableAutomaticLabeling` means the
  label's `for` never points the other way).
- `MatFormFieldControlState.color` — the form field's resolved theme color,
  needed for `MatSelect`'s panel `mat-primary`/`mat-accent`/`mat-warn`/
  `mat-undefined` class.
- `MatFormFieldControlProps.disableAutomaticLabeling` — suppresses the
  floating label's `for` attribute. Also auto-derived from
  `controlType === 'mat-select'` in `mat-form-field.tsx`, so `MatSelect`
  doesn't need to pass it explicitly (see `form-field/SYNC.md`).

All additive; `MatInput`'s existing behavior is unchanged.

## `MatOption.echoValueAttr` / `MatFormFieldControlState.floatOverride` (2026-10-29, for `qwik-material/autocomplete`)

- `core/mat-option.tsx` gained an `echoValueAttr?: boolean` prop (default
  `true`, so `qwik-material/select`'s own usage — always static value
  bindings — is unaffected). See `qwik-material/autocomplete/SYNC.md`'s own
  write-up for why autocomplete's scenarios are a genuine mix of
  static/bound `value` attributes, unlike select's.
- `core/mat-form-field-control.ts`'s `MatFormFieldControlState` gained
  `floatOverride: boolean` (default `false`) — a manual label-float
  override a control can set independently of the form field's own
  `floatLabel` setting, mirroring upstream `MatFormField._shouldAlwaysFloat()`'s
  override half. `form-field/mat-form-field.tsx` ORs it into its own
  `alwaysFloat` computation. See `qwik-material/autocomplete/SYNC.md` for
  the full write-up (first and so far only consumer).

Both additive; `MatInput`'s/`MatSelect`'s existing behavior is unchanged.
