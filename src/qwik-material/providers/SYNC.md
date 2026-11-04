# qwik-material/providers sync log

Not a port of any single upstream file — upstream has no equivalent at all (Angular DI already
makes "provide this one token" compose correctly with everything else; this entry point exists
purely to give this Qwik port's hook-based configuration story a single, optional, convenient
front door). Tracks the design of `useMatProviders()` and its relationship to the individual
`useMat*Provider()` hooks it fans out to.

## Why this entry point exists (2026-11-04)

Every qwik-material configuration setting (icon font set, dialog/bottom-sheet/select/menu/
autocomplete defaults + scroll strategy, the app-wide `ErrorStateMatcher`, ripple options, the
pluggable date adapter, every `Mat*Config`, …) is configured with its OWN small hook —
`useMatButtonProvider()`, `useMatFormFieldProvider()`, `useMatDialogProvider()`, etc. — each one
calling `useContextProvider()` for ONLY its own context(s). This replaced the single
`<QwikMaterialProvider>` component (see `core/SYNC.md`'s dated entry for the removal) that used
to re-provide ALL of them from one component body, because that component's "provide everything
at once" shape didn't compose: configuring just one setting in a nested subtree meant the nested
`<QwikMaterialProvider>` had to ALSO repeat every setting an ancestor had already configured, or
silently reset them back to defaults for that subtree.

Calling 15 individual hooks at an app's root, one statement each, works but is repetitive for the
common case of "configure a handful of things once, near the root." `useMatProviders(config)` is
that convenience: pass an object whose keys name the settings you want, and it calls exactly
those hooks for you, in one line.

## The key → hook mapping

| `MatProvidersConfig` key | Hook called | Entry point |
| --- | --- | --- |
| `formField` | `useMatFormFieldProvider(config.formField)` | `form-field` |
| `dialog` | `useMatDialogProvider(config.dialog)` | `dialog` |
| `bottomSheet` | `useMatBottomSheetProvider(config.bottomSheet)` | `bottom-sheet` |
| `dateAdapter` | `useMatDateAdapterProvider(config.dateAdapter)` | `core` |
| `icons` | `useMatIconRegistryProvider(config.icons)` | `icon` |
| `tooltip` | `useMatTooltipProvider(config.tooltip)` | `tooltip` |
| `menu` | `useMatMenuProvider(config.menu)` | `menu` |
| `select` | `useMatSelectProvider(config.select)` | `select` |
| `autocomplete` | `useMatAutocompleteProvider(config.autocomplete)` | `autocomplete` |
| `ripple` | `useMatRippleProvider(config.ripple)` | `core` |
| `animationsDisabled` | `useMatAnimationsProvider(config.animationsDisabled)` | `dialog` |
| `errorStateMatcher` | `useMatErrorStateMatcherProvider(config.errorStateMatcher)` | `core` |
| `paginator` | `useMatPaginatorProvider(config.paginator)` | `paginator` |
| `stepper` | `useMatStepperProvider(config.stepper)` | `stepper` |
| `snackBar` | `useMatSnackBarProvider(config.snackBar)` | `snack-bar` |
| `input` | `useMatInputProvider(config.input)` | `input` |
| `button` | `useMatButtonProvider(config.button)` | `button` |
| `card` | `useMatCardProvider(config.card)` | `card` |
| `badge` | `useMatBadgeProvider(config.badge)` | `badge` |
| `icon` | `useMatIconProvider(config.icon)` | `icon` |
| `progressBar` | `useMatProgressBarProvider(config.progressBar)` | `progress-bar` |
| `progressSpinner` | `useMatProgressSpinnerProvider(config.progressSpinner)` | `progress-spinner` |
| `divider` | `useMatDividerProvider(config.divider)` | `divider` |
| `gridList` | `useMatGridListProvider(config.gridList)` | `grid-list` |
| `list` | `useMatListProvider(config.list)` | `list` |
| `buttonToggle` | `useMatButtonToggleProvider(config.buttonToggle)` | `button-toggle` |
| `slideToggle` | `useMatSlideToggleProvider(config.slideToggle)` | `slide-toggle` |
| `expansion` | `useMatExpansionProvider(config.expansion)` | `expansion` |
| `radio` | `useMatRadioProvider(config.radio)` | `radio` |
| `checkbox` | `useMatCheckboxProvider(config.checkbox)` | `checkbox` |
| `sort` | `useMatSortProvider(config.sort)` | `sort` |
| `tabs` | `useMatTabsProvider(config.tabs)` | `tabs` |
| `sidenav` | `useMatSidenavProvider(config.sidenav)` | `sidenav` |
| `chips` | `useMatChipsProvider(config.chips)` | `chips` |
| `timepicker` | `useMatTimepickerProvider(config.timepicker)` | `timepicker` |

`icons` (the SVG icon registry) and `icon` (`MatIconConfig` — color/default font-set) are
deliberately TWO separate keys — they're two unrelated contexts that happen to both belong to
the `icon` entry point. `snackBar` is not in the decision's own enumerated key list but IS one of
the "per-setting provider hooks" it separately requires (`useMatSnackBarProvider`); omitting it
from the combined hook would have been a real, user-visible gap (no way to configure snack bars
through `useMatProviders()` at all), so it's included here as the 35th key.

## Hook-order safety: freezing the key SET, not the values

Qwik (like every hooks-based rendering model) requires a component instance to call the exact
same SEQUENCE of hooks on every render. `useMatProviders()`'s body is, at a glance, a dynamic
fan-out over whatever `config` looks like THIS render — which would be a hook-order violation if
`config`'s key set could change between renders (adding a key mid-lifetime shifts every hook
called after it; see this repo's hard rule on conditional hooks).

The fix: `useConstant(() => new Set(Object.keys(config)))` captures the key SET exactly once, at
the first render, and every subsequent render calls exactly those keys' hooks — in the fixed
order the table above lists them — regardless of what `config` contains on THAT render. The
VALUES passed to each hook may freely change every render (that's the entire point of a provider
hook); the KEY SET may not. In dev (`isDev`), a key set that changes after the first render logs
a `console.error` naming both the first-render and current key sets, so the mistake surfaces
immediately rather than as a confusing "my new config key had no effect" bug report later.

Tested in `providers.spec.ts` (the pure `keySetOf`/`sameKeySet` set-equality logic — this
project's vitest environment hangs on `createDOM()`, so no test here renders a real multi-render
component; see that spec file's own header) and, for real, against a live DOM, in
`src/qwik-cdk-parity-tests/specs/material-core/providers.spec.ts`.

## What it returns

`useMatProviders()` returns `{dateLocale?, animationsDisabled?, icons?}` — the three provider
hooks that themselves return something useful (`useMatDateAdapterProvider()`'s locale signal,
`useMatAnimationsProvider()`'s disabled signal, `useMatIconRegistryProvider()`'s registry store),
present only when the corresponding key was in `config` on the first render. Every other hook
returns `void`, so there's nothing else to surface.

## Import direction

This entry point imports from every OTHER `qwik-material` entry point it needs (via this
package's own published name, `@angular-community/qwik-material/<entry>` — the same
cross-entry-point self-import `qwik-material/table` already established importing
`qwik-material/sort`'s `Sort`/`SortDirection` types) — never the reverse. No other entry point
imports from `providers`, so there's no cycle. `vite.config.ts`'s `entries` array lists
`providers` last for exactly this reason (it depends on everything above it, nothing above it
depends on it).
