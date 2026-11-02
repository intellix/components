import {$, component$, useContext} from '@qwik.dev/core';
import {MAT_DIALOG_REF, MatDialogTitle, MatDialogContent, MatDialogActions} from '@angular-community/qwik-material/dialog';
import {PlainButton} from '../example/plain-button';

/**
 * Mirrors `dialog-animations-example-dialog` (src/components-examples/material/dialog/
 * dialog-animations/dialog-animations-example-dialog.html). Both "No"/"Ok" buttons are bare
 * `matButton mat-dialog-close` (no bound value) — reuses `dialog/example/plain-button.tsx`'s
 * `PlainButton`, same as `dialog-content/dialog.tsx`.
 */
export default component$(() => {
  const dialogRef = useContext(MAT_DIALOG_REF);
  const onClose$ = $(() => dialogRef?.close());

  return (
    <dialog-animations-example-dialog class="mat-mdc-dialog-component-host">
      <MatDialogTitle>Delete file</MatDialogTitle>
      <MatDialogContent>Would you like to delete cat.jpeg?</MatDialogContent>
      <MatDialogActions>
        <PlainButton type="button" onClick$={onClose$}>
          No
        </PlainButton>
        <PlainButton type="button" cdkFocusInitial onClick$={onClose$}>
          Ok
        </PlainButton>
      </MatDialogActions>
    </dialog-animations-example-dialog>
  );
});
