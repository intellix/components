import {component$, Slot} from '@qwik.dev/core';
import type {MatToolbarColor} from './toolbar-color';

export interface MatToolbarProps {
  /** M2 palette color. Deprecated in M3 but honoured. Adds `mat-<color>` class. */
  color?: MatToolbarColor;
  /**
   * When true, applies `mat-toolbar-multiple-rows` class instead of
   * `mat-toolbar-single-row`. Consumer opts in explicitly because Qwik
   * cannot query projected children at render time (upstream uses
   * @ContentChildren for this detection).
   */
  multipleRows?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatToolbar = component$<MatToolbarProps>(props => {
  const classes = [
    'mat-toolbar',
    props.color ? `mat-${props.color}` : '',
    props.multipleRows ? 'mat-toolbar-multiple-rows' : 'mat-toolbar-single-row',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-toolbar id={props.id} class={classes}>
      <Slot />
    </mat-toolbar>
  );
});
