import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatButton} from '@angular-community/qwik-material/button';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';
import PizzaPartySnack from './snack';
import styles from './example.css?inline';

/**
 * Port of material.angular.dev's `snack-bar-annotated-component` docs example
 * (src/components-examples/material/snack-bar/snack-bar-annotated-component/). Opens
 * `./snack.tsx`'s content component via `openFromComponent$`, with a `duration` computed from
 * the number input — same `openFromComponent$` call shape as
 * `src/qwik-cdk-dev-app/src/routes/mat-snack-bar/custom-component/`.
 */
export default component$(() => {
  useStyles$(styles);
  const snackBar = useMatSnackBar();
  const fc = useMatFormControl();
  const durationInSeconds = useSignal(5);

  return (
    <QwikMaterialProvider>
      <snack-bar-annotated-component-example>
        <MatFormField
          label={<MatLabel>Snack bar duration (seconds)</MatLabel>}
          touched={fc.touched}
          dirty={fc.dirty}
          invalid={false}
          control={
            <MatInput
              type="number"
              formBound
              touched={fc.touched}
              dirty={fc.dirty}
              invalid={false}
              value={String(durationInSeconds.value)}
              onInput$={(_, el) => {
                fc.markAsDirty$();
                durationInSeconds.value = Number(el.value);
              }}
              onBlur$={fc.markAsTouched$}
            />
          }
        />

        <MatButton
          appearance="outlined"
          ariaLabel="Show an example snack-bar"
          onClick$={() =>
            snackBar.openFromComponent$(PizzaPartySnack, {
              duration: durationInSeconds.value * 1000,
            })
          }
        >
          Pizza party
        </MatButton>
      </snack-bar-annotated-component-example>
    </QwikMaterialProvider>
  );
});
