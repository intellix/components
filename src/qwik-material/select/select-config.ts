import {createContextId, useContextProvider} from '@qwik.dev/core';
import type {ScrollStrategyDescriptor} from '@angular-community/qwik-cdk/overlay';

/**
 * Defaults applied to every `MatSelect` in a subtree that doesn't set its
 * own. Mirrors upstream's `MatSelectConfig` + `MAT_SELECT_CONFIG` injection
 * token (`src/material/select/select.ts`). Consumers provide this via
 * `useMatSelectProvider({config: {...}})`.
 *
 * `disableOptionCentering`/`canSelectNullableOptions` are accepted for API
 * parity but unused by this port — see `select/SYNC.md`'s deviations list.
 * `canSelectNullableOptions` has no scenario exercising it; `disableOptionCentering`
 * is a genuine upstream no-op in Material 21.2 — VERIFIED by reading `select.ts`
 * directly: the field is declared (`@Input() disableOptionCentering = this._defaultOptions
 * ?.disableOptionCentering ?? false`) and stored, but grep-confirmed to be read NOWHERE
 * else in the class — it only ever affected the pre-`FlexibleConnectedPositionStrategy`
 * positioning math Angular Material removed entirely in a much earlier major version. This
 * port's own earlier doc comment here described it as affecting "non-flexible positioning
 * math this port doesn't replicate", which was imprecise (implying the port was the one
 * dropping behavior) — upstream itself has nothing left to drop in 21.2.
 */
export interface MatSelectConfig {
  /** Whether option centering should be disabled. Accepted, unused — a genuine upstream
   *  no-op in Material 21.2 (see doc comment above), not a scope cut this port made. */
  disableOptionCentering?: boolean;
  /** Time to wait in ms after the last keystroke before moving focus to an item. Default 200. */
  typeaheadDebounceInterval?: number;
  /** Class or list of classes applied to the overlay PANE (`.cdk-overlay-pane`) —
   *  mirrors `_overlayPanelClass`. Distinct from the per-instance `panelClass`
   *  prop, which lands on the listbox div (`.mat-mdc-select-panel`) itself. */
  overlayPanelClass?: string | string[];
  /** Whether icon indicators should be hidden for single-selection. */
  hideSingleSelectionIndicator?: boolean;
  /** Width of the panel. `'auto'` (default) measures the trigger/form-field;
   *  `null`/`''` lets it grow to content; a literal string/number pins it. */
  panelWidth?: string | number | null;
  /** Whether nullable options can be selected by default. Accepted, unused —
   *  no scenario has a `null`/`undefined`-valued option. */
  canSelectNullableOptions?: boolean;
}

/**
 * Context id used by `MatSelect` to read config. The id string is exposed
 * publicly and MUST remain stable across releases.
 */
export const MAT_SELECT_CONFIG = createContextId<MatSelectConfig>('qwikMaterial/selectConfig');

/**
 * Default `ScrollStrategy` descriptor for a `MatSelect` panel that doesn't
 * specify its own — mirrors upstream's `MAT_SELECT_SCROLL_STRATEGY`
 * injection token. Provided by `useMatSelectProvider({scrollStrategy: …})`.
 * Default: `{type: 'reposition'}` (this port's pre-existing, previously
 * hard-coded behaviour).
 *
 * A plain, serializable `ScrollStrategyDescriptor` — NOT a function
 * factory; see `qwik-material/dialog/mat-dialog-tokens.ts`'s
 * `MAT_DIALOG_SCROLL_STRATEGY` for why that distinction matters (a
 * factory function doesn't survive a real SSR→CSR resume — this was a
 * real, confirmed bug here until fixed; see `select/SYNC.md`).
 */
export const MAT_SELECT_SCROLL_STRATEGY = createContextId<ScrollStrategyDescriptor>(
  'qwikMaterial/selectScrollStrategy',
);

/** Options for {@link useMatSelectProvider}. */
export interface MatSelectProviderConfig {
  /** Defaults applied to every `MatSelect` in this subtree. */
  config?: MatSelectConfig;
  /** Default `ScrollStrategy` descriptor for `MatSelect` panels. Defaults to
   *  `{type: 'reposition'}` (this port's pre-existing hard-coded behaviour). */
  scrollStrategy?: ScrollStrategyDescriptor;
}

/**
 * Provides {@link MAT_SELECT_CONFIG} and {@link MAT_SELECT_SCROLL_STRATEGY} for this subtree
 * — call once near the root (or anywhere deeper, to override just that part of the tree) so
 * every `MatSelect` descendant resolves its defaults/scroll strategy from `providerConfig`
 * instead of the hardcoded fallbacks. Only these two contexts are provided; every other
 * qwik-material configuration context stays whatever an ancestor (or nothing) already
 * provided.
 */
export function useMatSelectProvider(providerConfig?: MatSelectProviderConfig): void {
  useContextProvider(MAT_SELECT_CONFIG, providerConfig?.config ?? {});
  useContextProvider(
    MAT_SELECT_SCROLL_STRATEGY,
    providerConfig?.scrollStrategy ?? {type: 'reposition'},
  );
}
