import {$, component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import {BottomSheetScenarioBody} from '../../../scenarios/_mat-bottom-sheet-template';

const Trigger = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const onClick$ = $(async () => {
    await bottomSheet.open$(BottomSheetScenarioBody, {
      hasBackdrop: true,
      panelClass: ['my-panel-a', 'my-panel-b'],
      backdropClass: 'my-backdrop-class',
    });
  });
  return (
    <button class="open-button" onClick$={onClick$}>
      Open
    </button>
  );
});

export default component$(() => (
  <QwikMaterialProvider>
    <div data-parity-root>
      <Trigger />
    </div>
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
