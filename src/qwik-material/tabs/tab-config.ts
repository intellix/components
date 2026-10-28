import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every `<MatTabGroup>` / `<MatTabNav>` in a subtree.
 * Mirrors upstream's `MatTabsConfig` + `MAT_TABS_CONFIG`
 * (`src/material/tabs/tab-config.ts`). Consumers provide this via
 * `<QwikMaterialProvider matTabsConfig={{...}}>`.
 */
export interface MatTabsConfig {
  /** Duration for the tab animation. Must be a valid CSS value (e.g. 600ms). */
  animationDuration?: string;
  /** Whether pagination should be disabled. */
  disablePagination?: boolean;
  /** Whether the ink bar should fit its width to the size of the tab label content. */
  fitInkBarToContent?: boolean;
  /** Whether the tab group should grow to the size of the active tab. */
  dynamicHeight?: boolean;
  /** `tabindex` to be set on the inner element that wraps the tab content. */
  contentTabIndex?: number;
  /** Whether tabs keep their content in the DOM while off-screen. */
  preserveContent?: boolean;
  /** Whether tabs should be stretched to fill the header. */
  stretchTabs?: boolean;
  /** Alignment for the tabs label. */
  alignTabs?: 'start' | 'center' | 'end';
}

/**
 * Context id used by `MatTabGroup` / `MatTabNav` to read config. The id
 * string is exposed publicly and MUST remain stable across releases.
 */
export const MAT_TABS_CONFIG = createContextId<MatTabsConfig>('qwik-material/tabs-config');
