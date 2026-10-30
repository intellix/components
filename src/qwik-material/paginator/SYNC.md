# qwik-material/paginator sync log

Tracks the sync state between this port and `src/material/paginator/` upstream. See also
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md` and
`docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`.

Last synced from upstream: the commit this branch (`port/paginator`) forked from.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
|------|---------------|------------|-------|
| `scss/paginator/paginator.scss` | `src/material/paginator/paginator.scss` | synced | cdk-stub swap only (`@use '@angular/cdk'` → `@use '../cdk-stub' as cdk`, used for `cdk.high-contrast`) |
| `scss/paginator/_m2-paginator.scss` | `src/material/paginator/_m2-paginator.scss` | synced | byte-identical |
| `scss/paginator/_m3-paginator.scss` | `src/material/paginator/_m3-paginator.scss` | synced | byte-identical |
| `scss/paginator/_paginator-theme.scss` | `src/material/paginator/_paginator-theme.scss` | synced | byte-identical, not referenced by the prebuilt CSS (same as every other `*-theme.scss`) |
| `scss/paginator/paginator-prebuilt.scss` | n/a | new | `@use './paginator'` only — every `--mat-paginator-*` token already has a real fallback baked in via `token-utils.slot(..., $fallbacks)`, same "no `:root` overrides needed" situation as `select-prebuilt.scss`'s |

## Mapped TypeScript/TSX files

Not a 1:1 file mapping:

- `mat-paginator.tsx` ← `MatPaginator`'s props, host rendering, nav-button click handlers,
  page-size `<MatSelect>` wiring.
- `paginator-nav-button.tsx` ← the combined `<button matIconButton ... [matTooltip]>` nav button —
  see "Why `PaginatorNavButton` exists" below for why this is its own component rather than
  composing `qwik-material/button`'s `<MatIconButton>` with `qwik-material/tooltip`'s
  `<MatTooltip as="button">`.
- `paginator-math.ts` ← every pure range/page-math function (`hasNextPage`/`hasPreviousPage`/
  `getNumberOfPages`/`_changePageSize`'s index arithmetic/`_updateDisplayedPageSizeOptions`'s
  list-shaping/the default `getRangeLabel` formula) — unit-tested directly in
  `paginator-math.spec.ts`, independent of Qwik entirely.
- `paginator-intl.ts` ← `MatPaginatorIntl` + its hardcoded English defaults (minus
  `getRangeLabel` — see Deviation 1 below) + the `MAT_PAGINATOR_INTL` context.
- `paginator-config.ts` ← `MatPaginatorDefaultOptions` + `MAT_PAGINATOR_DEFAULT_OPTIONS`, renamed
  `MatPaginatorConfig`/`MAT_PAGINATOR_CONFIG` to match this project's per-component config naming
  convention (`MatCheckboxConfig`, `MatFormFieldConfig`, …).

## Public API

```tsx
import {MatPaginator, type PageEvent} from '@angular-community/qwik-material/paginator';

<MatPaginator
  length={100}
  pageSize={pageSize.value}
  pageSizeOptions={[5, 10, 25]}
  showFirstLastButtons
  onPage$={(e: PageEvent) => {
    pageIndex.value = e.pageIndex;
    pageSize.value = e.pageSize;
  }}
/>
```

`MAT_PAGINATOR_CONFIG`/`MAT_PAGINATOR_INTL` are provided via
`<QwikMaterialProvider matPaginatorConfig={{...}} matPaginatorIntl={{...}}>` — see
`dialog/qwik-material-provider.tsx`. Every other per-component config in this project merges
field-by-field with a fallback default; `matPaginatorIntl` does NOT — a consumer supplying it
replaces the whole string bag, mirroring upstream's `providers: [{provide: MatPaginatorIntl,
useClass: ...}]` (a full service-instance swap, not a partial override). `matPaginatorConfig`
merges normally (`props.x ?? config.x ?? <upstream's own default>`).

### `pageIndex`/`pageSize` are read ONCE, then owned internally

See `mat-paginator.tsx`'s own module doc comment for the full write-up — same family of deviation
as `MatSelect`'s "why `value` is not a live, reactive prop." No scenario in this port's parity
contract ever reassigns either from OUTSIDE after mount (only `MatPaginator`'s own internal
navigation/page-size-change logic mutates them, exactly matching upstream's actual data flow for
every scenario here). A consumer needing to imperatively reset either after mount is not supported
yet.

## Deviations from upstream

