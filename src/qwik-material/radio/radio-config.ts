import {createContextId, useContextProvider} from '@qwik.dev/core';
import type {MatRadioColor} from './radio-color';

/**
 * Defaults applied to every MatRadioButton in a subtree that doesn't set its
 * own (or inherit a group's) value. Mirrors upstream's
 * `MatRadioDefaultOptions` + `MAT_RADIO_DEFAULT_OPTIONS`
 * (src/material/radio/radio.ts lines 78-101). Consumers provide this via
 * `useMatRadioProvider({...})`.
 */
export interface MatRadioConfig {
  /**
   * Theme color of the radio button. M2-themes-only API (no effect in M3);
   * matches upstream's doc caveat. Upstream default: 'accent'.
   */
  color?: MatRadioColor;
  /** Whether disabled radio buttons should be interactive. Upstream default: false. */
  disabledInteractive?: boolean;
}

/**
 * Context id used by MatRadioButton to read config. The id string is exposed
 * publicly and MUST remain stable across releases.
 */
export const MAT_RADIO_CONFIG = createContextId<MatRadioConfig>('qwikMaterial/radioConfig');

/**
 * Mirrors upstream's `MAT_RADIO_DEFAULT_OPTIONS` factory
 * (`{color: 'accent', disabledInteractive: false}`) — used as the
 * `useContext()` fallback when no `useMatRadioProvider()` ancestor call exists.
 * `MatRadioButton`'s own color/disabledInteractive computation additionally
 * hardcodes these same values as its final fallback, so a
 * `useMatRadioProvider()` call that supplies an empty config (the
 * provider's own default when the prop is omitted) still behaves correctly.
 */
export const MAT_RADIO_CONFIG_DEFAULTS: MatRadioConfig = {
  color: 'accent',
  disabledInteractive: false,
};

/**
 * Provides {@link MAT_RADIO_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatRadioGroup / MatRadioButton
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatRadioProvider(config?: MatRadioConfig): void {
  useContextProvider(MAT_RADIO_CONFIG, config ?? {});
}
