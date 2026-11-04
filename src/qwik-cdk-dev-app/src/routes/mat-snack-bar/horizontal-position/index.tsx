import {component$} from '@qwik.dev/core';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';

/**
 * Mirrors `src/dev-app/qwik-parity/snack-bar.ts`'s
 * `SnackBarHorizontalPosition`: five triggers, one per
 * `MatSnackBarHorizontalPosition` value, each opening the same message with
 * only `horizontalPosition` varying. Clicking a later trigger while an
 * earlier snack bar is still open exercises the "replace" path.
 */
const Scenario = component$(() => {
  const snackBar = useMatSnackBar();

  return (
    <div data-parity-root>
      <button
        onClick$={() => snackBar.open$('Positioned message', '', {horizontalPosition: 'start'})}
      >
        Start
      </button>
      <button
        onClick$={() => snackBar.open$('Positioned message', '', {horizontalPosition: 'center'})}
      >
        Center
      </button>
      <button
        onClick$={() => snackBar.open$('Positioned message', '', {horizontalPosition: 'end'})}
      >
        End
      </button>
      <button
        onClick$={() => snackBar.open$('Positioned message', '', {horizontalPosition: 'left'})}
      >
        Left
      </button>
      <button
        onClick$={() => snackBar.open$('Positioned message', '', {horizontalPosition: 'right'})}
      >
        Right
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
