import {$, component$, useContext, useSignal} from '@qwik.dev/core';
import {
  MAT_DIALOG_DATA,
  MAT_DIALOG_REF,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular-community/qwik-material/dialog';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {PlainButton} from './plain-button';

export interface DialogOverviewData {
  name: string;
  animal: string;
}

/**
 * Mirrors `dialog-overview-example-dialog` (src/components-examples/material/dialog/dialog-
 * overview/dialog-overview-example.ts's second component). `animal` starts as a copy of
 * `data.animal` (upstream: `model(this.data.animal)`) and is read back out by the "Ok" button's
 * `[mat-dialog-close]="animal()"` — reproduced here as a plain `dialogRef.close(animal.value)`
 * call (see `./plain-button.tsx`'s header comment for why this isn't `<MatDialogClose>`).
 */
export default component$(() => {
  const data = useContext(MAT_DIALOG_DATA) as DialogOverviewData;
  const dialogRef = useContext(MAT_DIALOG_REF);
  const fc = useMatFormControl();
  const animal = useSignal(data.animal);

  const onNoClick$ = $(() => {
    dialogRef?.close();
  });
  const onOkClick$ = $(() => {
    dialogRef?.close(animal.value);
  });

  return (
    <dialog-overview-example-dialog class="mat-mdc-dialog-component-host">
      <MatDialogTitle>Hi {data.name}</MatDialogTitle>
      <MatDialogContent>
        <p>What's your favorite animal?</p>
        <MatFormField
          label={<MatLabel>Favorite Animal</MatLabel>}
          touched={fc.touched}
          dirty={fc.dirty}
          invalid={false}
          control={
            <MatInput
              formBound
              touched={fc.touched}
              dirty={fc.dirty}
              invalid={false}
              value={data.animal}
              onInput$={(_, el) => {
                fc.markAsDirty$();
                animal.value = el.value;
              }}
              onBlur$={fc.markAsTouched$}
            />
          }
        />
      </MatDialogContent>
      <MatDialogActions>
        <PlainButton onClick$={onNoClick$}>No Thanks</PlainButton>
        <PlainButton type="button" cdkFocusInitial onClick$={onOkClick$}>
          Ok
        </PlainButton>
      </MatDialogActions>
    </dialog-overview-example-dialog>
  );
});
