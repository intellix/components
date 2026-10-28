import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every `MatSelect` in a subtree that doesn't set its
 * own. Mirrors upstream's `MatSelectConfig` + `MAT_SELECT_CONFIG` injection
 * token (`src/material/select/select.ts`). Consumers provide this via
 * `<QwikMaterialProvider matSelectConfig={{...}}>`.
 *
 * `disableOptionCentering`/`canSelectNullableOptions` are accepted for API
 * parity but unused by this port — see `select/SYNC.md`'s deviations list
 * (no scenario exercises either, and `disableOptionCentering` specifically
 * only affected the now-removed non-flexible positioning math upstream's
 * own M2-era select used).
 */
export interface MatSelectConfig {
  /** Whether option centering should be disabled. Accepted, unused — see doc comment. */
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
export const MAT_SELECT_CONFIG = createContextId<MatSelectConfig>('qwik-material/select-config');
