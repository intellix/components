import {component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';
import {ParitySnackBarContent} from '../../../scenarios/_mat-snack-bar-template';

/**
 * Mirrors `src/dev-app/qwik-parity/snack-bar.ts`'s `SnackBarCustomComponent`:
 * one trigger opens `snackBar.openFromComponent(ParitySnackBarContent)` — no
 * config. Because the content provides its own `matSnackBarLabel`, the
 * outer `.mat-mdc-snack-bar-label` wrapper does NOT gain the extra
 * `mdc-snackbar__label` class.
 */
const Scenario = component$(() => {
  const snackBar = useMatSnackBar();

  return (
    <div data-parity-root>
      <button onClick$={() => snackBar.openFromComponent$(ParitySnackBarContent)}>
        Show custom
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
