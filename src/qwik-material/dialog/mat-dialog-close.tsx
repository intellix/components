import {$, component$, Slot, useContext} from '@qwik.dev/core';
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
    // Matches the real MatDialogClose directive's host bindings exactly:
    // `'[attr.aria-label]': 'ariaLabel || null'` (no default) and
    // `'[attr.type]': 'type'` (defaults to 'button') — no class of its own.
    <button
      mat-dialog-close
      type="button"
      aria-label={props.ariaLabel ?? undefined}
      disabled={props.disabled}
      onClick$={onClick$}
    >
      <Slot />
    </button>
  );
});
