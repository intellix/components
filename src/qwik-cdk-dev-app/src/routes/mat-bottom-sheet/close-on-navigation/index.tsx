import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import {BottomSheetScenarioBody} from '../../../scenarios/_mat-bottom-sheet-template';

/** Bottom-sheet counterpart of mat-dialog/close-on-navigation. */
const Runner = component$(() => {
  const bottomSheet = useMatBottomSheet();

  const onOpenDefault$ = $(async () => {
    await bottomSheet.open$(BottomSheetScenarioBody, {hasBackdrop: true});
  });

  const onOpenDisabled$ = $(async () => {
    await bottomSheet.open$(BottomSheetScenarioBody, {hasBackdrop: true, closeOnNavigation: false});
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
