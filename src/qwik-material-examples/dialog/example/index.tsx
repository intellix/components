import {$, component$, useSignal} from '@qwik.dev/core';
import {QwikMaterialProvider, useMatDialog} from '@angular-community/qwik-material/dialog';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatButton} from '@angular-community/qwik-material/button';
import DialogBody from './dialog-body';

/**
 * Port of material.angular.dev's `dialog-overview` docs example
 * (src/components-examples/material/dialog/dialog-overview/). The trigger's own `<button
 * matButton="elevated">` has no second directive stacked on it, so it's a plain `<MatButton>` —
 * only the dialog BODY's two action buttons need the local composition `./plain-button.tsx`
 * documents.
 *
 * `<QwikMaterialProvider>` renders a bare `<Slot/>` (no DOM of its own), so wrapping it here
 * instead of at the consuming route is DOM-equivalent — the route just adds the usual
 * `data-parity-root`/`data-scenario-ready` wrapper around this whole module.
 */
export default component$(() => {
  const dialog = useMatDialog();
  const fc = useMatFormControl();
  const name = useSignal('');
  const animal = useSignal('');

  const openDialog$ = $(async () => {
    const ref = await dialog.open$(DialogBody, {
      data: {name: name.value, animal: animal.value},
    });
    if (ref) {
      const result = await ref.afterClosed;
      if (result !== undefined) {
        animal.value = result as string;
      }
    }
  });

  return (
    <QwikMaterialProvider>
      <dialog-overview-example>
        <ol>
          <li>
            <MatFormField
              label={<MatLabel>What's your name?</MatLabel>}
              touched={fc.touched}
              dirty={fc.dirty}
              invalid={false}
              control={
                <MatInput
                  formBound
                  touched={fc.touched}
                  dirty={fc.dirty}
                  invalid={false}
                  onInput$={(_, el) => {
                    fc.markAsDirty$();
                    name.value = el.value;
                  }}
                  onBlur$={fc.markAsTouched$}
                />
              }
            />
          </li>
          <li>
            <MatButton appearance="elevated" onClick$={openDialog$}>
              Pick one
            </MatButton>
          </li>
          {animal.value && (
            <li>
              You chose: <em>{animal.value}</em>
            </li>
          )}
        </ol>
      </dialog-overview-example>
    </QwikMaterialProvider>
  );
});
