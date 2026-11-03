import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider, useMatDialog} from '@angular-community/qwik-material/dialog';
import {MatScenarioBody} from '../../../scenarios/_mat-template';

/**
 * Exercises `closeOnNavigation`: default `true` closes the dialog when the
 * user navigates back/forward in history (`popstate`) or the URL hash
 * changes (`hashchange`) — NOT on every link click (no router dependency
 * to tell those apart). `closeOnNavigation: false` opts out.
 */
const Runner = component$(() => {
  const dialog = useMatDialog();

  const onOpenDefault$ = $(async () => {
    await dialog.open$(MatScenarioBody, {hasBackdrop: true});
  });

  const onOpenDisabled$ = $(async () => {
    await dialog.open$(MatScenarioBody, {hasBackdrop: true, closeOnNavigation: false});
  });

  return (
    <>
      <button class="open-default-button" onClick$={onOpenDefault$}>
        Open (default closeOnNavigation)
      </button>
      <button class="open-disabled-button" onClick$={onOpenDisabled$}>
        Open (closeOnNavigation: false)
      </button>
    </>
  );
});

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root>
      <Runner />
    </div>
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
