import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import {BottomSheetFirstBody} from '../../../scenarios/_mat-bottom-sheet-template';

const Trigger = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const onOpenFirst$ = $(async () => {
    await bottomSheet.open$(BottomSheetFirstBody, {hasBackdrop: true});
  });
  return (
    <button class="open-first" onClick$={onOpenFirst$}>
      Open first
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
