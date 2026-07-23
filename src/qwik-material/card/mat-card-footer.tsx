import {component$, Slot} from '@builder.io/qwik';

export interface MatCardFooterProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardFooter = component$<MatCardFooterProps>(props => {
  const classes = ['mat-mdc-card-footer', props.class].filter(Boolean) as string[];
  return (
    <mat-card-footer id={props.id} class={classes}>
      <Slot />
    </mat-card-footer>
  );
});
