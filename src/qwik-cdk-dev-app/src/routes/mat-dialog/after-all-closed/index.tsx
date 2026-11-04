import {$, component$, useSignal} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import {MatScenarioBody} from '../../../scenarios/_mat-template';

/**
 * Exercises `MatDialog.afterAllClosed$`: the Qwik-idiomatic replacement
 * for upstream's `MatDialog.afterAllClosed` Observable (emits whenever
 * the open-dialog count reaches zero). Opens two dialogs at once and
 * closes them individually: the callback must fire only once, after the
 * SECOND one closes (count genuinely reaches zero), not after the first.
 */
const Runner = component$(() => {
  const dialog = useMatDialog();
  const fireCount = useSignal(0);

  const onSetup$ = $(async () => {
    await dialog.afterAllClosed$(
      $(() => {
        fireCount.value++;
      }),
    );
  });

  const onOpenTwo$ = $(async () => {
    await dialog.open$(MatScenarioBody, {id: 'dialog-a', hasBackdrop: false});
    await dialog.open$(MatScenarioBody, {id: 'dialog-b', hasBackdrop: false});
  });

  const onCloseA$ = $(async () => {
    await dialog.close$('dialog-a');
  });

  const onCloseB$ = $(async () => {
    await dialog.close$('dialog-b');
  });

  return (
    <>
      <button class="setup-button" onClick$={onSetup$}>
        Register afterAllClosed
      </button>
      <button class="open-two-button" onClick$={onOpenTwo$}>
        Open two
      </button>
      <button class="close-a-button" onClick$={onCloseA$}>
        Close A
      </button>
      <button class="close-b-button" onClick$={onCloseB$}>
        Close B
      </button>
      <div class="fire-count" data-fire-count>
        {fireCount.value}
      </div>
    </>
  );
});

export default component$(() => (
  <>
    <div data-parity-root>
      <Runner />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
