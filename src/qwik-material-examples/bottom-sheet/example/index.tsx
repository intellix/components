import {$, component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import BottomSheetOverviewExampleSheet from './sheet';

/**
 * Port of material.angular.dev's `bottom-sheet-overview` docs example
 * (src/components-examples/material/bottom-sheet/bottom-sheet-overview/).
 *
 * `<QwikMaterialProvider>` renders a bare `<Slot/>` (no DOM of its own), so wrapping it here
 * instead of at the consuming route is DOM-equivalent — the route just adds the usual
 * `data-parity-root`/`data-scenario-ready` wrapper around this whole module.
 */
export default component$(() => {
  const bottomSheet = useMatBottomSheet();
  const openBottomSheet$ = $(async () => {
    await bottomSheet.open$(BottomSheetOverviewExampleSheet);
  });

  return (
    <QwikMaterialProvider>
      <bottom-sheet-overview-example>
        <p>You have received a file called "cat-picture.jpeg".</p>
        <MatButton appearance="elevated" onClick$={openBottomSheet$}>
          Open file
        </MatButton>
      </bottom-sheet-overview-example>
    </QwikMaterialProvider>
  );
});
