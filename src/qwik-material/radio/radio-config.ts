import {createContextId} from '@qwik.dev/core';
import type {MatRadioColor} from './radio-color';

/**
 * Defaults applied to every MatRadioButton in a subtree that doesn't set its
 * own (or inherit a group's) value. Mirrors upstream's
 * `MatRadioDefaultOptions` + `MAT_RADIO_DEFAULT_OPTIONS`
 * (src/material/radio/radio.ts lines 78-101). Consumers provide this via
 * `<QwikMaterialProvider matRadioConfig={{...}}>`.
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
 * `useContext()` fallback when no `<QwikMaterialProvider>` ancestor exists.
 * `MatRadioButton`'s own color/disabledInteractive computation additionally
 * hardcodes these same values as its final fallback, so a
 * `<QwikMaterialProvider>` that supplies an empty `matRadioConfig` (the
 * provider's own default when the prop is omitted) still behaves correctly.
 */
export const MAT_RADIO_CONFIG_DEFAULTS: MatRadioConfig = {
  color: 'accent',
  disabledInteractive: false,
};
