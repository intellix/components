import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';

/**
 * Mirrors `src/dev-app/qwik-parity/snack-bar.ts`'s `SnackBarWithAction`: one
 * trigger opens `snackBar.open('Message archived', 'Undo')` — exercises
 * `SimpleSnackBar`'s action branch. Clicking the snack bar's own action
 * button calls `MatSnackBarRef.dismissWithAction()` (wired inside
 * `SimpleSnackBar` itself via `MAT_SNACK_BAR_REF` context).
 */
const Scenario = component$(() => {
  const snackBar = useMatSnackBar();

  return (
    <div data-parity-root>
      <button onClick$={() => snackBar.open$('Message archived', 'Undo')}>Show with action</button>
    </div>
  );
});

export default component$(() => (
  <QwikMaterialProvider>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
