import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Mirrors `MatExpansionPanelDefaultOptions` / `MAT_EXPANSION_PANEL_DEFAULT_OPTIONS`
 * (`src/material/expansion/expansion-panel.ts`). Consumers provide this via
 * `useMatExpansionProvider(...)`.
 */
export interface MatExpansionConfig {
  /** Default height of a panel's header while expanded, used by any
   *  `MatExpansionPanelHeader` that doesn't set its own `expandedHeight`. */
  expandedHeight?: string;
  /** Default height of a panel's header while collapsed. */
  collapsedHeight?: string;
  /** Default `hideToggle` for every `MatExpansionPanel` that doesn't set
   *  its own. */
  hideToggle?: boolean;
}

/**
 * Context id used by `MatExpansionPanel`/`MatExpansionPanelHeader` to read
 * config. The id string is exposed publicly and MUST remain stable across
 * releases, matching every other `qwik-material` config token.
 */
export const MAT_EXPANSION_CONFIG = createContextId<MatExpansionConfig>(
  'qwikMaterial/expansionConfig',
);

/**
 * Provides {@link MAT_EXPANSION_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatExpansionPanel / MatExpansionPanelHeader
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatExpansionProvider(config?: MatExpansionConfig): void {
  useContextProvider(MAT_EXPANSION_CONFIG, config ?? {});
}
