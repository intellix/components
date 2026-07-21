import {$, component$, Slot, useContext} from '@builder.io/qwik';
import {MAT_DIALOG_REF} from './mat-dialog-tokens';

export interface MatDialogCloseProps {
  /** Value forwarded to matDialogRef.close(). Consumers read it via ref.afterClosed. */
  result?: unknown;
  /** aria-label for the button. */
  ariaLabel?: string;
  /** Passthrough disabled state. */
  disabled?: boolean;
}

export const MatDialogClose = component$<MatDialogCloseProps>(props => {
  const ref = useContext(MAT_DIALOG_REF, undefined);

  const onClick$ = $(() => {
    ref?.close(props.result as any);
  });

  return (
    <button
      mat-dialog-close
      type="button"
      class="mat-mdc-dialog-close"
      aria-label={props.ariaLabel ?? 'Close dialog'}
      disabled={props.disabled}
      onClick$={onClick$}
    >
      <Slot />
    </button>
  );
});
