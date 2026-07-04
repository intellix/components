import {$, component$} from '@builder.io/qwik';
import {
  QwikMaterialProvider,
  MatDialogClose,
  useMatDialog,
} from '@angular-community/qwik-material/dialog';

const Body = component$(() => (
  <>
    <button>Focus me</button>
    <MatDialogClose>Close</MatDialogClose>
  </>
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
    <Trigger />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
