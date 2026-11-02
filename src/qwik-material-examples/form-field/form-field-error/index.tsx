import {component$, useStyles$} from '@qwik.dev/core';
import {
  MatError,
  MatFormField,
  MatLabel,
  matEmailValidator,
  matRequiredValidator,
  matValidationErrors,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import styles from './form-field-error-example.css?inline';

/**
 * Port of material.angular.dev's `form-field-error` docs example
 * (src/components-examples/material/form-field/form-field-error/) — follows the Overview guide's
 * own prescribed `useMatFormControl()` + `matValidationErrors()` pattern (see
 * `/components/form-field/overview/#error-messages`). `email` starts `''`, so `required` already
 * fails from first render (`ng-invalid` from the start — raw validity classes mirror validity
 * directly, never gated by `touched`), but `<MatError>` itself stays hidden until actually
 * touched (`MatFormField`'s own `errorState` gate — see that component's doc comment), matching
 * upstream's default-render DOM exactly (confirmed live: no `<mat-error>` on first paint despite
 * `email.invalid` already being `true`).
 */
export default component$(() => {
  useStyles$(styles);
  const email = useMatFormControl({value: ''});
  const errors = matValidationErrors(email.value, [matRequiredValidator, matEmailValidator]);
  const errorMessage = errors?.required
    ? 'You must enter a value'
    : errors?.email
      ? 'Not a valid email'
      : '';

  return (
    <form-field-error-example>
      <div class="example-container">
        <MatFormField
          label={<MatLabel>Enter your email</MatLabel>}
          touched={email.touched}
          dirty={email.dirty}
          invalid={errors !== null}
          control={
            <MatInput
              placeholder="pat@example.com"
              required
              formBound
              value={email.value}
              touched={email.touched}
              dirty={email.dirty}
              invalid={errors !== null}
              onInput$={(_, el) => email.setValue$(el.value)}
              onBlur$={() => email.markAsTouched$()}
            />
          }
          errors={errors !== null ? <MatError>{errorMessage}</MatError> : undefined}
        />
      </div>
    </form-field-error-example>
  );
});
