import {createContextId} from '@builder.io/qwik';

/**
 * Mirrors `MatExpansionPanelDefaultOptions` / `MAT_EXPANSION_PANEL_DEFAULT_OPTIONS`
 * (`src/material/expansion/expansion-panel.ts`). Consumers provide this via
 * `<QwikMaterialProvider matExpansionConfig={...}>`.
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
  'qwik-material/expansion-config',
);
