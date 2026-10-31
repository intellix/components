import {component$, useSignal, useStyles$} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatButton} from '@angular-community/qwik-material/button';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';
import styles from './snack-bar-overview-example.css?inline';

/**
 * Port of material.angular.dev's `snack-bar-overview` docs example
 * (src/components-examples/material/snack-bar/snack-bar-overview/). Two plain inputs (template
 * reference variables `#message`/`#action` upstream — tracked here via `onInput$` into local
 * signals, same end result) feed `MatSnackBar.open(message, action)` on click. Mirrors the
 * already-established `useMatSnackBar().open$(message, action)` convention (see
 * `mat-snack-bar/with-action`).
 */
export default component$(() => {
  useStyles$(styles);
  const snackBar = useMatSnackBar();
  const message = useSignal('Disco party!');
  const action = useSignal('Dance');

  return (
    <QwikMaterialProvider>
      <div data-parity-root>
        <snack-bar-overview-example>
          <MatFormField
            label={<MatLabel>Message</MatLabel>}
            control={
              <MatInput
                value="Disco party!"
                onInput$={(_, el) => {
                  message.value = el.value;
                }}
              />
            }
          />
          <MatFormField
            label={<MatLabel>Action</MatLabel>}
            control={
              <MatInput
                value="Dance"
                onInput$={(_, el) => {
                  action.value = el.value;
                }}
              />
            }
          />
          <MatButton
            appearance="outlined"
            onClick$={() => snackBar.open$(message.value, action.value)}
          >
            Show snack-bar
          </MatButton>
        </snack-bar-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
