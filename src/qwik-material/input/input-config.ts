import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Defaults applied to every `MatInput` in a subtree. Mirrors upstream's
 * `MatInputConfig` + `MAT_INPUT_CONFIG` (`src/material/input/input.ts`
 * lines 50-57). Consumers provide this via
 * `useMatInputProvider({...})`.
 */
export interface MatInputConfig {
  /** Whether disabled inputs should be interactive. Upstream default: `false`. */
  disabledInteractive?: boolean;
}

/**
 * Context id used by `MatInput` to read config. The id string is exposed
 * publicly and MUST remain stable across releases.
 */
export const MAT_INPUT_CONFIG = createContextId<MatInputConfig>('qwikMaterial/inputConfig');

/**
 * Mirrors upstream's implicit default (`this._config?.disabledInteractive
 * || false`) — used as the `useContext()` fallback when no
 * `useMatInputProvider()` ancestor call exists.
 */
export const MAT_INPUT_CONFIG_DEFAULTS: MatInputConfig = {
  disabledInteractive: false,
};

/**
 * Provides {@link MAT_INPUT_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every `MatInput` descendant resolves its
 * defaults from `config` instead of {@link MAT_INPUT_CONFIG_DEFAULTS}. Only this one context
 * is provided; every other qwik-material configuration context stays whatever an ancestor (or
 * nothing) already provided.
 */
export function useMatInputProvider(config?: MatInputConfig): void {
  useContextProvider(MAT_INPUT_CONFIG, config ?? {});
}
