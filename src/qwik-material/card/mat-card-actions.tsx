import {component$, Slot} from '@builder.io/qwik';

export interface MatCardActionsProps {
  align?: 'start' | 'end';
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardActions = component$<MatCardActionsProps>(props => {
  const classes = [
    'mat-mdc-card-actions',
    'mdc-card__actions',
    props.align === 'end' && 'mat-mdc-card-actions-align-end',
    props.class,
  ].filter(Boolean) as string[];
  return (
    <mat-card-actions id={props.id} class={classes}>
      <Slot />
    </mat-card-actions>
  );
});
