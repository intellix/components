import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Defaults applied to every `MatDrawerContainer`/`MatSidenavContainer` in a
 * subtree. Consumers provide this via `useMatSidenavProvider({...})`. Mirrors
 * upstream's `MAT_DRAWER_DEFAULT_AUTOSIZE`
 * injection token (`src/material/sidenav/drawer.ts`), folded into the
 * per-family config-object shape every other qwik-material entry point uses.
 */
export interface MatSidenavConfig {
  /** Default for `MatDrawerContainer`/`MatSidenavContainer`'s `autosize` prop when the
   *  container doesn't set its own. Mirrors `MAT_DRAWER_DEFAULT_AUTOSIZE`'s default of `false`. */
  autosize?: boolean;
}

/**
 * Context id used by MatDrawerContainer/MatSidenavContainer to read config.
 * The id string is exposed publicly and MUST remain stable across releases.
 */
export const MAT_SIDENAV_CONFIG = createContextId<MatSidenavConfig>('qwikMaterial/sidenavConfig');

/**
 * Provides {@link MAT_SIDENAV_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatDrawerContainer / MatSidenavContainer
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatSidenavProvider(config?: MatSidenavConfig): void {
  useContextProvider(MAT_SIDENAV_CONFIG, config ?? {});
}
