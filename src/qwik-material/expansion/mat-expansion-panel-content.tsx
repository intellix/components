import {component$, Slot, useContext} from '@builder.io/qwik';
import {MAT_EXPANSION_PANEL_STATE, MAT_EXPANSION_PANEL_STATE_DEFAULTS} from './panel-state';

/**
 * Qwik port of `MatExpansionPanelContent` + its `ng-template
 * matExpansionPanelContent` host (`src/material/expansion/expansion-panel-content.ts`).
 * Renders nothing until the owning `<MatExpansionPanel>` opens for the
 * first time, then stays rendered forever, even if the panel closes again
 * — mirrors `ngAfterContentInit`'s `take(1)` portal creation (never torn
 * down). A regular (unnamed-slot) child of `<MatExpansionPanel>`, co-located
 * with any other body content — upstream's `<ng-template>` likewise
 * contributes no wrapper element of its own, just a (harness-ignored)
 * comment anchor until the portal attaches.
 */
export const MatExpansionPanelContent = component$(() => {
  const panel = useContext(MAT_EXPANSION_PANEL_STATE, {
    value: MAT_EXPANSION_PANEL_STATE_DEFAULTS,
  });
  return panel.value.hasEverOpened.value ? <Slot /> : null;
});
