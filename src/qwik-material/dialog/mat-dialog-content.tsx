import {component$, Slot} from '@qwik.dev/core';

export interface MatDialogContentProps {
  /**
   * Extra classes merged onto the host — e.g. `class="mat-typography"`, a common Material
   * pattern for enabling typography styles within dialog content (see upstream's own
   * `dialog-content` docs example, `src/components-examples/material/dialog/dialog-content/
   * dialog-content-example-dialog.html`'s `<mat-dialog-content class="mat-typography">`).
   * Upstream's directive has no dedicated `class` `@Input` either — this is just Angular's
   * normal `[class]`/static-attribute merging on any host element, which a Qwik component has
   * no equivalent of without an explicit prop.
   */
  class?: string | ReadonlyArray<string>;
}

export const MatDialogContent = component$<MatDialogContentProps>(props => {
  const extra = props.class == null ? [] : Array.isArray(props.class) ? props.class : [props.class];
  const classes = ['mat-mdc-dialog-content', 'mdc-dialog__content', ...extra];
  return (
    <mat-dialog-content class={classes}>
      <Slot />
    </mat-dialog-content>
  );
});
