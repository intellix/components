import {component$, Slot} from '@qwik.dev/core';

export interface MatCardSubtitleProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardSubtitle = component$<MatCardSubtitleProps>(props => {
  const classes = ['mat-mdc-card-subtitle', props.class].filter(Boolean) as string[];
  return (
    <mat-card-subtitle id={props.id} class={classes}>
      <Slot />
    </mat-card-subtitle>
  );
});
