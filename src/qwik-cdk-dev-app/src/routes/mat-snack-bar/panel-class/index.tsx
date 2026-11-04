import {component$} from '@qwik.dev/core';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';

/**
 * Mirrors `src/dev-app/qwik-parity/snack-bar.ts`'s `SnackBarPanelClass`: one
 * trigger opens `snackBar.open('Styled message', '', {panelClass: [...]})`
 * with a two-element array — both classes must land directly on the
 * `<mat-snack-bar-container>` host element.
 */
const Scenario = component$(() => {
  const snackBar = useMatSnackBar();

  return (
    <div data-parity-root>
      <button
        onClick$={() =>
          snackBar.open$('Styled message', '', {panelClass: ['my-snack-a', 'my-snack-b']})
        }
      >
        Show styled
      </button>
    </div>
  );
});

export default component$(() => (
  <>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </>
));
