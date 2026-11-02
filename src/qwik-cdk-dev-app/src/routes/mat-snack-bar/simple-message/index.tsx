import {component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';

/**
 * Mirrors `src/dev-app/qwik-parity/snack-bar.ts`'s `SnackBarSimpleMessage`:
 * one trigger opens `snackBar.open('File deleted')` — no action, default
 * politeness/position. A second trigger calls the service-level `dismiss()`.
 */
const Scenario = component$(() => {
  const snackBar = useMatSnackBar();

  return (
    <div data-parity-root>
      <button onClick$={() => snackBar.open$('File deleted')}>Show message</button>
      <button onClick$={() => snackBar.dismiss$()}>Dismiss</button>
    </div>
  );
});

export default component$(() => (
  <QwikMaterialProvider>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
