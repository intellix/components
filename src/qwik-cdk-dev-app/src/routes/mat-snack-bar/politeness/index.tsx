import {component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';

/**
 * Mirrors `src/dev-app/qwik-parity/snack-bar.ts`'s `SnackBarPoliteness`: two
 * triggers, 'assertive' and 'off' ('polite', the default, is already
 * covered by every other scenario). Neither sets `announcementMessage`, so
 * each only changes the live element's `aria-live` value.
 */
const Scenario = component$(() => {
  const snackBar = useMatSnackBar();

  return (
    <div data-parity-root>
      <button onClick$={() => snackBar.open$('Announced message', '', {politeness: 'assertive'})}>
        Assertive
      </button>
      <button onClick$={() => snackBar.open$('Announced message', '', {politeness: 'off'})}>
        Off
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
