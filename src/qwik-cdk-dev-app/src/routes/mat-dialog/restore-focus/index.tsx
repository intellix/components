import {$, component$} from '@qwik.dev/core';
import {
  QwikMaterialProvider,
  MatDialogClose,
  useMatDialog,
} from '@angular-community/qwik-material/dialog';
import {NgComponentHost} from '../../../scenarios/_mat-template';

const Body = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <button>Focus me</button>
    <MatDialogClose>Close</MatDialogClose>
  </NgComponentHost>
));

const Trigger = component$(() => {
  const dialog = useMatDialog();
  const onClick$ = $(async () => {
    await dialog.open$(Body, {hasBackdrop: true, restoreFocus: true});
  });
  return (
    <button class="restore-trigger" onClick$={onClick$}>
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
