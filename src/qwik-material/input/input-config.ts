import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every `MatInput` in a subtree. Mirrors upstream's
 * `MatInputConfig` + `MAT_INPUT_CONFIG` (`src/material/input/input.ts`
 * lines 50-57). Consumers provide this via
 * `<QwikMaterialProvider matInputConfig={{...}}>`.
 */
export interface MatInputConfig {
  /** Whether disabled inputs should be interactive. Upstream default: `false`. */
  disabledInteractive?: boolean;
}

/**
 * Context id used by `MatInput` to read config. The id string is exposed
 * publicly and MUST remain stable across releases.
 */
export const MAT_INPUT_CONFIG = createContextId<MatInputConfig>('qwik-material/input-config');

/**
 * Mirrors upstream's implicit default (`this._config?.disabledInteractive
 * || false`) — used as the `useContext()` fallback when no
 * `<QwikMaterialProvider>` ancestor exists.
 */
export const MAT_INPUT_CONFIG_DEFAULTS: MatInputConfig = {
  disabledInteractive: false,
};
