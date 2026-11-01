import {component$, Slot} from '@qwik.dev/core';

export const MatDialogContent = component$(() => (
  <mat-dialog-content class="mat-mdc-dialog-content mdc-dialog__content">
    <Slot />
  </mat-dialog-content>
));
