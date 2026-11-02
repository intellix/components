import {$, component$, useContext, useStyles$} from '@qwik.dev/core';
import {
  MAT_SNACK_BAR_REF,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarLabel,
} from '@angular-community/qwik-material/snack-bar';
import snackStyles from './snack.css?inline';

/**
 * Mirrors `snack-bar-annotated-component-example-snack` (src/components-examples/material/
 * snack-bar/snack-bar-annotated-component/snack-bar-annotated-component-example-snack.html) —
 * the content component opened via `openFromComponent$`. Same pattern as
 * `src/qwik-cdk-dev-app/src/scenarios/_mat-snack-bar-template.tsx`'s `ParitySnackBarContent`
 * (explicit host tag matching upstream's real `selector`, `MatSnackBarRef` read via context for
 * `dismissWithAction()`).
 */
export default component$(() => {
  useStyles$(snackStyles);
  const snackBarRef = useContext(MAT_SNACK_BAR_REF, undefined);
  const onClick$ = $(() => snackBarRef?.dismissWithAction());

  return (
    <snack-bar-annotated-component-example-snack>
      <MatSnackBarLabel as="span" class="example-pizza-party">
        Pizza party!!!
      </MatSnackBarLabel>
      <MatSnackBarActions as="span">
        <MatSnackBarAction onClick$={onClick$}>🍕</MatSnackBarAction>
      </MatSnackBarActions>
    </snack-bar-annotated-component-example-snack>
  );
});
