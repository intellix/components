import {$, component$} from '@qwik.dev/core';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import {BottomSheetNavBody} from '../../../scenarios/_mat-bottom-sheet-template';

const Trigger = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const onClick$ = $(async () => {
    await bottomSheet.open$(BottomSheetNavBody, {hasBackdrop: true});
  });
  return (
    <button class="open-button" onClick$={onClick$}>
      Open
    </button>
  );
});

export default component$(() => (
  <>
    <div data-parity-root>
      <Trigger />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
