import {component$, Slot} from '@qwik.dev/core';

export interface MatCardContentProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardContent = component$<MatCardContentProps>(props => {
  const classes = ['mat-mdc-card-content', props.class].filter(Boolean) as string[];
  return (
    <mat-card-content id={props.id} class={classes}>
      <Slot />
    </mat-card-content>
  );
});
