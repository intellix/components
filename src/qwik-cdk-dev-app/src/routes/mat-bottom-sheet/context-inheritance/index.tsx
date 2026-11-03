import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {useMatBottomSheet} from '@angular-community/qwik-material/bottom-sheet';
import {MatFormField} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

/** Bottom-sheet counterpart of mat-dialog/context-inheritance. */
const FormFieldBody = component$(() => (
  <div class="mat-scenario-body">
    <MatFormField control={<MatInput placeholder="test" />} />
  </div>
));

const Runner = component$(() => {
  const bottomSheet = useMatBottomSheet();
  const onOpen$ = $(async () => {
    await bottomSheet.open$(FormFieldBody, {hasBackdrop: true});
  });
  return (
    <button class="open-button" onClick$={onOpen$}>
      Open
    </button>
  );
});

export default component$(() => (
  <QwikMaterialProvider matFormFieldConfig={{appearance: 'outline'}}>
    <div data-parity-root>
      <Runner />
    </div>
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
