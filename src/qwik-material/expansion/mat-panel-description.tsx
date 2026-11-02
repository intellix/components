import {component$, Slot} from '@qwik.dev/core';

export interface MatPanelDescriptionProps {
  class?: string | ReadonlyArray<string>;
}

/**
 * Qwik port of `MatExpansionPanelDescription` (`src/material/expansion/expansion-panel-header.ts`).
 * Render with `q:slot="description"` inside a `<MatExpansionPanelHeader>`.
 */
export const MatPanelDescription = component$<MatPanelDescriptionProps>(props => {
  const classes = ['mat-expansion-panel-header-description', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <mat-panel-description class={classes}>
      <Slot />
    </mat-panel-description>
  );
});
