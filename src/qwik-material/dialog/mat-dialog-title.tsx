import {component$, Slot, useContext, useSignal, useVisibleTask$} from '@builder.io/qwik';
import {MAT_DIALOG_CONTAINER} from './mat-dialog-tokens';

let _idSeq = 0;
function nextTitleId(): string {
  return `mat-mdc-dialog-title-${_idSeq++}`;
}

export interface MatDialogTitleProps {
  /** Optional id; when omitted, a stable per-mount id is generated. */
  id?: string;
}

export const MatDialogTitle = component$<MatDialogTitleProps>(props => {
  const container = useContext(MAT_DIALOG_CONTAINER, undefined);
  const idSignal = useSignal<string>(props.id ?? nextTitleId());

  useVisibleTask$(({cleanup}) => {
    const id = idSignal.value;
    container?.registerTitleId$(id);
    cleanup(() => container?.unregisterTitleId$(id));
  });

  return (
    <h2 mat-dialog-title id={idSignal.value} class="mat-mdc-dialog-title mdc-dialog__title">
      <Slot />
    </h2>
  );
});
