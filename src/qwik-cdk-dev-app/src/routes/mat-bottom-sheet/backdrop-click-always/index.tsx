import {$, component$, useContext, useSignal} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatBottomSheet, MAT_BOTTOM_SHEET_REF} from '@angular-community/qwik-material/bottom-sheet';

/**
 * Bottom-sheet counterpart of mat-dialog/backdrop-click-always: upstream
 * `MatBottomSheetRef.backdropClick()` always emits on a backdrop click, even
 * when `disableClose` is true. Also exercises mutating
 * `matBottomSheetRef.disableClose` after open (the live field the
 * Escape/backdrop handlers read on every event).
 *
 * The "Allow close" trigger lives INSIDE the sheet's own content (reading
 * the ref via `MAT_BOTTOM_SHEET_REF`) rather than as a page-level button —
 * same backdrop-covers-the-page reasoning as the dialog version.
 */
const Body = component$(() => {
  const ref = useContext(MAT_BOTTOM_SHEET_REF);
  const onAllowClose$ = $(() => {
    if (ref) ref.disableClose = false;
  });
  return (
    <div class="mat-scenario-body">
      <button class="allow-close-button" onClick$={onAllowClose$}>
        Allow close
      </button>
    </div>
  );
});

const Runner = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const clickCount = useSignal(0);

  const onOpen$ = $(async () => {
    await bottomSheet.open$(Body, {
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
