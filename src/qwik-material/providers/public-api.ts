// Public API for @angular-community/qwik-material/providers.
//
// A single convenience hook, `useMatProviders()`, that fans out to every individual
// `useMat*Provider()` hook the rest of this library exports — see each hook's own entry
// point for the narrower, single-context alternative. This entry point ONLY imports from
// other `qwik-material` entry points, never the other way around, so it can't introduce an
// import cycle (same convention `qwik-material/table` already establishes importing
// `qwik-material/sort`).
//
// See providers/SYNC.md for the full design writeup (hook-order/key-freezing rationale,
// migration notes from the removed `<QwikMaterialProvider>`/`<MatIconRegistryProvider>`
// components).

import {useConstant, isDev, type Signal} from '@qwik.dev/core';
import type {StepperOptions} from '@angular-community/qwik-cdk/stepper';
import {
  useMatFormFieldProvider,
  type MatFormFieldConfig,
} from '@angular-community/qwik-material/form-field';
import {useMatInputProvider, type MatInputConfig} from '@angular-community/qwik-material/input';
import {
  useMatDialogProvider,
  useMatAnimationsProvider,
  type MatDialogProviderConfig,
} from '@angular-community/qwik-material/dialog';
import {
  useMatBottomSheetProvider,
  type MatBottomSheetProviderConfig,
} from '@angular-community/qwik-material/bottom-sheet';
import {useMatSnackBarProvider} from '@angular-community/qwik-material/snack-bar';
import type {MatSnackBarConfig} from '@angular-community/qwik-material/snack-bar';
import {
  useMatDateAdapterProvider,
  useMatErrorStateMatcherProvider,
  useMatRippleProvider,
  type MatDateAdapterProviderConfig,
  type MatErrorStateMatcher,
  type RippleGlobalOptions,
} from '@angular-community/qwik-material/core';
import {
  useMatIconRegistryProvider,
  useMatIconProvider,
  type MatIconRegistrySeed,
  type MatIconRegistryStore,
  type MatIconConfig,
} from '@angular-community/qwik-material/icon';
import {
  useMatTooltipProvider,
  type MatTooltipDefaultOptions,
} from '@angular-community/qwik-material/tooltip';
import {
  useMatMenuProvider,
  type MatMenuProviderConfig,
} from '@angular-community/qwik-material/menu';
import {
  useMatSelectProvider,
  type MatSelectProviderConfig,
} from '@angular-community/qwik-material/select';
import {
  useMatAutocompleteProvider,
  type MatAutocompleteProviderConfig,
} from '@angular-community/qwik-material/autocomplete';
import {
  useMatPaginatorProvider,
  type MatPaginatorProviderConfig,
} from '@angular-community/qwik-material/paginator';
import {useMatStepperProvider} from '@angular-community/qwik-material/stepper';
import {useMatButtonProvider, type MatButtonConfig} from '@angular-community/qwik-material/button';
import {useMatCardProvider, type MatCardConfig} from '@angular-community/qwik-material/card';
import {useMatBadgeProvider, type MatBadgeConfig} from '@angular-community/qwik-material/badge';
import {
  useMatProgressBarProvider,
  type MatProgressBarConfig,
} from '@angular-community/qwik-material/progress-bar';
import {
  useMatProgressSpinnerProvider,
  type MatProgressSpinnerConfig,
} from '@angular-community/qwik-material/progress-spinner';
import {
  useMatDividerProvider,
  type MatDividerConfig,
} from '@angular-community/qwik-material/divider';
import {
  useMatGridListProvider,
  type MatGridListConfig,
} from '@angular-community/qwik-material/grid-list';
import {useMatListProvider, type MatListConfig} from '@angular-community/qwik-material/list';
import {
  useMatButtonToggleProvider,
  type MatButtonToggleConfig,
} from '@angular-community/qwik-material/button-toggle';
import {
  useMatSlideToggleProvider,
  type MatSlideToggleConfig,
} from '@angular-community/qwik-material/slide-toggle';
import {
  useMatExpansionProvider,
  type MatExpansionConfig,
} from '@angular-community/qwik-material/expansion';
import {useMatRadioProvider, type MatRadioConfig} from '@angular-community/qwik-material/radio';
import {
  useMatCheckboxProvider,
  type MatCheckboxConfig,
} from '@angular-community/qwik-material/checkbox';
import {useMatSortProvider, type MatSortConfig} from '@angular-community/qwik-material/sort';
import {useMatTabsProvider, type MatTabsConfig} from '@angular-community/qwik-material/tabs';
import {
  useMatSidenavProvider,
  type MatSidenavConfig,
} from '@angular-community/qwik-material/sidenav';
import {useMatChipsProvider, type MatChipsConfig} from '@angular-community/qwik-material/chips';
import {
  useMatTimepickerProvider,
  type MatTimepickerConfig,
} from '@angular-community/qwik-material/timepicker';

