import {component$, Slot, useContext, useVisibleTask$} from '@qwik.dev/core';
import {MAT_DIALOG_CONTAINER} from './mat-dialog-tokens';

export interface MatDialogActionsProps {
  align?: 'start' | 'center' | 'end';
}

export const MatDialogActions = component$<MatDialogActionsProps>(props => {
  const container = useContext(MAT_DIALOG_CONTAINER, undefined);

  useVisibleTask$(({cleanup}) => {
    container?.incrementActionSectionCount$();
    cleanup(() => container?.decrementActionSectionCount$());
  });

  const alignClass = props.align ? `mat-mdc-dialog-actions-align-${props.align}` : '';
  const cls = ['mat-mdc-dialog-actions', 'mdc-dialog__actions', alignClass]
    .filter(Boolean)
    .join(' ');

  return (
    <mat-dialog-actions class={cls}>
      <Slot />
    </mat-dialog-actions>
  );
});
