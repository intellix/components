import {component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';

/**
 * Mirrors `src/dev-app/qwik-parity/snack-bar.ts`'s `SnackBarVerticalPosition`:
 * two triggers, 'top' and 'bottom', each opening the same message with only
 * `verticalPosition` varying (horizontalPosition stays default 'center').
 */
const Scenario = component$(() => {
  const snackBar = useMatSnackBar();

  return (
    <div data-parity-root>
      <button onClick$={() => snackBar.open$('Positioned message', '', {verticalPosition: 'top'})}>
        Top
      </button>
      <button
        onClick$={() => snackBar.open$('Positioned message', '', {verticalPosition: 'bottom'})}
      >
        Bottom
      </button>
    </div>
  );
});

export default component$(() => (
  <QwikMaterialProvider>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
