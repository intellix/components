import {$, component$} from '@qwik.dev/core';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import {BottomSheetFocusableBody} from '../../../scenarios/_mat-bottom-sheet-template';

const Trigger = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const onClick$ = $(async () => {
    await bottomSheet.open$(BottomSheetFocusableBody, {
      hasBackdrop: true,
      autoFocus: 'first-heading',
      restoreFocus: true,
    });
  });
  return (
    <button class="restore-trigger" onClick$={onClick$}>
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
