import {$, component$, useSignal} from '@qwik.dev/core';
import type {NoSerialize} from '@qwik.dev/core';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import type {MatBottomSheetRef} from '@angular-community/qwik-material/bottom-sheet';

/**
 * Bottom-sheet counterpart of mat-dialog/set-input: exercises
 * `MatBottomSheetConfig.componentProps` + `MatBottomSheetRef.setInput`.
 */
const LabelBody = component$<{label?: string}>(props => (
  <div class="label-value" data-label>
    {props.label}
  </div>
));

const Runner = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const refSig = useSignal<NoSerialize<MatBottomSheetRef> | null>(null);

  const onOpen$ = $(async () => {
    // No backdrop: the "Update label" trigger below is a page-level
    // button, outside the sheet's own content, which a backdrop would
    // otherwise cover and make unclickable.
    refSig.value = await bottomSheet.open$(LabelBody, {
      hasBackdrop: false,
      componentProps: {label: 'initial'},
    });
  });

  const onUpdate$ = $(() => {
    refSig.value?.setInput('label', 'updated');
  });

  return (
    <>
      <button class="open-button" onClick$={onOpen$}>
        Open
      </button>
      <button class="update-button" onClick$={onUpdate$}>
        Update label
      </button>
    </>
  );
});

export default component$(() => (
  <>
    <div data-parity-root>
      <Runner />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
