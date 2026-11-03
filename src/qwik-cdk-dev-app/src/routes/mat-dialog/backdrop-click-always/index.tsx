import {$, component$, useContext, useSignal} from '@qwik.dev/core';
import {QwikMaterialProvider, useMatDialog, MAT_DIALOG_REF} from '@angular-community/qwik-material/dialog';
import {NgComponentHost} from '../../../scenarios/_mat-template';

/**
 * Exercises the backdropClick-fires-regardless-of-disableClose fix: upstream
 * `MatDialogRef.backdropClick()` always emits on a backdrop click, even when
 * `disableClose` is true — apps use this to show a "discard changes?"
 * confirmation. Also exercises mutating `matDialogRef.disableClose` after
 * open (the live field the Escape/backdrop handlers read on every event).
 *
 * The "Allow close" trigger lives INSIDE the dialog's own content (reading
 * the ref via `MAT_DIALOG_REF`, the context `MatDialogContainer` already
 * provides) rather than as a page-level button: once the dialog is open
 * with `hasBackdrop: true`, the backdrop covers the whole page and
 * intercepts clicks on anything outside the dialog's own pane.
 */
const Body = component$<{class?: string}>(props => {
  const ref = useContext(MAT_DIALOG_REF);
  const onAllowClose$ = $(() => {
    if (ref) ref.disableClose = false;
  });
  return (
    <NgComponentHost class={props.class}>
      <button class="allow-close-button" onClick$={onAllowClose$}>
        Allow close
      </button>
    </NgComponentHost>
  );
});

const Runner = component$(() => {
  const dialog = useMatDialog();
  const clickCount = useSignal(0);

  const onOpen$ = $(async () => {
    await dialog.open$(Body, {
      hasBackdrop: true,
      disableClose: true,
      onBackdropClick$: $(() => {
        clickCount.value++;
      }),
    });
  });

  return (
    <>
      <button class="open-button" onClick$={onOpen$}>
        Open
      </button>
      <div class="backdrop-click-count" data-count>
        {clickCount.value}
      </div>
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