/**
 * Configuration accepted by {@link useMatProviders}. Every field is optional — a key that's
 * OMITTED means "don't provide this context at all" (so an ancestor's own value, if any, or
 * the library's own no-provider default, is what descendants see), NOT "provide the empty
 * default" (that distinction matters: `{}` and omission behave identically for most of these
 * configs today, but aren't guaranteed to stay that way for every one forever).
 *
 * See `providers/SYNC.md` for the full key → hook mapping table.
 */
export interface MatProvidersConfig {
  formField?: MatFormFieldConfig;
  dialog?: MatDialogProviderConfig;
  bottomSheet?: MatBottomSheetProviderConfig;
  dateAdapter?: MatDateAdapterProviderConfig;
  icons?: MatIconRegistrySeed;
  tooltip?: MatTooltipDefaultOptions;
  menu?: MatMenuProviderConfig;
  select?: MatSelectProviderConfig;
  autocomplete?: MatAutocompleteProviderConfig;
  ripple?: RippleGlobalOptions;
  animationsDisabled?: boolean;
  errorStateMatcher?: MatErrorStateMatcher;
  paginator?: MatPaginatorProviderConfig;
  stepper?: StepperOptions;
  snackBar?: Partial<MatSnackBarConfig>;
  input?: MatInputConfig;
  button?: MatButtonConfig;
  card?: MatCardConfig;
  badge?: MatBadgeConfig;
  icon?: MatIconConfig;
  progressBar?: MatProgressBarConfig;
  progressSpinner?: MatProgressSpinnerConfig;
  divider?: MatDividerConfig;
  gridList?: MatGridListConfig;
  list?: MatListConfig;
  buttonToggle?: MatButtonToggleConfig;
  slideToggle?: MatSlideToggleConfig;
  expansion?: MatExpansionConfig;
  radio?: MatRadioConfig;
  checkbox?: MatCheckboxConfig;
  sort?: MatSortConfig;
  tabs?: MatTabsConfig;
  sidenav?: MatSidenavConfig;
  chips?: MatChipsConfig;
  timepicker?: MatTimepickerConfig;
}

/** Handles returned by {@link useMatProviders} for the few provider hooks that return
 *  something useful of their own — `undefined` for any key `config` didn't include on first
 *  render. */
export interface MatProvidersHandles {
  /** The locale `Signal<string>` from `useMatDateAdapterProvider()` — write `.value` to
   *  switch locale at runtime. Only set if `config.dateAdapter` was present on first render. */
  dateLocale?: Signal<string>;
  /** The animations-disabled `Signal<boolean>` from `useMatAnimationsProvider()` — write
   *  `.value` to toggle animations at runtime. Only set if `config.animationsDisabled` was
   *  present (even as `false`) on first render. */
  animationsDisabled?: Signal<boolean>;
  /** The icon registry store from `useMatIconRegistryProvider()` — pass to `addSvgIcon()`
   *  (etc.) to register more icons later. Only set if `config.icons` was present on first
   *  render. */
  icons?: MatIconRegistryStore;
}

