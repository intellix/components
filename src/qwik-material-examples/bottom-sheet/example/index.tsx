import {$, component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import BottomSheetOverviewExampleSheet from './sheet';

/**
 * Port of material.angular.dev's `bottom-sheet-overview` docs example
 * (src/components-examples/material/bottom-sheet/bottom-sheet-overview/).
 */
export default component$(() => {
  const bottomSheet = useMatBottomSheet();
  const openBottomSheet$ = $(async () => {
    await bottomSheet.open$(BottomSheetOverviewExampleSheet);
  });

  return (
    <bottom-sheet-overview-example>
      <p>You have received a file called "cat-picture.jpeg".</p>
      <MatButton appearance="elevated" onClick$={openBottomSheet$}>
        Open file
      </MatButton>
    </bottom-sheet-overview-example>
  );
});