1. **`MatPaginatorIntl.getRangeLabel` is NOT part of this port's intl interface — read before
   adding it back.** Confirmed live: a plain (non-`$()`) function anywhere Qwik's resumability
   serializer can reach — which a `useContextProvider`-provided value, or even `useContext`'s own
   fallback DEFAULT, both are — crashes the dev-app's SSR pass with `QError_verifySerializable`
   ("Code(3)") the instant anything triggers a pause/snapshot. This hit EVERY scenario, not just
   `custom-intl` (the hardcoded `DEFAULT_PAGINATOR_INTL.getRangeLabel = defaultRangeLabel` default
   crashed just as reliably as a custom one). This is the same "plain function crossing a
   serialization boundary" hazard `qwik-material/select/SYNC.md`'s `compareWith`/`sortComparator`
   deviation already documents, just hit for the first time by something that MUST be
   customizable (unlike `compareWith`, which this port simply never accepts) AND MUST produce a
   plain string synchronously during render (ruling out a `QRL`-ified version, which would make
   every call async). Fix: `MatPaginator` accepts a plain-STRING `rangeLabel` prop instead of a
   pluggable function — its own default calls `defaultRangeLabel` (`paginator-math.ts`) as a
   plain top-level import, never stored in a prop/context/signal, so nothing about it is ever
   reachable by Qwik's serializer. A consumer wanting the fully dynamic upstream behavior computes
   the string themselves from the SAME `pageIndex`/`pageSize`/`length` their own `onPage$` handler
   already receives — see the `custom-intl` dev-app route for exactly this.

