import {component$, Slot} from '@qwik.dev/core';

export interface MatCardTitleProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardTitle = component$<MatCardTitleProps>(props => {
  const classes = ['mat-mdc-card-title', props.class].filter(Boolean) as string[];
  return (
    <mat-card-title id={props.id} class={classes}>
      <Slot />
    </mat-card-title>
  );
});
