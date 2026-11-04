import {$, component$} from '@qwik.dev/core';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import {BottomSheetScenarioBody} from '../../../scenarios/_mat-bottom-sheet-template';

/** Bottom-sheet counterpart of mat-dialog/scroll-blocking. */
const Runner = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const onOpen$ = $(async () => {
    await bottomSheet.open$(BottomSheetScenarioBody, {hasBackdrop: true});
  });
  return (
    <button class="open-button" onClick$={onOpen$}>
      Open
    </button>
  );
});

export default component$(() => (
  <>
    <div data-parity-root>
      <Runner />
    </div>
    <main data-scenario-ready>ready</main>
    <div style="height: 3000px;" />
  </>
));