2. **`MatPaginatorSelectConfig.disableOptionCentering` is accepted for API parity but has no
   effect** — same reason `qwik-material/select`'s own `disableOptionCentering` doesn't (it only
   ever affected a non-flexible positioning variant this port's `FlexibleConnectedPositionStrategy`
   usage doesn't have).

3. **No real `AriaDescriber`/hidden describedby elements anywhere in this package** — not needed;
   see "No `aria-describedby` at all" below for why the nav buttons specifically never render one.

4. **The `_displayedPageSizeOptions.length <= 1` branch (`<div
   class="mat-mdc-paginator-page-size-value">`) is implemented but not exercised by any parity
   scenario** — every scenario's `pageSizeOptions` has 3 entries. Same category of accepted gap as
   `qwik-material/select`'s own un-exercised `ariaLabel` input.

## Why `PaginatorNavButton` exists (read before trying to compose `MatIconButton` + `MatTooltip`)

Upstream's nav buttons are a SINGLE element carrying both `matIconButton` and `[matTooltip]`:
`<button matIconButton type="button" disabledInteractive [matTooltip]="..." ...>`. Neither
`qwik-material/button`'s `<MatIconButton>` nor `qwik-material/tooltip`'s `<MatTooltip as="button">`
can be composed to produce that — both are `component$`s that render their OWN `<button>` root;
nesting one inside the other adds a wrapper element, which fails DOM parity immediately (an extra
level of nesting Angular never has). `PaginatorNavButton` instead renders the combined markup
directly in one component, reusing:

- `button/internal/focus-indicator.tsx`, `button/internal/touch-target.tsx`,
  `button/internal/ripple-loader.ts` (`useRippleLoader`/`rippleLoaderHostAttrs`) — the SAME pieces
  `MatIconButton` itself is built from, imported via relative paths (these are internal, not part
  of `button`'s public API) — rather than duplicating them from scratch.
- `qwik-material/tooltip`'s EXPORTED `showTooltip`/`hideTooltip` runtime functions (its public
  API) for the real hover behavior, with only `mouseenter`/`mouseleave` wired via `useOn` (kept
  lazy per design-doc rule 7) — `MatTooltip`'s own touch-gesture/wheel-scroll-dismiss/
  keyboard-focus-show handling is NOT duplicated here (accepted gap; no scenario hovers a nav
  button at all — see `angular-parity.spec.ts`'s header). Escape-to-close and
  outside-click-to-close still work for free, since `showTooltip` wires both dispatchers
  internally regardless of which caller invoked it.

`disabledInteractive` is hardcoded true (every paginator nav button carries it unconditionally),
so this component doesn't expose it as a prop — see its own module doc comment for the exact
`_getDisabledAttribute()`/`_getTabIndex()` contract this implies (native `disabled` attribute
never rendered; `aria-disabled`/`tabindex="-1"` rendered exactly when `disabled` is true).

### No `aria-describedby` at all (confirmed live)

Every nav button sets BOTH `[attr.aria-label]="_intl.xLabel"` and `[matTooltip]="_intl.xLabel"` to
the SAME string. Upstream's `AriaDescriber._canBeDescribed()`
(`src/cdk/a11y/aria-describer/aria-describer.ts`) explicitly skips adding ANY description — no
`aria-describedby`, no hidden element — when the message exactly equals the host's current
`aria-label` ("we shouldn't set descriptions if they're exactly the same as the `aria-label` of an
element"), to avoid a screen reader announcing the same text twice. Since that's true for every
nav button in every scenario by construction, `PaginatorNavButton` never renders
`aria-describedby`/`cdk-describedby-host` at all — confirmed live against the real Angular
dev-app (absent on every nav button, every scenario). A hypothetical future consumer of this
component with a DIFFERENT `aria-label` than the tooltip message would need the full
`_canBeDescribed` check ported; nothing here exercises that.

### `mat-ripple-loader-disabled` mirrors upstream's REAL two-branch behavior, not a naive live echo

`MatRippleLoader.setDisabled()` (`src/material/core/private/ripple-loader.ts`) only touches the
`mat-ripple-loader-disabled` DOM ATTRIBUTE while a button's ripple has never been instantiated;
the moment a qualifying interaction creates it, every LATER `setDisabled()` call mutates the
ripple's own internal property only and never touches the attribute again — whatever it was at
the instant of first interaction is what it stays, forever, regardless of later `disabled`
changes. This is NOT a corner case for paginator: `show-first-last`'s own `click last` step clicks
a button that BECOMES disabled by that very click (the native ripple-triggering `mousedown` fires,
instantiating the ripple, before Angular's CD updates `_nextButtonsDisabled()`), while a SIBLING
button that merely becomes ENABLED by the same click (never interacted with directly) correctly
has its attribute removed (upstream's "never instantiated" branch still runs for it). Confirmed
live as a real diff on first attempt (a plain `rippleLoaderHostAttrs({disabled: props.disabled})`
spread got BOTH cases wrong — the sibling case additionally hit the exact "a spread prop's value
becoming `undefined` after a client re-render doesn't reliably get removed from the live DOM"
hazard `ripple-loader.ts`'s own doc comment already documents for `RIPPLE_UNINITIALIZED_ATTR`).
Fixed by reusing the EXISTING `rippleInitialized` signal `useRippleLoader()` already returns:
`rippleDisabledAttr` (a `useSignal`) tracks `props.disabled` live only while `!rippleInitialized
.value`, then freezes — mirroring upstream's "already instantiated → never touch the attribute
again" branch exactly — and is rendered as its own literal JSX attribute (never through the
buggy spread), same pattern as `RIPPLE_UNINITIALIZED_ATTR` itself.

#### Known residual (2026-10-30, `core/ripple/` remediation): 2 scenarios regressed

`show-first-last` and `interactions` fail after `useRippleLoader()` started firing real ripples
(previously it only inserted the static `.mat-ripple` span). Both scenarios click a nav button
that becomes disabled by that very click, then assert a SIBLING, never-directly-clicked button
(e.g. `previous`) correctly keeps live-tracking `disabled` into `mat-ripple-loader-disabled` — the
mechanism described just above, which is itself racing against a REAL upstream race ("whichever
happens first, ripple instantiation or the disabled-state change, wins" — upstream has the exact
same race, just with different timing characteristics). Confirmed via a worktree A/B test against
the pre-ripple-animation baseline (commit e9b742f86): reverting ONLY `button/internal/
ripple-loader.ts` back to its no-real-ripple-firing version makes both scenarios pass again — the
real ripple path's extra synchronous work (`getBoundingClientRect`/`getComputedStyle`, which
forces a style/layout recalc; required for the scale animation to actually play, not optional)
shifts this pre-existing race's timing enough to flip which value "wins" for the sibling button,
in this specific rapid double-click sequence. An attempted fix (replacing the sticky task's
`rippleInitialized`-signal-tracking gate with a direct `hostRef.value?.querySelector('.mat-ripple')`
DOM check, removing the cross-signal race) made MORE scenarios fail (`hide-page-size`,
`custom-intl` newly broke) and was reverted. Left as a known, documented gap — see `core/SYNC.md`'s
ripple section for the same writeup — same treatment this project already gives the pre-existing,
unrelated `material-timepicker` `min-max` failure. No other paginator behavior, and no OTHER
component's ripple firing/timing/DOM, is affected.

## Shared `qwik-material` changes this port needed

- **`qwik-material/select/mat-select.tsx`: echoes a literal `hidesingleselectionindicator` DOM
  attribute** whenever `cfg.hideSingleSelectionIndicator` resolves `true`. `paginator.html` writes
  `hideSingleSelectionIndicator` as a BARE, static HTML attribute (not a scenario choice), which
  Angular leaves in the live DOM verbatim (Material's own template emitting it, same category the
  harness's `CONSUMER_SELECTOR_ATTRS` comment already calls out as needing reproduction). No
  existing select scenario sets this prop true, so purely additive — see
  `qwik-material/select/SYNC.md`.
- **`qwik-material/core/mat-option.tsx` + `qwik-material/select/select-option-resolver.ts`: new
  `echoValueAttr` field (default `true`).** Every EXISTING select scenario's Angular mirror writes
  a STATIC, bracket-less `<mat-option value="apple">` (since every value there is a simple string
  literal an author wrote directly), which Angular echoes as a literal attribute — `MatOption`
  already matched that unconditionally. Upstream's REAL `paginator.html`, by contrast, writes
  `<mat-option [value]="pageSizeOption">` — a genuine property binding (the loop variable), which
  Angular does NOT echo as an attribute at all. `MatPaginator`'s own options now set
  `echoValueAttr: false`; every existing select scenario is unaffected (defaults `true`).
- **`qwik-material/form-field/mat-form-field.tsx`: `color` accepts `null` as a sentinel distinct
  from `undefined`.** `undefined` (prop omitted) falls back through `config.color` to `'primary'`,
  same as every other config field. `null` forces the result to resolve as literally unset —
  needed because Angular's own `MatFormField.color: ThemePalette = 'primary'` class-field default
  is preserved ONLY when a template never binds `[color]` at all; `paginator.html` ALWAYS writes
  `[color]="color"` (even though `MatPaginator`'s own `color` input is unset in every scenario
  here), which OVERWRITES that default with the literal `undefined` (a property binding always
  assigns, regardless of the bound value) — confirmed live: the embedded `<mat-select>`'s panel
  gets `mat-undefined` (`_parentFormField?.color` read as literally falsy via `select.html`'s
  strict `=== 'primary'`/`!color` checks), NOT `mat-primary`, unlike every OTHER select scenario's
  `<mat-form-field>` (which never binds `[color]`, so the default survives). JSX can't distinguish
  "prop omitted" from "prop bound to an `undefined` expression" — both are just `undefined` — so
  `MatPaginator` passes `color={props.color ?? null}` to signal the second case explicitly. Only
  affects what's exposed to the embedded control via `MAT_FORM_FIELD_CONTROL_STATE.color`
  (widened to `MatFormFieldColor | undefined` — `core/mat-form-field-control.ts`); the form
  field's OWN host classes are unaffected either way (`!== 'accent' && !== 'warn'` is true for
  `undefined` exactly as for `'primary'`, matching upstream's own, different, host-class formula).
- **`qwik-material/form-field/mat-form-field.tsx`: new `infixContent` prop.** Upstream's single
  unnamed `<ng-content>` inside `.mat-mdc-form-field-infix` projects every non-prefix/suffix
  child in source order, not just the one `MatFormFieldControl` — `paginator.html`'s
  `<div class="mat-mdc-paginator-touch-target" (click)="selectRef.open()">` is a sibling of
  `<mat-select>` inside that SAME infix. `infixContent` is rendered immediately after `control`,
  read directly off `props` on every render (no `control`-style frozen snapshot needed — it's
  plain host content, not a `component$()` with reactive state of its own). See
  `form-field/SYNC.md`'s deviation 10.
- **The page-size `<MatSelect>`'s "open via touch-target" click ALSO calls `.focus()` on the
  select** (`mat-paginator.tsx`'s `onTouchTargetClick$`) — confirmed live this is needed for a
  SEPARATE reason than opening the panel: `form-field.html`'s wrapper carries
  `(click)="_control.onContainerClick($event)"`, and `MatSelect.onContainerClick()` calls
  `this.focus(); this.open();` for ANY click landing inside the form field's own container
  (excluding clicks on an option/the panel/the backdrop) — including the touch-target, which lives
  inside that container via `infixContent`. Without the explicit `.focus()` call, the embedded
  form field never gained `mat-focused`/`mdc-text-field--focused` after a touch-target-driven
  open — a real, confirmed-live diff. This is NOT a general `MatFormField.onContainerClick` port
  (no other scenario needs one); it's handled locally, at the one call site that needs it.

## Verification

`specs/material-paginator/angular-parity.spec.ts` 7/7, run 3 times. Regression (components whose
shared infra this port touched): `specs/material-select` (10/10), `specs/material-form-field`,
`specs/material-button`, `specs/material-button-toggle`, `specs/material-tooltip` (99/99
combined), `specs/material-chips`, `specs/material-input` unaffected.
