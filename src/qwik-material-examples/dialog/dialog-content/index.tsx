import {$, component$} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import {MatButton} from '@angular-community/qwik-material/button';
import DialogContentDialog from './dialog';

/**
 * Port of material.angular.dev's `dialog-content` docs example
 * (src/components-examples/material/dialog/dialog-content/). The trigger is a bare `matButton`,
 * so a plain `<MatButton>` — only the dialog BODY's two action buttons need `./dialog.tsx`'s
 * reused `PlainButton` composition (same reasoning as `dialog/example`).
 */
export default component$(() => {
  const dialog = useMatDialog();

  const openDialog$ = $(async () => {
    const ref = await dialog.open$(DialogContentDialog);
    if (ref) {
      const result = await ref.afterClosed;
      console.log(`Dialog result: ${result}`);
    }
  });

  return (
    <>
      <dialog-content-example>
        <MatButton onClick$={openDialog$}>Open dialog</MatButton>
      </dialog-content-example>
    </>
  );
});
