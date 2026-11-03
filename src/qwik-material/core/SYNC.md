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

## 2026-11-02 rebaseline to v21.2.14 (8fe4d6a8ffcf)

Upstream's `core/tokens/_classes.scss` and `core/tokens/_system.scss`
both differ from v21.2.14 (`_classes.scss` now delegates its typography
mixins to a new `core/theming/_typography.scss` file that doesn't
exist at v21.2.14; `_system.scss` wraps every token-output line in a
new `_output-token()` mixin, added purely to silence a Sass compiler
warning) — but this port doesn't vendor either file at all; it
generates `scss/core/default-theme.scss` by actually *running*
`src/material/core/tokens/_system.scss`'s real `mat.theme()` mixin
against this worktree's own `src/material/`/`src/cdk/` source (see
"Default theme" below). Re-ran `node scripts/generate-default-theme.mjs`
against this worktree's v21.2.14 source: the output is byte-identical
to before — confirming the M3 token values/structure are unchanged,
only the upstream Sass's internal plumbing is. No action needed; no
other deviation found in this package's other token/style partials
(`_elevation.scss`, `_sass-utils.scss`, `_token-utils.scss`, the
`tokens/m3/*` files, etc. are deliberately-reduced stubs, not
documented byte-identical copies, so they're out of scope for this
check — see each file's own SYNC note if one exists).

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
| `scss/core/selection/pseudo-checkbox/pseudo-checkbox-prebuilt.scss` | (qwik-material-specific) | new | `@use` pseudo-checkbox.scss only — no `:root` token defaults (removed 2026-10-30, see "Default theme" below). Every `--mat-pseudo-checkbox-*` variable already carries a real M3 fallback to `--mat-sys-*` baked in via token-utils.slot(). Pseudo-checkboxes rendered *outside* a component (like `MatButtonToggle`) that overrides the color variables itself use that fallback — button-toggle.scss's own `.mat-button-toggle-appearance-standard .mat-pseudo-checkbox { --mat-pseudo-checkbox-minimal-*-selected-checkmark-color: … }` rules win inside that context |
| `scss/core/default-theme.scss` | (qwik-material-specific, generated) | new | The one default theme — see "Default theme" below |
| `scss/core/ripple/_ripple.scss` | `src/material/core/ripple/_ripple.scss` | synced | byte-identical except `@use '@angular/cdk'` → `@use '../../cdk-stub' as cdk` (same substitution as `_menu-common.scss`) |
| `scss/core/ripple/_m3-ripple.scss` | `src/material/core/ripple/_m3-ripple.scss` | synced | byte-identical copy |
| `scss/core/ripple/ripple-structure.scss` | `src/material/core/ripple/ripple-structure.scss` | synced | byte-identical copy. Upstream loads it on demand (`_MatRippleStylesLoader`); here `core-prebuilt.scss` always includes it. Missing until 2026-10-30, which left every `.mat-ripple-element` (e.g. slider hover/focus ripples) `position: static`, square and unclipped |
| `scss/core/focus-indicators/_private.scss` | `src/material/core/focus-indicators/_private.scss` | synced | was a simplified stub; now byte-identical except `@use '@angular/cdk'` → cdk-stub |
| `scss/core/focus-indicators/structural-styles.scss` | `src/material/core/focus-indicators/structural-styles.scss` | synced | byte-identical. Upstream loads it on demand (`_StructuralStylesLoader`); `core-prebuilt.scss` always includes it. Missing until 2026-10-30: no `.mat-focus-indicator { position: relative }` or `::before` ring anywhere |
| `scss/core/visually-hidden.scss` | `src/cdk/private/visually-hidden/visually-hidden.scss` | synced | same single include; the `a11y-visually-hidden` mixin is copied verbatim into `scss/_cdk-stub.scss`. Missing until 2026-10-30: `.cdk-visually-hidden` content (focus-trap anchors, screen-reader labels) rendered visibly |

## Default theme (2026-10-30)

**The bug this fixes:** every qwik-material `*-prebuilt.scss` used to declare
its own `:root { --mat-<component>-*: var(--mat-sys-*, <literal>); ... }`
block, plus some bare literal defaults (e.g. disabled-state
`rgba(0, 0, 0, 0.38)`). A CSS custom property's `var()` resolves at the
element where it's *declared* — so these `:root`-scoped defaults always won
over a consumer theme that sets `--mat-sys-*` on `body` or a class (as
Angular's own dev-app does: `src/dev-app/theme-m3.scss` scopes its theme to
`body:not(.demo-experimental-theme)` inside an `html { ... }` wrapper), and
the bare literals ignored the theme entirely. Upstream ships NO such
defaults: its structural CSS reads `var(--mat-<token>, <M3 fallback that
itself references var(--mat-sys-*)>)` resolved at the element, and the
*app* supplies `--mat-sys-*` via `mat.theme()`.

**The fix:** every `*-prebuilt.scss` across qwik-material (component dirs +
`core/selection/pseudo-checkbox/pseudo-checkbox-prebuilt.scss`) had its
`:root`/`html` component-token default block removed — see each file's own
header comment and its component's `SYNC.md` for the specifics (most
`--mat-<component>-*` tokens already carried a real M3 fallback to
`--mat-sys-*` baked in via `token-utils.slot()`, same as upstream; a few —
button's `--mdc-*` names, button-toggle's legacy-appearance tokens — had no
real consumer at all, matching upstream's own gaps). `button-prebuilt.scss`
kept its CSS-only click-burst rule (`.mat-mdc-button-persistent-ripple`
`::after`) untouched — unrelated to token defaults, owned by a parallel
task.

In its place, qwik-material now ships exactly ONE default theme:
`scss/core/default-theme.scss`, an `html { --mat-sys-*: ...; }` block
**generated** (never hand-written) from upstream's own Sass theming API —
`src/material/core/tokens/_system.scss`'s `mat.theme()` mixin — via:

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;
  @include mat.theme((
    color: mat.$azure-palette,
    typography: Roboto,
    density: 0,
  ));
}
```

This is the exact recipe `guides/theming.md`'s "Getting Started" section
documents (swapping its example `$violet-palette` for `$azure-palette` —
Angular's own documented default palette, and what the Angular dev-app's
`demo-experimental-theme` variant uses, see `src/dev-app/theme-m3.scss`).
`color-scheme: light dark;` is added alongside the mixin call, matching that
same guide example: passing a bare palette (no explicit `theme-type`)
defaults `mat.theme()` to `theme-type: color-scheme`, which emits every
color token as `light-dark(<light>, <dark>)` — a function that only
switches with the user's OS preference once something sets the CSS
`color-scheme` property (`mat.theme()` itself never emits that property).

It's scoped to `html` — Angular's own recommended theme scope — specifically
so a consumer theme on `html`/`body`/a class overrides it: declaring the
same `--mat-sys-*` custom property closer to (or equal to) the themed
subtree wins.

**Regenerating:** `node scripts/generate-default-theme.mjs` (from
`src/qwik-material/`, or `pnpm -C src/qwik-material generate-default-theme`).
The script (`scripts/generate-default-theme.mjs`) compiles the Sass entry
above with the real `sass` npm package, using a custom Sass file importer
that resolves the bare `@angular/material`/`@angular/cdk` specifiers
straight to this repo's `src/material/_index.scss`/`src/cdk/_index.scss` —
there is no published/built `@angular/material` package in `node_modules`
here, so plain `loadPaths` can't resolve those names on its own. Re-run it
whenever upstream's M3 token values, the chosen palette, or the
typography/density config should change; it overwrites
`scss/core/default-theme.scss` wholesale (do not hand-edit that file).

`core-prebuilt.scss` `@use`s `./default-theme` first, so every consumer that
imports `@angular-community/qwik-material/core-prebuilt.css` (the dev-app's
`root.tsx` does, before any other component's prebuilt CSS) gets this theme
automatically.

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
  .mat-focus-indicator`) is a static, always-present element with the bare
  `mat-ripple` directive-selector attribute — same "static container"
  pattern radio/tab-label/slide-toggle/etc. all have. As of the 2026-10-30
  `core/ripple/` remediation pass (see below), real `.mat-ripple-element`
  spans now launch into it on pointer events dispatched to the host
  `<mat-option>` (the "trigger" upstream's `[matRippleTrigger]="_getHostElement()"`
  points at).

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

