import {component$, Slot} from '@qwik.dev/core';

export interface MatActionRowProps {
  class?: string | ReadonlyArray<string>;
}

/**
 * Qwik port of `MatExpansionPanelActionRow` (`src/material/expansion/expansion-panel.ts`).
 * Render with `q:slot="actionRow"` inside a `<MatExpansionPanel>`. Always
 * present in the DOM once rendered — upstream collapses it visually via CSS
 * (it lives inside `.mat-expansion-panel-content`, which the panel hides
 * via `visibility`/`inert`), not by removing it from the tree.
 */
export const MatActionRow = component$<MatActionRowProps>(props => {
  const classes = ['mat-action-row', props.class].filter(Boolean) as string[];
  return (
    <mat-action-row class={classes}>
      <Slot />
    </mat-action-row>
  );
});
