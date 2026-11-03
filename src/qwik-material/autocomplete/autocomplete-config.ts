import {createContextId, type NoSerialize} from '@qwik.dev/core';
import type {ScrollStrategy} from '@angular-community/qwik-cdk/overlay';

/**
 * Defaults applied to every `MatAutocomplete` in a subtree that doesn't set
 * its own. Mirrors upstream's `MatAutocompleteDefaultOptions` +
 * `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` injection token
 * (`src/material/autocomplete/autocomplete.ts`). Consumers provide this via
 * `<QwikMaterialProvider matAutocompleteConfig={{...}}>`.
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
 * Factory that returns the default `ScrollStrategy` for a `MatAutocomplete`
 * panel that doesn't specify one — mirrors upstream's
 * `MAT_AUTOCOMPLETE_SCROLL_STRATEGY` injection token. Provided by
 * `<QwikMaterialProvider matAutocompleteScrollStrategyFactory={…}>`.
 * Default: `createRepositionScrollStrategy()` (pre-existing, previously
 * hard-coded behaviour).
 *
 * KNOWN GAP — see `autocomplete/SYNC.md`'s "scroll-strategy
 * configuration" entry: a CUSTOM factory does not survive a real SSR→CSR
 * resume boundary before `openAutocompletePanel()` actually reads it, so
 * it's silently ignored on every autocomplete opened after a genuine
 * page load. The default (unconfigured) case is unaffected.
 */
export const MAT_AUTOCOMPLETE_SCROLL_STRATEGY = createContextId<NoSerialize<() => ScrollStrategy>>(
  'qwikMaterial/autocompleteScrollStrategy',
);
