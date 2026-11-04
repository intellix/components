import {$, component$} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import {MatFormField} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

/**
 * The root layout's `useMatProviders({formField: {appearance: 'outline'}})` call reaches this
 * dialog's own content, even though that content renders in `<OverlayContainerOutlet>`, a
 * SIBLING of this route under `<QwikCdkRoot>` — proves the dialog/bottom-sheet/overlay context
 * forwarding (`useMatContextSnapshot()`) also carries contexts the COMBINED `useMatProviders()`
 * hook provided, not just an individual `useMat*Provider()` call (see
 * `mat-dialog/context-inheritance` for the individual-hook version of this same scenario).
 */
const FormFieldBody = component$(() => <MatFormField control={<MatInput placeholder="test" />} />);

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

export default component$(() => (
  <>
    <div data-parity-root>
      <Runner />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
