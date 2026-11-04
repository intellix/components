import {$, component$, useSignal} from '@qwik.dev/core';
import type {NoSerialize} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import type {MatDialogRef} from '@angular-community/qwik-material/dialog';
import {NgComponentHost} from '../../../scenarios/_mat-template';

/**
 * Exercises passing initial props to the opened component
 * (`MatDialogConfig.componentProps`) and updating them later through the
 * ref (`MatDialogRef.setInput`) — the Qwik-idiomatic replacement for
 * upstream's `dialogRef.componentInstance.x = …` /
 * `componentRef.setInput('x', …)`, neither of which apply to a Qwik
 * `component$`.
 */
const LabelBody = component$<{class?: string; label?: string}>(props => (
  <NgComponentHost class={props.class}>
    <div class="label-value" data-label>
      {props.label}
    </div>
  </NgComponentHost>
));

const Runner = component$(() => {
  const dialog = useMatDialog();
  const refSig = useSignal<NoSerialize<MatDialogRef> | null>(null);

  const onOpen$ = $(async () => {
    // No backdrop: the "Update label" trigger below is a page-level
    // button, outside the dialog's own content, which a backdrop would
    // otherwise cover and make unclickable.
    refSig.value = await dialog.open$(LabelBody, {
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
