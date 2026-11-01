import {component$, Slot} from '@qwik.dev/core';

export interface MatPanelTitleProps {
  class?: string | ReadonlyArray<string>;
}

/**
 * Qwik port of `MatExpansionPanelTitle` (`src/material/expansion/expansion-panel-header.ts`).
 * Render with `q:slot="title"` inside a `<MatExpansionPanelHeader>`.
 */
export const MatPanelTitle = component$<MatPanelTitleProps>(props => {
  const classes = ['mat-expansion-panel-header-title', props.class].filter(Boolean) as string[];
  return (
    <mat-panel-title class={classes}>
      <Slot />
    </mat-panel-title>
  );
});