## Date adapter abstraction — added 2026-10-29 for `qwik-material/timepicker`; pluggable
## adapter/formats/locale added 2026-11-03 for `qwik-material/datepicker` + `dateClass`

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `core/datetime/date-adapter.ts` | `src/material/core/datetime/date-adapter.ts` | ported | `DateAdapter<D>` is a plain TS **interface**, not an abstract class (Qwik's factory-function/class-without-inheritance-from-this-interface convention — see the module doc comment); upstream's CONCRETE base-class methods (`compareDate`/`compareTime`/`sameDate`/`sameTime`/`clampDate`/`getValidDateOrNull`/`deserialize`'s default) are ported as plain exported functions (`compareDateDefault`, etc.) any adapter implementation can delegate to, the same way `NativeDateAdapter extends DateAdapter` reused them upstream. `setLocale`/`localeChanges` ARE now ported (2026-11-03) — see `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS / MAT_DATE_LOCALE / dateClass" section, the canonical write-up for the whole pluggable-adapter design (this table only tracks file-level sync state). |
| `core/datetime/native-date-adapter.ts` | `src/material/core/datetime/native-date-adapter.ts` | ported | Now a real, exported `class NativeDateAdapter` (2026-11-03, so apps can `extends` it — see `datepicker/SYNC.md`), 1:1 port of every method incl. the UTC-stamping DST workaround (`_format` → `formatWithUtcWorkaround`), the lenient `TIME_REGEX` time parser, and the ISO-8601 `deserialize` override, PLUS `setLocale()`/`localeChanges` (a `Signal<number>` version counter, the Qwik-signal equivalent of upstream's RxJS `Subject`). `createNativeDateAdapter(locale = 'en-US')` remains as a thin `new NativeDateAdapter(locale)` wrapper for every pre-existing call site. Exports `DEFAULT_DATE_ADAPTER` — a process-wide `en-US` singleton (see below); its own `setLocale()` must never be called (process-wide, shared across concurrent SSR requests — see its own doc comment). |
| `core/datetime/date-formats.ts` | `src/material/core/datetime/date-formats.ts` | ported | `MatDateFormats` type (`unknown` instead of `any` for the per-field format options) + `MAT_DATE_FORMATS` **context id** (not an Angular `InjectionToken`), now wired by `QwikMaterialProvider`'s `matDateFormats` prop (2026-11-03). |
| `core/datetime/native-date-formats.ts` | `src/material/core/datetime/native-date-formats.ts` | synced | `MAT_NATIVE_DATE_FORMATS` — identical field values. |
| `core/datetime/use-date-adapter.ts` | n/a | new | `MAT_DATE_ADAPTER` (an INSTANCE context, narrow synchronous escape hatch) + `useDateAdapter()`/`useDateFormats()`, PLUS (2026-11-03) `MAT_DATE_ADAPTER_FACTORY` (a `QRL` **factory** context — never a live instance, see `datepicker/SYNC.md`) + `useDateAdapterFactory()` + `resolveDateAdapter()` + `MAT_DATE_LOCALE` (a `Signal<string>` context) + `useDateLocale()`. All fall back to the `en-US` native singleton/`MAT_NATIVE_DATE_FORMATS`/a fresh `useSignal('en-US')` via `useContext`'s default-value parameter when no `QwikMaterialProvider` is in scope. |

### Deviations from upstream

- ~~No live locale switching~~ — **ported, 2026-11-03.** See
  `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS / MAT_DATE_LOCALE /
  dateClass" section for the full design (a `Signal`-based mechanism, per
  this file's own earlier recommendation here — not RxJS).
- ~~No `QwikMaterialProvider` prop wires `MAT_DATE_ADAPTER`/`MAT_DATE_FORMATS`~~
  — **ported, 2026-11-03.** `QwikMaterialProvider` (`dialog/qwik-material-provider.tsx`)
  now has `matDateAdapterFactory`/`matDateFormats`/`matDateLocale` props,
  wiring `MAT_DATE_ADAPTER_FACTORY`/`MAT_DATE_FORMATS`/`MAT_DATE_LOCALE`.
  `matDateAdapterFactory` is a `QRL` factory (`noSerialize()` is NOT used
  for it — unlike the scroll-strategy factories above, QRLs are natively
  resumable, so wrapping one in `noSerialize()` would be actively wrong,
  not merely unnecessary).
- **`qwik-material/timepicker`'s/`qwik-material/datepicker`'s own INTERACTIVE
  runtime code (`timepicker-runtime.ts`/`datepicker-runtime.ts`) never calls
  `useDateAdapterFactory()`/`useDateFormats()`/`useDateLocale()` directly**
  — a `$()`-wrapped event handler isn't a component render context, so
  hooks can't be called from inside one. Each picker's own `useMatXxx()`
  hook resolves them ONCE, at hook-creation time (render-legal), and stashes
  them on the shared handle (`_dateAdapterFactory`/`_dateFormats`/
  `_locale`); runtime code reads those fields instead — see
  `datepicker/SYNC.md`'s own section for the full call chain and why a
  `QRL` factory (resolved fresh via `resolveDateAdapter()`/
  `resolveAdapterForPicker()`/`resolveAdapterForTimepicker()`), never a
  stored live instance, is what survives onto the handle.
- **No `ngDevMode`-gated throws** (`createDate`'s month/date range checks
  and `setTime`'s hour/minute/second range checks ARE ported as plain
  `throw Error(...)` calls, unconditionally — these are real bugs, not dev-
  mode assertions upstream itself gates; only the `ngDevMode &&`
  conditionality itself is dropped, matching every other port in this
  project).

## `MatOption.echoValueAttr` / `MatFormFieldControlState.floatOverride` (2026-10-29, for `qwik-material/autocomplete`, `qwik-material/paginator`, `qwik-material/timepicker`)

- `core/mat-option.tsx` gained an `echoValueAttr?: boolean` prop (default
  `true`, so `qwik-material/select`'s own usage — always static value
  bindings — is unaffected). Needed because several later consumers'
  scenarios bind `value` as a property (`[value]="..."`), which Angular
  never reflects as a DOM attribute, unlike a static `value="apple"`
  binding:
  - `qwik-material/autocomplete` — a genuine mix of static/bound `value`
    attributes; see that package's own `SYNC.md`.
  - `qwik-material/paginator` — its page-size `<mat-option>`s always bind
    `[value]`; see `qwik-material/paginator/SYNC.md`.
  - `qwik-material/timepicker` — upstream's own `timepicker.html` always
    writes `<mat-option [value]="option.value">`; confirmed live, a real
    timepicker `<mat-option>` has no `value` attribute at all. See
    `qwik-material/timepicker/SYNC.md`.
- `core/mat-form-field-control.ts`'s `MatFormFieldControlState` gained
  `floatOverride: boolean` (default `false`) — a manual label-float
  override a control can set independently of the form field's own
  `floatLabel` setting, mirroring upstream `MatFormField._shouldAlwaysFloat()`'s
  override half. `form-field/mat-form-field.tsx` ORs it into its own
  `alwaysFloat` computation. See `qwik-material/autocomplete/SYNC.md` for
  the full write-up (first and so far only consumer).

Both additive; `MatInput`'s/`MatSelect`'s existing behavior is unchanged.

## `core/ripple/` — MatRipple's interactive animation, 2026-10-30

Ports the actual click/touch-driven ripple *animation* that every other
ripple-related port in this project had deliberately deferred ("static
containers, not the lazy JS behind them" — see e.g. the option/radio/
button-toggle notes above). New, framework-free port of
`src/material/core/ripple/{ripple-ref,ripple-renderer}.ts`:

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `core/ripple/ripple-ref.ts` | `src/material/core/ripple/ripple-ref.ts` | ported | `RippleState`/`RippleConfig`/`RippleAnimationConfig`/`RippleRef` — verbatim, no Angular dependencies to remove |
| `core/ripple/ripple-renderer.ts` | `src/material/core/ripple/ripple-renderer.ts` | ported | `RippleRenderer` class: `fadeInRipple`/`fadeOutRipple`/`fadeOutAll`/`fadeOutAllNonPersistent`/`handleMouseDown`/`handleTouchStart`/`handlePointerUp`, `defaultRippleAnimationConfig` (225ms enter / 150ms exit), `distanceToFurthestCorner`, inlined `isFakeMousedownFromScreenReader`/`isFakeTouchstartFromScreenReader` (same "inline, no CDK import" convention `qwik-cdk/a11y`'s `input-modality-detector.ts` already uses for these). See file's own module doc comment for the 3 Angular-lifecycle pieces intentionally NOT ported (NgZone, Platform guard, `_MatRippleStylesLoader`) and the 2 Qwik-specific architecture departures (no `RippleEventManager` — superseded by Qwik's own `useOn`/event-prop delegation; no on-demand `addEventListener` for pointer-up — superseded by every caller's own declarative `onMouseUp$`/etc, needed to avoid a cross-chunk QRL-ordering race — see below) |
| `core/ripple/ripple-registry.ts` | n/a (Qwik-material-specific) | new | `WeakMap<Element, RippleRenderer>` keyed by the ripple CONTAINER element, standing in for upstream's one-`RippleRenderer`-per-directive-instance lifetime (Qwik has no equivalent long-lived instance object across a resume) |
| `core/ripple/ripple-dom.ts` | n/a (Qwik-material-specific) | new | The Qwik-facing API every component calls from inside its own `$()` handlers: `handleRippleEvent(event, container, target)` (the SOLE entry point, dispatching on `event.type` for all six pointer events), `launchRipple`/`fadeOutAllRipples`/`fadeOutAllNonPersistentRipples` (`MatRipple.launch()`/`fadeOutAll()`/`fadeOutAllNonPersistent()` equivalents — exposed for completeness; no current consumer needs them besides the pointer path, since the slider's own `.launch()` caller keeps its existing purpose-built `slider-ripple.ts`), and `rippleAnimationConfig(animationsDisabled, overrides)` (folds `_animationsDisabled` into a 0/0 duration override, matching `MatRipple.rippleConfig`'s/`MatRippleLoader._createRipple`'s own precedence) |
| `core/ripple/ripple-renderer.spec.ts` | `src/material/core/ripple/ripple.spec.ts` | ported (partial) | 33 vitest cases porting the meaningful behavioral assertions (sizing/furthest-corner math, centered/radius/color, default+custom animation config, full `RippleState` lifecycle, mousedown/touchstart/multi-touch/screen-reader-fake-event-filtering/synthetic-mouse-after-touch, `fadeOutAll`/`fadeOutAllNonPersistent`, persistent ripples, the registry, `handleRippleEvent`, `rippleAnimationConfig`). Dropped at the time this row was written: `MAT_RIPPLE_GLOBAL_OPTIONS` tests (no global-options system existed yet here — see the dedicated "Standalone `matRipple` directive + `MAT_RIPPLE_GLOBAL_OPTIONS`" section below for that, added 2026-11-03), `fixture.detectChanges()` mechanics, `ngOnDestroy` cleanup (no directive instance — a `WeakMap`-cached entry for a detached container is just GC'd) |

### Why no `RippleEventManager` port

Upstream delegates `mousedown`/`touchstart` through one document-level
capturing listener per event type, shared app-wide, specifically to avoid
registering a listener per ripple instance. Qwik's own `useOn()`/JSX event
props already install exactly one document-level listener per event type
(qwikloader) and dispatch to whichever element's serialized `on:<event>`
attribute matches — the identical optimization, already provided by the
framework every one of these components renders with. Porting
`RippleEventManager` on top would only duplicate it.

### Why pointer-up has no listener of its own (cross-chunk QRL-ordering race)

Upstream's `RippleRenderer.handleEvent` registers `mouseup`/`mouseleave`/
`touchend`/`touchcancel` directly on the trigger element, **on demand**,
from inside the `mousedown`/`touchstart` handler itself ("we do this
on-demand in order to reduce the total number of event listeners"). Ported
literally, this raced and lost on Qwik: a `$()` handler's body only runs
once its chunk has resolved — a real async gap, even on a warm cache, and a
much bigger one on a cold (never-loaded) one — so a fast real `mouseup`
(confirmed with any Playwright `.click()`, which dispatches the whole
mousedown→mouseup→click sequence with no artificial delay) could fire and
vanish before the on-demand `addEventListener` call inside the
still-resolving `mousedown` handler ever ran. The ripple's `_isPointerDown`
flag then never got reset, leaving it stuck in `VISIBLE` forever. Confirmed
live: the FULL `material-checkbox`/`material-radio`/`material-button-toggle`
parity suites initially failed 19/50, every one a leftover
`.mat-ripple-element` after the scenario's click step — these specific
suites exercise a plain, no-prior-hover click, which is exactly the
cold-chunk case.

Fixed by dropping the on-demand listener entirely: `RippleRenderer.
handlePointerUp()` is a plain public method with no DOM listener
attachment of its own, and every ripple-bearing component instead wires
**one shared `$()` reference** to all six pointer events
(`onMouseDown$`/`onMouseUp$`/`onMouseLeave$`/`onTouchStart$`/`onTouchEnd$`/
`onTouchCancel$`) via `ripple-dom.ts`'s `handleRippleEvent()`. Two things
make this correct where the on-demand version wasn't: (1) qwikloader's own
event-prop dispatch is already eager — a real native listener, present
from first paint, independent of whether any one handler's QRL chunk has
resolved — so the EVENT itself is never missed, only the handler body's
execution is deferred; (2) using the IDENTICAL QRL reference for every
event in the down/up pair means both resolve the same cached import
promise, and that promise's `.then()` callbacks run in FIFO order matching
the order the native events fired — a correctness guarantee two *separate*
QRLs (one per event type) do not have (a known project-wide hazard: QRL
invocations can resume out of order while chunks load independently).

### Components wired (every direct `matRipple`/lazy-`MatRippleLoader` upstream consumer)

Confirmed against upstream templates (`grep -rlnE '\bmat-ripple\b|\bmatRipple\b' src/material --include=*.html` plus `grep -rln MatRippleLoader src/material --include=*.ts`) — every hit is wired:

- **`MatRippleLoader` consumers** (lazy container creation, `button/internal/ripple-loader.ts`'s `useRippleLoader()`): button/icon-button/fab/mini-fab, chips (chip/chip-option/chip-row, via their own `chips/internal/ripple-loader.ts` copy), and every internal reuser of button's loader — paginator nav buttons, datepicker-toggle, timepicker-toggle, calendar-header's nav buttons.
- **Direct `[mat-ripple]`/`matRipple` consumers** (static container already existed; this pass added the pointer wiring): checkbox, radio, slide-toggle, button-toggle, core/`MatOption`, menu-item, stepper's `MatStepHeaderItem`, tabs' per-tab label ripple + both pagination buttons (`MatTabGroup`) and tab-link + both pagination buttons (`MatTabNav`).
- **Deliberately NOT touched**: slider (`slider-ripple.ts` is its own purpose-built three-slot hover/focus/active state machine, pre-existing and already parity-tested; left intact per the task's own instruction). List items, paginator's own non-nav-button surface, expansion, and datepicker's calendar-body have NO `matRipple`/`MatRippleLoader` upstream at all (confirmed by the same grep) — nothing to wire.

### `button-prebuilt.scss`'s CSS-only "click burst" deleted

`.mat-mdc-button-base > .mat-mdc-button-persistent-ripple { overflow: hidden; border-radius: inherit; &::after {...} }` (+ its `:active` companion) was a CSS-only stand-in for the animation this section now ports for real. Removed — it was also the source of the `PARITY_STYLES=1` `::after`/`overflow` diffs on every button-family and icon-button-based (paginator/datepicker/timepicker/calendar-header) component.

### Known residual: `material-paginator`'s sticky `mat-ripple-loader-disabled` attribute (2 scenarios)

`specs/material-paginator/angular-parity.spec.ts`'s `show-first-last` and
`interactions` scenarios fail after this change — both click a nav button
that *becomes disabled by that very click* (`first`/`last` under
`showFirstLastButtons`), then assert a SIBLING button (never directly
interacted with, e.g. `previous`) correctly keeps live-tracking its own
`disabled` state into `mat-ripple-loader-disabled`
(`paginator-nav-button.tsx`'s own `rippleDisabledAttr` sticky-freeze
mechanism — see that file's doc comment, itself describing an upstream race:
"whichever happens first, ripple instantiation or the disabled-state
change, wins"). Confirmed via a worktree A/B test against the pre-ripple
baseline commit (e9b742f86): reverting ONLY `button/internal/ripple-loader.ts`
back to its no-real-ripple version makes both scenarios pass again, so the
real ripple-firing path's extra synchronous work (`getBoundingClientRect`/
`getComputedStyle`, which forces a style/layout recalc — required for the
scale animation to play, not optional) is confirmed to shift this
PRE-EXISTING race's timing enough to flip which value "wins" for a sibling
button, in this one rapid double-click sequence. Attempted fix: replacing
the task's `rippleInitialized`-signal-tracking freeze gate with a direct
`hostRef.value?.querySelector('.mat-ripple')` DOM check (removing the
cross-signal race entirely) — this made MORE scenarios fail (`hide-page-size`,
`custom-intl` newly broke), so it was reverted; the mechanism's correct,
race-free fix needs more investigation than this pass budgeted for. Left as
a known, documented gap — same treatment as the pre-existing `material-
timepicker` `min-max` failure (unrelated, not caused by this change).
No OTHER component's ripple firing, timing, or DOM is affected.

## Standalone `matRipple` directive + `MAT_RIPPLE_GLOBAL_OPTIONS` (2026-11-03)

Upstream `src/material/core/ripple/ripple.ts`'s `MatRipple` directive (attachable to ANY element
via `[mat-ripple]`/`[matRipple]`) and `MAT_RIPPLE_GLOBAL_OPTIONS` — both previously unported (this
file used to say so above, in `ripple-renderer.spec.ts`'s row). The internal ripple ANIMATION
renderer this section already ported (`core/ripple/{ripple-renderer,ripple-dom,ripple-registry,
ripple-ref}.ts`) needed no changes to its own DOM/geometry logic — only a new Qwik-facing layer on
top, following this port's established "directive hook" pattern (`qwik-material/README.md`'s
"Composing directives"):

| File | Upstream | Status | Notes |
|---|---|---|---|
| `core/ripple/ripple-global-options.ts` | `ripple.ts`'s `RippleGlobalOptions`/`MAT_RIPPLE_GLOBAL_OPTIONS` | ported | `useRippleGlobalOptions()` reads the Qwik-context equivalent, falling back to `{}` (upstream's own un-provided default). Dropped: `namespace` (an Angular multi-root-injector DI concern with no equivalent here — this port's ripple-loaders are plain per-container `WeakMap` caches, not a namespaced registry) |
| `core/ripple/use-mat-ripple.ts` | `ripple.ts`'s `MatRipple` | ported | `useMatRipple(props)` — the directive-hook form. `hostProps` carries `.mat-ripple`/`.mat-ripple-unbounded` + (unless `trigger` is set) the six pointer handlers; `launch$`/`fadeOutAll$`/`fadeOutAllNonPersistent$` are QRLs (imperative methods, same convention as `useMatDialog().open$`/`close$` — a plain function closure captured into a DIFFERENT `$()` doesn't survive SSR→resume). `matRippleColor`/`matRippleUnbounded`/`matRippleCentered`/`matRippleRadius`/`matRippleAnimation`/`matRippleDisabled`/`matRippleTrigger` all ported; `rippleConfig`/`rippleDisabled` getters' exact upstream spread/precedence order (global → animations-disabled-forced-zero → local override; `terminateOnPointerUp` ONLY ever from global options, matching upstream having no per-instance input for it either) reproduced in `resolveRippleConfig()`/`resolveRippleDisabled()` |
| `core/ripple/mat-ripple.tsx` | n/a (qwik-material-specific) | new | `<MatRipple as="div"\|"span"\|"button"\|"a">` — thin wrapper component around `useMatRipple()`, same convention as `<MatTooltip>` around `useMatTooltip()`, for the common case of a ripple surface that doesn't need composing with another directive. `matRippleTrigger` isn't exposed on the component (needs two elements) — call the hook directly for that |

`MAT_RIPPLE_GLOBAL_OPTIONS` ALSO now reaches every built-in component's own internal ripple, via
one new optional 4th argument on `ripple-dom.ts`'s `handleRippleEvent(event, container, target,
globalOptions?)` — folding `globalOptions.disabled`/`.animation`/`.terminateOnPointerUp` into the
call in upstream's exact precedence order (see that function's own doc comment), fully backward
compatible (every pre-existing call omitting the 4th argument behaves exactly as before). Wired
into every consumer SAFE to touch from this worktree (reads `useRippleGlobalOptions()` at render
time, same as each already reads `useAnimationsDisabled()`, and passes it through): `button`/
`icon-button`/`fab`/`mini-fab`'s shared `internal/ripple-loader.ts`, `chips`' own
`internal/ripple-loader.ts` copy, `checkbox`, `radio`, core's `MatOption`, `menu-item`,
`slide-toggle`, every tab surface (`MatTabGroup`'s per-label ripple + both pagination buttons,
`MatTabLabelItem`, `MatTabLink`, `MatTabNav`'s pagination buttons), `button-toggle`
(`mat-button-toggle.tsx`) and `stepper` (`mat-step-header.tsx`, wired after the parallel
branches merged). `slider` is untouched for the same pre-existing reason the
section above already documents (`slider-ripple.ts` is its own purpose-built state machine, never
routed through `handleRippleEvent()` at all). List items have no ripple ported AT ALL yet (see
"Components wired" above) — nothing to wire for global options either.

Parity: upstream's `ripple-overview` docs example ported verbatim
(`qwik-material-examples/core/ripple-overview`, dev-app route `examples/ripple-overview`,
`specs/examples-misc/angular-parity.spec.ts`'s `EXAMPLE_IDS`) — passes except one documented,
pre-existing, unrelated gap (the example's three `[(ngModel)]`-bound checkboxes; see that spec's
`EXPECTED_FAILURES['ripple-overview']`). `MAT_RIPPLE_GLOBAL_OPTIONS` itself has no Angular-parity
counterpart to compare against (it's a DI token, not DOM) — covered instead by a bespoke,
Qwik-only functional spec (`specs/material-core/ripple-global-options.spec.ts`) against a bespoke
fixture route (`mat-ripple/global-options`), exercising `disabled` (on both the standalone
directive AND a built-in `MatButton` under the same provider), `terminateOnPointerUp`, and
`animation.exitDuration: 0`.

## `MatForm` — form submission for the default ErrorStateMatcher (2026-10-31)

`core/mat-form.tsx` (qwik-material-specific): `<MatForm>` renders the `<form>` and plays the part
of Angular's `FormGroupDirective`/`NgForm` that Material reads — `submitted` flips on submit (adding
`ng-submitted`, as `NgControlStatusGroup` does), the native submission is prevented
(`FormGroupDirective.onSubmit` returns `false`), and the controls inside read it via
`useMatFormSubmitted()` so their error state follows upstream's default `ErrorStateMatcher`:
`invalid && (touched || form.submitted)`. Wired into MatFormField, MatInput, MatSelect,
MatAutocomplete, MatDatepickerInput and MatTimepickerInput. Needed by the stepper-overview docs
example (`matStepperNext` is `type="submit"`).

## `MatFormSubmittedProvider` — submitted state for form libraries that own their own `<form>` (2026-11-02)

A form library (first consumer: Formisch — `@formisch/qwik`, see `qwik-material/README.md`'s
"Using with Formisch") renders its OWN `<form>` element (its `<Form>` component), so `<MatForm>`
can't wrap it — two nested `<form>`s isn't valid HTML, and the form library, not this port, owns
submission. `MatFormSubmittedProvider` (`core/mat-form.tsx`) provides the SAME `MAT_FORM` context
`<MatForm>` does, live-synced from an externally-owned `submitted` boolean prop, but renders
nothing but `<Slot/>` — no element of its own. `ng-submitted` still needs to land on the real
`<form>` the OTHER library renders; that goes through whatever mechanism it exposes for its own
host element's `class` (Formisch's `<Form>` forwards an ordinary `class` prop) — not a qwik-
material concern, since this provider never renders that element itself.

## `composeRef` — forwarding a consumer ref alongside a control's own internal ref (2026-11-02)

`core/host-props.ts`'s `composeRef()` (already used internally by `mergeHostProps()` for directive-
hook composition) is now also exported standalone and used directly by `MatInput`, `MatDatepickerInput`,
`MatTimepickerInput` and `MatAutocomplete`'s own `ref` props: each of those already needs ITS OWN
ref on the native element it renders (for focus/blur/input handling), so a plain `ref={props.ref}`
forward (the pattern `MatButton`/`MatIconButton`/`MatIcon` already use, having no internal ref of
their own) would have meant picking one or the other. `composeRef([internalRef, props.ref])` gives
the live element to both. Driving use case: a form library's field-registration ref (Formisch's
`field.props.ref`), needed for `focus()`-on-invalid-submit and similar programmatic-focus features
— see `qwik-material/README.md`'s "Using with Formisch".

## Fixed: `useContext(X, undefined)` for an optional ancestor context always threw (2026-11-02)

`MAT_FORM_FIELD_CONTROL_STATE`/`MAT_FORM_FIELD_CONNECTED_ORIGIN` (`core/mat-form-field-control.ts`)
are meant to be OPTIONAL — every consumer reads them with a fallback for "no `<MatFormField>`
ancestor" (`const formField = useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined); const
isInFormField = formField !== undefined;`). But Qwik's own `useContext(context, defaultValue)`
checks `defaultValue !== undefined` to decide whether a default was supplied AT ALL — passing the
literal value `undefined` is indistinguishable from passing none, so it throws
`QError_notFoundContext` (`Code(Q8)`) instead of returning it, every time there's genuinely no
provider. This exact Qwik behavior was already found and fixed once before, for the sibling
`MAT_ASSIGNED_ID` context — see `qwik-material/form-field/id-scope.ts`'s `useAssignedId()` — but
the same raw `useContext(X, undefined)` anti-pattern had independently spread to `MatInput`,
`MatSelect`, `MatAutocomplete`, `MatDatepickerInput`, `MatDateRangeInput`, and
`MatTimepickerInput` for these two contexts specifically, undetected because every scenario in
the whole 578-test parity suite nests its control in a `<MatFormField>` — surfaced porting the
qwik-material-docs site's `autocomplete-plain-input` example (the first-ever standalone, no-
form-field usage of any of them). Fixed centrally: this file now exports
`useOptionalFormFieldControlState()`/`useOptionalFormFieldConnectedOrigin()` (the same private-
`Symbol`-sentinel technique as `useAssignedId()`), and all 6 call sites were switched to them.
Zero behavior change with a `<MatFormField>` ancestor present (`pnpm -C src/qwik-material test`
783/783 unchanged, full parity suite unaffected) — only the previously-crashing standalone case
now works. See each affected component's own SYNC.md for its one-line pointer here.

## Fixed: the `Symbol` sentinel above (and `id-scope.ts`'s identical one) crashed real SSR with `Code(Q20)` (2026-11-02)

The fix just above swapped `useContext(X, undefined)` for `useContext(X, SENTINEL)`, using a
private `Symbol()` as `SENTINEL` — but a `Symbol` turns out to be the wrong sentinel TYPE,
independent of the `undefined`-detection bug it was fixing. Confirmed live (a genuine Qwik core
behavior, not a guess, found reading `useContext`'s own source): when the context is genuinely
missing, `useContext` calls its internal `set(defaultValue)`, which stores the default into the
component's serializable sequential-scope slot so the client can resume without re-resolving it.
Qwik's SSR serializer only recognizes a small whitelist of its OWN well-known internal `Symbol`s
(`NEEDS_COMPUTATION`, `STORE_ALL_PROPS`, `_UNINITIALIZED`, `explicitUndefined`) — any OTHER
`Symbol`, including a private sentinel like `NO_FORM_FIELD`/`NO_CONNECTED_ORIGIN` used to be,
falls through to `throw qError(20 /* QError.serializeErrorUnknownType */, [typeof value])` the
moment that component actually renders through a real SSR pass with the sentinel actually in use
(i.e. a genuinely-standalone control, not just one with the fallback code PATH defined). Vitest's
JSDOM-based unit tests never exercise real SSR-to-string serialization, so this stayed invisible
through the full 783/783-passing suite; it only surfaced building the qwik-material-docs site for
real, where `/components/autocomplete/overview/` (embedding `autocomplete-plain-input`, the one
example port-wide that renders a control standalone) crashed on every real SSR render with
`Code(Q20) symbol` — isolated to exactly that route via direct `server/entry.preview.js` fetches
of individual routes. `form-field/id-scope.ts`'s `NO_SCOPE` sentinel (the original template this
fix was modeled on) has the identical latent bug, confirmed by the same reasoning, and was fixed
the same way even though nothing in this project's shipped routes currently exercises its own
standalone (no `MatIdScope`/`MatFormField` ancestor) path through a real SSR build.

Fix: both sentinels are now a frozen plain object (`Object.freeze({})`), not a `Symbol` — plain
objects serialize fine under Qwik's generic object support. The `===` identity comparison that
distinguishes "sentinel came back" from "a real value came back" is unaffected (any unique
reference works for that; `Symbol` was never required). `pnpm -C src/qwik-material test` still
783/783 after the change; `pnpm -C src/qwik-material-docs build && pnpm exec playwright test
specs/docs-site` confirmed the crash gone.

## `ErrorStateMatcher` (2026-11-03, new entry point: `error-state-matcher.ts`)

Ports upstream's `ErrorStateMatcher`/`ShowOnDirtyErrorStateMatcher` pair (`src/material/core/
error/error-options.ts`) + the `[errorStateMatcher]` per-control `@Input()`/app-wide DI override
every real control honours. Qwik has no DI container and no class-instance injection (see
`mat-form-control.ts`'s own doc comment for why a plain class instance — or any plain function —
can't cross this port's component/serialization boundaries the way it does upstream), so this is
a plain, serializable union instead: `MatErrorStateMatcher = 'touched' | 'dirty' |
QRL<(state: MatErrorStateSnapshot) => boolean>` — `'touched'` mirrors upstream's DEFAULT
`ErrorStateMatcher` (`invalid && (touched || submitted)`), `'dirty'` mirrors
`ShowOnDirtyErrorStateMatcher` (`invalid && (dirty || submitted)`), and the QRL form mirrors a
custom `isErrorState(control, form)` override — see that file's own doc comment for the full
design, including why the two string modes are evaluated synchronously (`resolveErrorStateSync`)
but a QRL needs a `useSignal`+`useTask$` pair in every CONSUMING control (the SAME pattern
`qwik-material/select/mat-select.tsx`'s `triggerLabel`/`compareWith$` and
`qwik-material/datepicker/mat-month-view.tsx`'s `dateFilter`/`dateClass` resolution already
establish).

`MAT_ERROR_STATE_MATCHER` is the app-wide context id, wired into `<QwikMaterialProvider
errorStateMatcher={...}>` (`qwik-material/dialog/qwik-material-provider.tsx`) — added to
`QWIK_MATERIAL_CONTEXT_IDS` so it's automatically forwarded to dialogs/bottom-sheets rendered
outside the normal component tree, same as every other config context. `MatFormFieldControlProps`
(`mat-form-field-control.ts`) gained an `errorStateMatcher?: MatErrorStateMatcher` field so every
control sharing that contract (`MatInput`/`MatSelect`/`MatAutocomplete`/the datepicker+timepicker
inputs) gets the per-control override for free.

`core/mat-form.tsx` gained `useMatFormState()` (returns the live `MatFormState` STORE itself,
not just `useMatFormSubmitted()`'s already-unwrapped boolean) — needed so a consuming control's
`useTask$` can `track()` `submitted` LIVE (`track()` only establishes a subscription when it
reads a signal/store property directly inside its own callback; tracking an already-dereferenced
plain boolean captured in a closure does not).

Wired into every control that participates in `mat-form-field` error state: `MatInput`,
`MatSelect`, `MatAutocomplete`, `MatDatepickerInput`, `MatTimepickerInput`, and `MatFormField`'s
own independent `errorState` copy — see each one's own SYNC.md entry (`input/SYNC.md`'s is the
fullest write-up; the others are short pointers to it, since the mechanism is identical
everywhere). **Not wired:** `MatChipGrid` (`qwik-material/chips`) has no `touched`/`dirty`/
`invalid`/error-state concept at all today (`aria-invalid="false"` is hardcoded) — out of scope
for this change, a pre-existing gap independent of it; `MatDateRangeInput` has no `formBound`
concept of its own either (a separate, already-documented gap — see `specs/examples-forms/
angular-parity.spec.ts`'s `date-range-picker-forms` `EXPECTED_FAILURES` entry) and delegates to
two inner date inputs rather than computing its own error state.

First real consumer: `input-error-state-matcher` (material.angular.dev's docs example — the
upstream `MyErrorStateMatcher` class ported as a QRL, the first real exercise of the custom-
matcher path end-to-end through resume). Default-mode parity covered incidentally by every
existing `formBound` scenario across every wired control (unchanged behavior — `'touched'`
reproduces the exact formula each control hardcoded before this change). `'dirty'` mode + the
provider-level app-wide default vs. a per-control override are covered by a bespoke
`specs/material-form-field/error-state-matcher-modes.spec.ts`.

## Typography + elevation classes (2026-11-03)

Upstream's `mat.typography-hierarchy()` (`src/material/core/typography/_typography.scss`) and
`mat.elevation-classes()` (`src/material/core/_core.scss`) — both previously missing from this
port's prebuilt CSS entirely. Both are Sass MIXINS a consumer app calls directly (never called by
`mat.theme()` itself), so neither belongs in the always-loaded `core-prebuilt.css` — each ships as
its own new, separately opt-in file, generated (never hand-written) the same way
`scss/core/default-theme.scss` already is:

| File | Upstream | Status | Notes |
|---|---|---|---|
| `scripts/generate-typography-elevation-prebuilt.mjs` | n/a (qwik-material-specific) | new | Compiles both mixins against the REAL unmodified upstream Sass (same `@angular/material`-resolving importer `generate-default-theme.mjs` uses) and writes 3 files: the 2 below, plus a plain-CSS copy for the Angular parity mirror (`src/dev-app/qwik-parity/typography-elevation.generated.css`) — same generated text on both sides by construction, not by trusting two independently-written recipes to agree |
| `scss/core/typography-prebuilt.scss` → `typography-prebuilt.css` | `mat.typography-hierarchy($theme, '.mat-typography', true)` | new | `$theme` built via `mat.define-theme()` with `typography: (plain-family: Roboto, use-system-variables: true)` — `use-system-variables: true` is the part that makes every emitted rule read `font: var(--mat-sys-title-large)` etc. (confirmed: the SAME `--mat-sys-*` custom properties `scss/core/default-theme.scss` already declares) instead of literal, frozen-at-generation-time font values (`use-system-variables` defaults `false` in `mat.define-theme()`). `$back-compat: true` (3rd positional arg) additionally emits every M2-era class alias this port's consumers may use (`.mat-h1`...`.mat-h6`, `.mat-headline-1`...`.mat-headline-6`, `.mat-body`/`.mat-body-strong`/`.mat-body-2`, `.mat-small`/`.mat-caption`, `.mat-subtitle-1`/`.mat-subtitle-2`) alongside the M3 names (`.mat-display-large`, `.mat-headline-large`, `.mat-title-large`, `.mat-body-large`, …) and bare `h1`...`h6`/`p` selectors scoped under `.mat-typography` |
| `scss/core/elevation-prebuilt.scss` → `elevation-prebuilt.css` | `mat.elevation-classes()` | new | Takes NO theme argument — see "Known upstream quirk" below |
| `scripts/check-generated-scss.mjs` | n/a (qwik-material-specific) | new | Byte-parity check: re-compiles `default-theme.scss`/`typography-prebuilt.scss`/`elevation-prebuilt.scss` fresh from the real upstream Sass and diffs against the checked-in files — catches drift (a hand-edit, or an un-regenerated upstream source change). `pnpm -C src/qwik-material check-generated-scss` |

**Known upstream quirk, reproduced faithfully (confirmed against a REAL Angular 21.2.14 render,
not just the compiled Sass text — see below):** `mat.elevation-classes()` computes its
`box-shadow` fallback once, at Sass-compile-time, from `m3.$sys-theme` — upstream's own hardcoded
"every value is its own unwrapped CSS variable NAME" default map (`tokens/m3/_theme.scss`'s
`_create-system-app-vars-map`), completely independent of whatever real theme an app uses (there
is no theme argument to pass). `elevation.get-box-shadow()`'s internal `_compute-color-opacity()`
only wraps a shadow color in `rgba(...)` when it's a real Sass `color` value; `m3.$sys-theme`'s
`shadow` entry is the bare STRING `--mat-sys-shadow` (typeof "string"), so it's emitted completely
unwrapped inside the fallback — e.g. `box-shadow: var(--mat-app-elevation-shadow-level-4, 0px 2px
4px -1px --mat-sys-shadow, 0px 4px 5px 0px --mat-sys-shadow, 0px 1px 10px 0px --mat-sys-shadow);`.
`--mat-sys-shadow` appears BARE (not `var(--mat-sys-shadow)`) — invalid CSS for a `box-shadow`
color component. **Verified empirically, in a real browser, against the real Angular dev-app
reference (not assumed from reading Sass):** the whole declared value is therefore invalid, so
`box-shadow` computes to its initial value, `none` — on BOTH apps identically, for every one of
`.mat-elevation-z0`...`z24`, unless an app ALSO sets `--mat-app-elevation-shadow-level-N` itself
for each level it uses (bypassing the broken fallback entirely — upstream has no
`mat.elevation-overrides()`-style mixin for this; `mat.theme-overrides()` only recognizes
`--mat-sys-*` names, never `--mat-app-*`). This is a real, reproducible gap in upstream Angular
Material 21.2.14's `mat.elevation-classes()` when used standalone — not a Qwik-port bug, and not
something this port invents a fix for (ported behaviour must match upstream, bugs included). See
the Theming guide for the exact workaround an app needs if it wants visible elevation shadows.

Parity: a bespoke (non-upstream-example) scenario, `mat-core/typography` + `mat-core/elevation` —
Angular mirror `src/dev-app/qwik-parity/core.ts` (registered under the `mat-core` devAppId in
`routes.ts`; NOT part of the shared `:4201` reference server — build+run your OWN
`bazel run //src/dev-app:devserver -- --port=4213` from this worktree, see that file's own header
comment), Qwik route `src/qwik-cdk-dev-app/src/routes/mat-core/{typography,elevation}/`, parity
spec `specs/material-core/angular-parity.spec.ts`. Both `typography-prebuilt.css`/
`elevation-prebuilt.css` are loaded globally in the dev-app's `root.tsx` (same convention every
other `*-prebuilt.css` already follows there) — confirmed via the full regression suite that this
introduces no visual change for the handful of PRE-EXISTING examples that already use
`mat-elevation-z*` classes (`table-*`, `tab-group-dynamic-height`, `ripple-overview`): the newly-
available rule computes to the same `box-shadow: none` those elements already had with no rule at
all.
