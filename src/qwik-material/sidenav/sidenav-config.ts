import {createContextId} from '@qwik.dev/core';

/**
 * Defaults applied to every `MatDrawerContainer`/`MatSidenavContainer` in a
 * subtree. Consumers provide this via `<QwikMaterialProvider
 * matSidenavConfig={...}>`. Mirrors upstream's `MAT_DRAWER_DEFAULT_AUTOSIZE`
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
export const MAT_SIDENAV_CONFIG = createContextId<MatSidenavConfig>('qwik-material/sidenav-config');
