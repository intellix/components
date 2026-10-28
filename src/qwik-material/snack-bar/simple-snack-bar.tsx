import {$, component$, useContext} from '@builder.io/qwik';
import {MAT_SNACK_BAR_DATA, MAT_SNACK_BAR_REF} from './mat-snack-bar-tokens';
import {MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel} from './mat-snack-bar-content';

/** Shape of the data `MatSnackBar.open(message, action, config)` passes in. */
export interface TextOnlySnackBarData {
  message: string;
  action: string;
}

/**
 * Qwik port of `src/material/snack-bar/simple-snack-bar.ts` +
 * `simple-snack-bar.html`. Rendered by `useMatSnackBar().open$()`
 * (the convenience `message` + `action` overload) — never instantiated
 * directly by consumers, same as upstream.
 */
export const SimpleSnackBar = component$(() => {
  const data = useContext(MAT_SNACK_BAR_DATA) as TextOnlySnackBarData;
  const snackBarRef = useContext(MAT_SNACK_BAR_REF, undefined);
  const hasAction = !!data?.action;

  const action$ = $(() => {
    snackBarRef?.dismissWithAction();
  });

  return (
    <simple-snack-bar class="mat-mdc-simple-snack-bar">
      <MatSnackBarLabel>{data.message}</MatSnackBarLabel>
      {hasAction && (
        <MatSnackBarActions>
          <MatSnackBarAction onClick$={action$}>{data.action}</MatSnackBarAction>
        </MatSnackBarActions>
      )}
    </simple-snack-bar>
  );
});
