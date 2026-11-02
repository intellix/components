import {component$, useContext} from '@qwik.dev/core';
import {MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent} from '@angular-community/qwik-material/dialog';

export interface DialogDataExampleData {
  animal: 'panda' | 'unicorn' | 'lion';
}

/**
 * Mirrors `dialog-data-example-dialog` (src/components-examples/material/dialog/dialog-data/
 * dialog-data-example-dialog.html) — a read-only dialog body with no close buttons of its own
 * (closed only via backdrop/Escape).
 */
export default component$(() => {
  const data = useContext(MAT_DIALOG_DATA) as DialogDataExampleData;

  return (
    <dialog-data-example-dialog class="mat-mdc-dialog-component-host">
      <MatDialogTitle>Favorite Animal</MatDialogTitle>
      <MatDialogContent>
        My favorite animal is:
        <ul>
          <li>
            {data.animal === 'panda' && <span>&#10003;</span>} Panda
          </li>
          <li>
            {data.animal === 'unicorn' && <span>&#10003;</span>} Unicorn
          </li>
          <li>
            {data.animal === 'lion' && <span>&#10003;</span>} Lion
          </li>
        </ul>
      </MatDialogContent>
    </dialog-data-example-dialog>
  );
});
