import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {
  MatFormField,
  MatLabel,
  MatTextPrefix,
  MatTextSuffix,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatIconButton} from '@angular-community/qwik-material/button';
import {MatIcon} from '@angular-community/qwik-material/icon';
import styles from './form-field-prefix-suffix-example.css?inline';

/**
 * Port of material.angular.dev's `form-field-prefix-suffix` docs example
 * (src/components-examples/material/form-field/form-field-prefix-suffix/) — a password-visibility
 * icon-button suffix, and a `$`/`.00` text prefix+suffix pair on an always-floated amount field.
 * The real template's `<button matIconButton matSuffix>` carries the suffix selector DIRECTLY on
 * the button — no wrapping element (confirmed live: the real DOM has
 * `<div class="mat-mdc-form-field-icon-suffix"><button maticonbutton matsuffix ...>`, no extra
 * `<span>`) — so `<MatIconButton>` is passed straight through as `iconSuffix`, unwrapped, same
 * reasoning as `form-field-appearance`'s own doc comment. `<MatIconSuffix>` is for upstream's
 * OTHER shape (a bare consumer `<span matIconSuffix>`, as `prefix-suffix-icon`'s own mirror
 * scenario uses).
 */
export default component$(() => {
  useStyles$(styles);
  const hide = useSignal(true);

  return (
    <form-field-prefix-suffix-example>
      <div class="example-container">
        <MatFormField
          label={<MatLabel>Enter your password</MatLabel>}
          control={<MatInput type={hide.value ? 'password' : 'text'} />}
          iconSuffix={
            <MatIconButton
              ariaLabel="Hide password"
              aria-pressed={hide.value}
              onClick$={(e: MouseEvent) => {
                hide.value = !hide.value;
                e.stopPropagation();
              }}
            >
              <MatIcon>{hide.value ? 'visibility_off' : 'visibility'}</MatIcon>
            </MatIconButton>
          }
        />

        <MatFormField
          floatLabel="always"
          label={<MatLabel>Amount</MatLabel>}
          textPrefix={<MatTextPrefix>{'$ '}</MatTextPrefix>}
          control={<MatInput type="number" class="example-right-align" placeholder="0" />}
          textSuffix={<MatTextSuffix>.00</MatTextSuffix>}
        />
      </div>
    </form-field-prefix-suffix-example>
  );
});