/**
 * The full, fixed, ordered list of keys {@link useMatProviders} understands. Order here is
 * the order hooks are called in — it never changes release-to-release without a major-version
 * note, since reordering would change which hook-call-site corresponds to which internal
 * `useSignal`/`useContextProvider` SLOT for any caller relying on a frozen key set that
 * previously keyed off position (none should — the mapping is by NAME, via the `switch`
 * below — but the list is kept textually stable anyway, for the same "don't disturb what
 * doesn't need to move" reason the individual config files' own field orders are kept stable).
 */
export type ProviderKey = keyof MatProvidersConfig;

/** @docs-private — exported only for `providers.spec.ts` to assert against (no duplicates,
 *  exactly the keys `MatProvidersConfig` declares). Not meant for app code to rely on. */
export const ALL_PROVIDER_KEYS: readonly ProviderKey[] = [
  'formField',
  'dialog',
  'bottomSheet',
  'dateAdapter',
  'icons',
  'tooltip',
  'menu',
  'select',
  'autocomplete',
  'ripple',
  'animationsDisabled',
  'errorStateMatcher',
  'paginator',
  'stepper',
  'snackBar',
  'input',
  'button',
  'card',
  'badge',
  'icon',
  'progressBar',
  'progressSpinner',
  'divider',
  'gridList',
  'list',
  'buttonToggle',
  'slideToggle',
  'expansion',
  'radio',
  'checkbox',
  'sort',
  'tabs',
  'sidenav',
  'chips',
  'timepicker',
];

/** @docs-private — exported only so `providers.spec.ts` can unit-test the key-freezing logic
 *  directly (this project's vitest environment hangs on `createDOM()`, so hook behavior that
 *  needs a live multi-render Qwik component — like proving a key SET stays frozen across
 *  renders — is covered by the Playwright spec instead; see that spec file's own header
 *  comment). Not meant for app code to call. */
export function keySetOf(config: MatProvidersConfig): ReadonlySet<ProviderKey> {
  return new Set(Object.keys(config) as ProviderKey[]);
}

/** @docs-private — exported only for `providers.spec.ts`; see {@link keySetOf}'s doc comment. */
export function sameKeySet(a: ReadonlySet<ProviderKey>, b: ReadonlySet<ProviderKey>): boolean {
  if (a.size !== b.size) return false;
  for (const key of a) if (!b.has(key)) return false;
  return true;
}

/**
 * Combined convenience hook over every individual `useMat*Provider()` hook in this library.
 * Provides ONLY the keys present on `config` — an app that only wants to override, say,
 * `formField` and `tooltip` calls `useMatProviders({formField: {...}, tooltip: {...}})` and
 * every OTHER qwik-material context is left untouched (inherited from an ancestor, or the
 * library's own no-provider default) — exactly as if that app had called
 * `useMatFormFieldProvider(...)` and `useMatTooltipProvider(...)` directly and nothing else.
 *
 * ## Hook-order safety: the key SET is frozen on first render, values are not
 *
 * Qwik (like every hooks-based rendering model this port follows) requires a component
 * instance to call the exact same SEQUENCE of hooks on every render. A naive
 * `for (const key in config) useXProvider(...)` would violate that the moment a caller added
 * or removed a key between renders (e.g. a config built from a `Signal` that starts as `{}`
 * then gains a `tooltip` field once data loads) — the create-call for `tooltip`'s context
 * would appear mid-lifetime and shift every hook called after it.
 *
 * The fix: `useConstant(() => keySetOf(config))` captures the key SET exactly once, at this
 * component's first render, and every render after that calls exactly those keys' hooks, in
 * the fixed order {@link ALL_PROVIDER_KEYS} lists them — regardless of what `config` looks
 * like on THIS render. VALUES may freely change between renders (that's the whole point of a
 * provider hook — `useMatFormFieldProvider(config.formField)` re-provides a new
 * `MatFormFieldConfig` object every render, same as calling it directly would); the KEY SET
 * may not. In dev mode, a key set that changes after the first render logs a `console.error`
 * (impossible to fully guard against in production — see `isDev`'s own doc comment for why
 * this port never gates actual BEHAVIOR on it, only diagnostics) so the mistake surfaces
 * immediately instead of as a confusing "my config.tooltip is set but nothing happened" bug
 * report.
 */
