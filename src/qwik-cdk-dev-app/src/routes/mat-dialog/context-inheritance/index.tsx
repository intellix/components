import {$, component$} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import {MatFormField, useMatFormFieldProvider} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {NgComponentHost} from '../../../scenarios/_mat-template';

/**
 * Exercises automatically carrying qwik-material configuration contexts
 * into overlay content: `useMatFormFieldProvider({appearance: 'outline'})` is called INSIDE
 * `<QwikCdkRoot>` (the usual route-level wrapper), above the button that opens the dialog, but
 * the dialog's own content renders in `<OverlayContainerOutlet>`, a SIBLING of this whole
 * route under `<QwikCdkRoot>` — not a descendant of this call's own component. The form field
 * inside the dialog, which sets no `appearance` prop of its own, must still pick up
 * `'outline'`.
 */
const FormFieldBody = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <MatFormField control={<MatInput placeholder="test" />} />
  </NgComponentHost>
));

const Runner = component$(() => {
  const dialog = useMatDialog();
  const onOpen$ = $(async () => {
    await dialog.open$(FormFieldBody, {hasBackdrop: true});
  });
  return (
    <button class="open-button" onClick$={onOpen$}>
      Open
    </button>
  );
});

export default component$(() => {
  useMatFormFieldProvider({appearance: 'outline'});
  return (
    <>
      <div data-parity-root>
        <Runner />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
