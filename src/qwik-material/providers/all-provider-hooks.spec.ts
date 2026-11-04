/**
 * Smoke tests for every individual `useMat*Provider()` hook this library exports — one per
 * `MatProvidersConfig` key, imported from its OWN entry point (never from `providers` itself,
 * matching the "providers imports from everyone, nobody imports providers" dependency
 * direction `providers/public-api.ts`'s module doc comment documents).
 *
 * Each hook internally does nothing but call `useContextProvider()` (and, for three of them,
 * `useSignal()`/`useStore()` too) against ONE context (or a small, fixed, documented GROUP of
 * closely-related contexts — e.g. `useMatDialogProvider()` provides exactly
 * `MAT_DIALOG_DEFAULT_OPTIONS` + `MAT_DIALOG_SCROLL_STRATEGY`, nothing else) — never a
 * neighbor's. That "only its own context" property can't be exercised with a live multi-hook
 * render here (this project's vitest environment hangs on `createDOM()` — see
 * `providers.spec.ts`'s header comment), so what this file actually proves is the narrower,
 * but still real, regression guard: every hook named in `providers/SYNC.md`'s mapping table
 * still exists, under the SAME name, exported from the SAME entry point, and is callable
 * (a function) — catching a rename/removal/entry-point move immediately instead of only when
 * `useMatProviders()` (or an app) fails to resolve it. The actual "provides only its own
 * context, doesn't reset siblings" BEHAVIOR is proven for real against a live DOM in
 * `src/qwik-cdk-parity-tests/specs/material-core/providers.spec.ts`.
 */
import {describe, expect, it} from 'vitest';
import {useMatFormFieldProvider} from '@angular-community/qwik-material/form-field';
import {useMatInputProvider} from '@angular-community/qwik-material/input';
import {
  useMatDialogProvider,
  useMatAnimationsProvider,
} from '@angular-community/qwik-material/dialog';
import {useMatBottomSheetProvider} from '@angular-community/qwik-material/bottom-sheet';
import {useMatSnackBarProvider} from '@angular-community/qwik-material/snack-bar';
import {
  useMatDateAdapterProvider,
  useMatErrorStateMatcherProvider,
  useMatRippleProvider,
} from '@angular-community/qwik-material/core';
import {
  useMatIconRegistryProvider,
  useMatIconProvider,
} from '@angular-community/qwik-material/icon';
import {useMatTooltipProvider} from '@angular-community/qwik-material/tooltip';
import {useMatMenuProvider} from '@angular-community/qwik-material/menu';
import {useMatSelectProvider} from '@angular-community/qwik-material/select';
import {useMatAutocompleteProvider} from '@angular-community/qwik-material/autocomplete';
import {useMatPaginatorProvider} from '@angular-community/qwik-material/paginator';
import {useMatStepperProvider} from '@angular-community/qwik-material/stepper';
import {useMatButtonProvider} from '@angular-community/qwik-material/button';
import {useMatCardProvider} from '@angular-community/qwik-material/card';
import {useMatBadgeProvider} from '@angular-community/qwik-material/badge';
import {useMatProgressBarProvider} from '@angular-community/qwik-material/progress-bar';
import {useMatProgressSpinnerProvider} from '@angular-community/qwik-material/progress-spinner';
import {useMatDividerProvider} from '@angular-community/qwik-material/divider';
import {useMatGridListProvider} from '@angular-community/qwik-material/grid-list';
import {useMatListProvider} from '@angular-community/qwik-material/list';
import {useMatButtonToggleProvider} from '@angular-community/qwik-material/button-toggle';
import {useMatSlideToggleProvider} from '@angular-community/qwik-material/slide-toggle';
import {useMatExpansionProvider} from '@angular-community/qwik-material/expansion';
import {useMatRadioProvider} from '@angular-community/qwik-material/radio';
import {useMatCheckboxProvider} from '@angular-community/qwik-material/checkbox';
import {useMatSortProvider} from '@angular-community/qwik-material/sort';
import {useMatTabsProvider} from '@angular-community/qwik-material/tabs';
import {useMatSidenavProvider} from '@angular-community/qwik-material/sidenav';
import {useMatChipsProvider} from '@angular-community/qwik-material/chips';
import {useMatTimepickerProvider} from '@angular-community/qwik-material/timepicker';

const HOOKS: Record<string, unknown> = {
  useMatFormFieldProvider,
  useMatInputProvider,
  useMatDialogProvider,
  useMatAnimationsProvider,
  useMatBottomSheetProvider,
  useMatSnackBarProvider,
  useMatDateAdapterProvider,
  useMatErrorStateMatcherProvider,
  useMatRippleProvider,
  useMatIconRegistryProvider,
  useMatIconProvider,
  useMatTooltipProvider,
  useMatMenuProvider,
  useMatSelectProvider,
  useMatAutocompleteProvider,
  useMatPaginatorProvider,
  useMatStepperProvider,
  useMatButtonProvider,
  useMatCardProvider,
  useMatBadgeProvider,
  useMatProgressBarProvider,
  useMatProgressSpinnerProvider,
  useMatDividerProvider,
  useMatGridListProvider,
  useMatListProvider,
  useMatButtonToggleProvider,
  useMatSlideToggleProvider,
  useMatExpansionProvider,
  useMatRadioProvider,
  useMatCheckboxProvider,
  useMatSortProvider,
  useMatTabsProvider,
  useMatSidenavProvider,
  useMatChipsProvider,
  useMatTimepickerProvider,
};

describe('every individual useMat*Provider() hook', () => {
  it(
    'has exactly 35 entries (one per MatProvidersConfig key — keep this list and ' +
      "providers/SYNC.md's mapping table in sync when adding a new one)",
    () => {
      expect(Object.keys(HOOKS).length).toBe(35);
    },
  );

  for (const [name, hook] of Object.entries(HOOKS)) {
    it(`${name} is exported and is a function`, () => {
      expect(hook).toBeDefined();
      expect(typeof hook).toBe('function');
    });
  }
});
