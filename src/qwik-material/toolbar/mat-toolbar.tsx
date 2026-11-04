import {component$, Slot} from '@qwik.dev/core';
import type {MatToolbarColor} from './toolbar-color';
import type {OpenString} from '../core/open-string';

export interface MatToolbarProps {
  /**
   * Theme color class. Deprecated in M3 but honoured. Adds `mat-<color>`
   * class. Upstream (`src/material/toolbar/toolbar.ts:59`) types `color`
   * `string | null` — any value is accepted — so this prop accepts any
   * string too, while still suggesting the three palette names.
   */
  color?: OpenString<MatToolbarColor>;
  /**
   * When true, applies `mat-toolbar-multiple-rows` class instead of
   * `mat-toolbar-single-row`. Consumer opts in explicitly because Qwik
   * cannot query projected children at render time (upstream uses
   * @ContentChildren for this detection).
   */
  multipleRows?: boolean;
  class?: string | ReadonlyArray<string>;
  id?: string;
  /** Inline style. Nothing is computed for this host, so it's a plain passthrough — mirrors
   *  Angular, which lets an app bind `style` on `<mat-toolbar>` directly (no host style bindings
   *  of its own to merge with, unlike `MatDrawer`/`MatDrawerContent`). */
  style?: string | Record<string, string | number>;
}

export const MatToolbar = component$<MatToolbarProps>(props => {
  const classes = [
    'mat-toolbar',
    props.color ? `mat-${props.color}` : '',
    props.multipleRows ? 'mat-toolbar-multiple-rows' : 'mat-toolbar-single-row',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-toolbar id={props.id} class={classes} style={props.style}>
      <Slot />
    </mat-toolbar>
  );
});
