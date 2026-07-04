import {$, component$, useSignal} from '@builder.io/qwik';
import {
  QwikMaterialProvider,
  MatDialogClose,
  useMatDialog,
} from '@angular-community/qwik-material/dialog';

const Body = component$(() => (
  <MatDialogClose result="hello world">Close with result</MatDialogClose>
));

const Runner = component$(() => {
  const dialog = useMatDialog();
  const result = useSignal<string>('');
  const onClick$ = $(async () => {
    const ref = await dialog.open$(Body, {hasBackdrop: true});
    if (ref) {
      const r = await ref.afterClosed;
      result.value = String(r ?? '(closed with no result)');
    }
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
    <Runner />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
