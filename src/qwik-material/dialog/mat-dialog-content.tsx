import {component$, Slot} from '@builder.io/qwik';

export const MatDialogContent = component$(() => (
  <div class="mat-mdc-dialog-content mdc-dialog__content">
    <Slot />
  </div>
));