export function useMatProviders(config: MatProvidersConfig): MatProvidersHandles {
  const keys = useConstant(() => keySetOf(config));

  if (isDev) {
    const current = keySetOf(config);
    if (!sameKeySet(current, keys)) {
      // Report both sets in the library's own canonical ALL_PROVIDER_KEYS order (not
      // whatever insertion order `Object.keys()` happened to produce) so the message reads
      // consistently regardless of how the caller's config object was built.
      const firstRenderKeys = ALL_PROVIDER_KEYS.filter(k => keys.has(k));
      const thisRenderKeys = ALL_PROVIDER_KEYS.filter(k => current.has(k));
      // eslint-disable-next-line no-console
      console.error(
        '[useMatProviders] the set of configured keys changed after the first render ' +
          `(first render: [${firstRenderKeys.join(', ')}], this render: [${thisRenderKeys.join(', ')}]). ` +
          'The KEY SET passed to useMatProviders() must stay the same across every render of ' +
          'the component that calls it — only the VALUES may change. Decide every key you ' +
          "might ever want to configure up front (pass `undefined`/`{}` for ones you don't " +
          'need yet) instead of adding/removing keys later.',
      );
    }
  }

  const handles: MatProvidersHandles = {};

  if (keys.has('formField')) useMatFormFieldProvider(config.formField);
  if (keys.has('dialog')) useMatDialogProvider(config.dialog);
  if (keys.has('bottomSheet')) useMatBottomSheetProvider(config.bottomSheet);
  if (keys.has('dateAdapter')) handles.dateLocale = useMatDateAdapterProvider(config.dateAdapter);
  if (keys.has('icons')) handles.icons = useMatIconRegistryProvider(config.icons);
  if (keys.has('tooltip')) useMatTooltipProvider(config.tooltip);
  if (keys.has('menu')) useMatMenuProvider(config.menu);
  if (keys.has('select')) useMatSelectProvider(config.select);
  if (keys.has('autocomplete')) useMatAutocompleteProvider(config.autocomplete);
  if (keys.has('ripple')) useMatRippleProvider(config.ripple);
  if (keys.has('animationsDisabled')) {
    handles.animationsDisabled = useMatAnimationsProvider(config.animationsDisabled);
  }
  if (keys.has('errorStateMatcher')) useMatErrorStateMatcherProvider(config.errorStateMatcher);
  if (keys.has('paginator')) useMatPaginatorProvider(config.paginator);
  if (keys.has('stepper')) useMatStepperProvider(config.stepper);
  if (keys.has('snackBar')) useMatSnackBarProvider(config.snackBar);
  if (keys.has('input')) useMatInputProvider(config.input);
  if (keys.has('button')) useMatButtonProvider(config.button);
  if (keys.has('card')) useMatCardProvider(config.card);
  if (keys.has('badge')) useMatBadgeProvider(config.badge);
  if (keys.has('icon')) useMatIconProvider(config.icon);
  if (keys.has('progressBar')) useMatProgressBarProvider(config.progressBar);
  if (keys.has('progressSpinner')) useMatProgressSpinnerProvider(config.progressSpinner);
  if (keys.has('divider')) useMatDividerProvider(config.divider);
  if (keys.has('gridList')) useMatGridListProvider(config.gridList);
  if (keys.has('list')) useMatListProvider(config.list);
  if (keys.has('buttonToggle')) useMatButtonToggleProvider(config.buttonToggle);
  if (keys.has('slideToggle')) useMatSlideToggleProvider(config.slideToggle);
  if (keys.has('expansion')) useMatExpansionProvider(config.expansion);
  if (keys.has('radio')) useMatRadioProvider(config.radio);
  if (keys.has('checkbox')) useMatCheckboxProvider(config.checkbox);
  if (keys.has('sort')) useMatSortProvider(config.sort);
  if (keys.has('tabs')) useMatTabsProvider(config.tabs);
  if (keys.has('sidenav')) useMatSidenavProvider(config.sidenav);
  if (keys.has('chips')) useMatChipsProvider(config.chips);
  if (keys.has('timepicker')) useMatTimepickerProvider(config.timepicker);

  return handles;
}
