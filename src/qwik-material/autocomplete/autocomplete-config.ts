import {createContextId, useContextProvider} from '@qwik.dev/core';
import type {ScrollStrategyDescriptor} from '@angular-community/qwik-cdk/overlay';

/**
 * Defaults applied to every `MatAutocomplete` in a subtree that doesn't set
 * its own. Mirrors upstream's `MatAutocompleteDefaultOptions` +
 * `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` injection token
 * (`src/material/autocomplete/autocomplete.ts`). Consumers provide this via
 * `useMatAutocompleteProvider({config: {...}})`.
 *
 * `panelWidth` has NO entry here — unlike `MatSelectConfig`, upstream's own
 * `MatAutocompleteDefaultOptions` has no `panelWidth` field either (it's
 * only ever a per-instance `@Input() panelWidth` on `MatAutocomplete`
 * itself, never configurable globally) — see `MatAutocompleteProps.panelWidth`.
 */
export interface MatAutocompleteConfig {
  /** Whether the first option should be highlighted when the panel opens. */
  autoActiveFirstOption?: boolean;
  /** Whether the active option should be selected as the user navigates.
   *  Accepted for API parity — see `autocomplete/SYNC.md`'s deviations
   *  list, unused (no scenario exercises it). */
  autoSelectActiveOption?: boolean;
  /** Whether a selection is required to leave a non-empty value behind. */
  requireSelection?: boolean;
  /** Class applied to the overlay's backdrop, when `hasBackdrop` is true. */
  backdropClass?: string;
  /** Whether the overlay has a backdrop. Default `false` (unlike `mat-select`,
   *  which always has one) — matches upstream's own default. */
  hasBackdrop?: boolean;
  /** Class or list of classes applied to the overlay PANE (`.cdk-overlay-pane`). */
  overlayPanelClass?: string | string[];
  /** Whether icon indicators should be hidden for single-selection. */
  hideSingleSelectionIndicator?: boolean;
}

/**
 * Context id used by `MatAutocomplete` to read config. The id string is
 * exposed publicly and MUST remain stable across releases.
 */
export const MAT_AUTOCOMPLETE_CONFIG = createContextId<MatAutocompleteConfig>(
  'qwikMaterial/autocompleteConfig',
);

/**
 * Default `ScrollStrategy` descriptor for a `MatAutocomplete` panel that
 * doesn't specify its own — mirrors upstream's
 * `MAT_AUTOCOMPLETE_SCROLL_STRATEGY` injection token. Provided by
 * `useMatAutocompleteProvider({scrollStrategy: …})`. Default:
 * `{type: 'reposition'}` (pre-existing, previously hard-coded behaviour).
 *
 * A plain, serializable `ScrollStrategyDescriptor` — NOT a function
 * factory; see `qwik-material/dialog/mat-dialog-tokens.ts`'s
 * `MAT_DIALOG_SCROLL_STRATEGY` for why that distinction matters (a
 * factory function doesn't survive a real SSR→CSR resume — this was a
 * real, confirmed bug here until fixed; see `autocomplete/SYNC.md`).
 */
export const MAT_AUTOCOMPLETE_SCROLL_STRATEGY = createContextId<ScrollStrategyDescriptor>(
  'qwikMaterial/autocompleteScrollStrategy',
);

/** Options for {@link useMatAutocompleteProvider}. */
export interface MatAutocompleteProviderConfig {
  /** Defaults applied to every `MatAutocomplete` in this subtree. */
  config?: MatAutocompleteConfig;
  /** Default `ScrollStrategy` descriptor for `MatAutocomplete` panels. Defaults to
   *  `{type: 'reposition'}` (pre-existing hard-coded behaviour). */
  scrollStrategy?: ScrollStrategyDescriptor;
}

/**
 * Provides {@link MAT_AUTOCOMPLETE_CONFIG} and {@link MAT_AUTOCOMPLETE_SCROLL_STRATEGY} for
 * this subtree — call once near the root (or anywhere deeper, to override just that part of
 * the tree) so every `MatAutocomplete` descendant resolves its defaults/scroll strategy from
 * `providerConfig` instead of the hardcoded fallbacks. Only these two contexts are provided;
 * every other qwik-material configuration context stays whatever an ancestor (or nothing)
 * already provided.
 */
export function useMatAutocompleteProvider(providerConfig?: MatAutocompleteProviderConfig): void {
  useContextProvider(MAT_AUTOCOMPLETE_CONFIG, providerConfig?.config ?? {});
  useContextProvider(
    MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
    providerConfig?.scrollStrategy ?? {type: 'reposition'},
  );
}
