import {$, createContextId, type QRL, type Signal} from '@qwik.dev/core';
import type {MatAccordionTogglePosition} from './accordion-state';

/**
 * State `MatExpansionPanel` publishes for its header/title/description/
 * action-row/content descendants (reached via `q:slot`, not nested
 * `component$` props — see `mat-expansion-panel.tsx`'s doc comment for why).
 */
export interface MatExpansionPanelState {
  expanded: boolean;
  disabled: boolean;
  /** Already resolved against the owning accordion's `hideToggle`, if any
   *  (`MatExpansionPanel.hideToggle` getter). */
  hideToggle: boolean;
  /** Already resolved against the owning accordion's `togglePosition`;
   *  `undefined` for a standalone panel with no explicit `togglePosition`
   *  of its own (no indicator-position class at all — see
   *  `accordion-state.ts`'s doc comment). */
  togglePosition: MatAccordionTogglePosition | undefined;
  /** `mat-expansion-panel-header-N` — `MatExpansionPanel._headerId`. */
  headerId: string;
  /** `cdk-accordion-child-N` — the panel's own id (`CdkAccordionItem.id`). */
  contentId: string;
  /** See `use-cdk-accordion-item.ts`'s `CdkAccordionItemApi.setExpanded$` —
   *  deliberately unguarded on `disabled`; the header declines to call it
   *  at all when disabled. */
  setExpanded$: QRL<(expanded: boolean) => void>;
  /** Populated by `MatExpansionPanelHeader`'s own `ref`, so the panel can
   *  call `focusVia(headerElRef.value, 'program')` when focus should
   *  return to the header (closed-while-focus-was-inside — see
   *  `mat-expansion-panel.tsx`). */
  headerElRef: Signal<HTMLElement | undefined>;
  /** Set once, forever, the first time `expanded` becomes `true` — gates
   *  `MatExpansionPanelContent`'s lazy rendering (`take(1)` on `opened`). */
  hasEverOpened: Signal<boolean>;
}

/**
 * Context published by `MatExpansionPanel`. Carries a
 * `Signal<MatExpansionPanelState>` for the same context-reactivity reason
 * `qwik-material/button-toggle`'s `MAT_BUTTON_TOGGLE_GROUP_STATE` does.
 */
export const MAT_EXPANSION_PANEL_STATE = createContextId<Signal<MatExpansionPanelState>>(
  'qwikMaterial/expansionPanelState',
);

/**
 * Fallback for a header/title/description/action-row/content rendered
 * without a `MatExpansionPanel` ancestor (misuse — upstream's equivalent
 * directives/components would throw injecting `MatExpansionPanel`). Kept
 * inert rather than throwing, matching this port's established convention
 * (see `qwik-material/button-toggle`'s `MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS`
 * doc comment — a bare `useContext()` without a fallback throws
 * `QError_notFoundContext`).
 */
export const MAT_EXPANSION_PANEL_STATE_DEFAULTS: MatExpansionPanelState = {
  expanded: false,
  disabled: false,
  hideToggle: false,
  togglePosition: undefined,
  headerId: '',
  contentId: '',
  setExpanded$: $(() => {
    // No-op — misuse fallback only.
  }),
  headerElRef: {value: undefined} as Signal<HTMLElement | undefined>,
  hasEverOpened: {value: false} as Signal<boolean>,
};
