import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Defaults applied to every MatButtonToggleGroup / MatButtonToggle in a subtree.
 * Consumers provide this via `useMatButtonToggleProvider(...)`.
 * Mirrors upstream's `MatButtonToggleDefaultOptions` interface +
 * `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` injection token
 * (`src/material/button-toggle/button-toggle.ts`) for the two fields this port
 * wires (`appearance`/`disabledInteractive` are still out of scope — see
 * button-toggle/SYNC.md's deviations list).
 */
export interface MatButtonToggleConfig {
  /** Whether the checkmark indicator should be hidden for single-selection groups.
   *  Mirrors upstream `hideSingleSelectionIndicator`. Default `false` (shown). Can
   *  be overridden per-group via `<MatButtonToggleGroup hideSingleSelectionIndicator>`. */
  hideSingleSelectionIndicator?: boolean;
  /** Whether the checkmark indicator should be hidden for multiple-selection groups.
   *  Mirrors upstream `hideMultipleSelectionIndicator`. Default `false` (shown). Can
   *  be overridden per-group via `<MatButtonToggleGroup hideMultipleSelectionIndicator>`. */
  hideMultipleSelectionIndicator?: boolean;
}

/** Mirrors upstream's own `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` factory default
 *  (`{hideSingleSelectionIndicator: false, hideMultipleSelectionIndicator: false}`). */
export const MAT_BUTTON_TOGGLE_CONFIG_DEFAULTS: Required<MatButtonToggleConfig> = {
  hideSingleSelectionIndicator: false,
  hideMultipleSelectionIndicator: false,
};

/**
 * Context id used by MatButtonToggleGroup to read config. The id string is
 * exposed publicly and MUST remain stable across releases — consumers may
 * inject it directly in advanced scenarios.
 */
export const MAT_BUTTON_TOGGLE_CONFIG = createContextId<MatButtonToggleConfig>(
  'qwikMaterial/buttonToggleConfig',
);

/**
 * Provides {@link MAT_BUTTON_TOGGLE_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatButtonToggleGroup / MatButtonToggle
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatButtonToggleProvider(config?: MatButtonToggleConfig): void {
  useContextProvider(MAT_BUTTON_TOGGLE_CONFIG, config ?? {});
}
