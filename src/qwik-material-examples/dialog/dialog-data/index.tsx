import {$, component$} from '@qwik.dev/core';
import {QwikMaterialProvider, useMatDialog} from '@angular-community/qwik-material/dialog';
import {MatButton} from '@angular-community/qwik-material/button';
import DialogDataDialog from './dialog';

/**
 * Port of material.angular.dev's `dialog-data` docs example
 * (src/components-examples/material/dialog/dialog-data/). The trigger is a bare `matButton` (no
 * second directive stacked on it), so it's a plain `<MatButton>` — unlike `dialog/example`'s
 * action buttons, nothing here needs the local `PlainButton` composition workaround.
 *
 * `<QwikMaterialProvider>` renders a bare `<Slot/>` (no DOM of its own) — see `dialog/example/
 * index.tsx`'s header comment for why wrapping it here is DOM-equivalent to the route doing it.
 */
export default component$(() => {
  const dialog = useMatDialog();

  const openDialog$ = $(() => {
    dialog.open$(DialogDataDialog, {data: {animal: 'panda'}});
  });

  return (
    <QwikMaterialProvider>
      <dialog-data-example>
        <MatButton onClick$={openDialog$}>Open dialog</MatButton>
      </dialog-data-example>
    </QwikMaterialProvider>
  );
});
