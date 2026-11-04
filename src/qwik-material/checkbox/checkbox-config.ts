import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Checkbox click action when the user clicks the native input. Mirrors
 * upstream's `MatCheckboxClickAction`.
 *   - `noop`: do not toggle `checked` or `indeterminate`.
 *   - `check`: only toggle `checked`; ignore `indeterminate`.
 *   - `check-indeterminate` (default): toggle `checked`, set `indeterminate` to false.
 */
export type MatCheckboxClickAction = 'noop' | 'check' | 'check-indeterminate' | undefined;

/**
 * Defaults applied to every MatCheckbox in a subtree. Consumers provide this
 * via `useMatCheckboxProvider({...})`. Mirrors upstream's
 * `MatCheckboxDefaultOptions` (`src/material/checkbox/checkbox-config.ts`).
 */
export interface MatCheckboxConfig {
  /**
   * Default theme color of the checkbox. This API is supported in M2 themes
   * only — it has no effect in M3 themes (matches upstream's note).
   */
  color?: string;
  /** Default checkbox click action for checkboxes. */
  clickAction?: MatCheckboxClickAction;
  /** Whether disabled checkboxes should be interactive. */
  disabledInteractive?: boolean;
}

/** Upstream's `checkboxDefaults` constant. */
export const MAT_CHECKBOX_CONFIG_DEFAULTS: MatCheckboxConfig = {
  color: 'accent',
  clickAction: 'check-indeterminate',
  disabledInteractive: false,
};

/**
 * Context id used by MatCheckbox to read config. The id string is exposed
 * publicly and MUST remain stable across releases — consumers may inject it
 * directly in advanced scenarios.
 */
export const MAT_CHECKBOX_CONFIG = createContextId<MatCheckboxConfig>(
  'qwikMaterial/checkboxConfig',
);

/**
 * Provides {@link MAT_CHECKBOX_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatCheckbox
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatCheckboxProvider(config?: MatCheckboxConfig): void {
  useContextProvider(MAT_CHECKBOX_CONFIG, config ?? {});
}
