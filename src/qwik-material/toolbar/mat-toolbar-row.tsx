import {component$, Slot} from '@builder.io/qwik';

export interface MatToolbarRowProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatToolbarRow = component$<MatToolbarRowProps>(props => {
  const classes = ['mat-toolbar-row', props.class].filter(Boolean) as string[];
  return (
    <mat-toolbar-row id={props.id} class={classes}>
      <Slot />
    </mat-toolbar-row>
  );
});
