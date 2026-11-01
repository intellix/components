import {component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatSnackBar} from '@angular-community/qwik-material/snack-bar';
import {FromTemplateContent} from '../../../scenarios/_mat-snack-bar-template';

/**
 * Mirrors `src/dev-app/qwik-parity/snack-bar.ts`'s `SnackBarFromTemplate`:
 * one trigger opens `snackBar.openFromTemplate(tpl)` — see
 * `FromTemplateContent`'s doc comment for the `openFromTemplate$`
 * deviation. A second trigger calls the service-level `dismiss()`.
 */
const Scenario = component$(() => {
  const snackBar = useMatSnackBar();

  return (
    <div data-parity-root>
      <button
        onClick$={() =>
          snackBar.openFromTemplate$(FromTemplateContent, {data: {recipient: 'Alex'}})
        }
      >
        Show template
      </button>
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
