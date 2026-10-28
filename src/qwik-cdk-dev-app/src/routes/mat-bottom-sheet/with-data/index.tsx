import {$, component$, useSignal} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import {BottomSheetDataBody} from '../../../scenarios/_mat-bottom-sheet-template';

const Trigger = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const result = useSignal('');
  const onClick$ = $(async () => {
    const ref = await bottomSheet.open$(BottomSheetDataBody, {
      hasBackdrop: true,
      data: {message: 'hello world'},
    });
    ref?.afterDismissed.then(r => {
      result.value = String(r ?? '(dismissed with no result)');
    });
  });
  return (
    <>
      <button class="open-button" onClick$={onClick$}>
        Open
      </button>
      <div class="result" data-result>
        {result.value}
      </div>
    </>
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
