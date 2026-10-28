import {component$} from '@builder.io/qwik';
import {
  MatError,
  MatFormField,
  MatLabel,
  matControlHasValidator,
  matEmailValidator,
  matRequiredValidator,
  matValidationErrors,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

// Mirrors src/dev-app/qwik-parity/form-field.ts's FormFieldErrorState —
// `nameControl = new FormControl('', Validators.required)` / `emailControl
// = new FormControl('', [Validators.required, Validators.email])`. See
// core/mat-form-control.ts's doc comment for why the validators list is a
// plain array computed here (never threaded through the reactive control
// store itself) and matControlHasValidator/matValidationErrors are called
// directly, inline, exactly mirroring the Angular template's own
// `@if (nameControl.invalid)` / `.hasError('required')` decisions.
//
// Declared INSIDE the component (not at module scope) deliberately: Qwik's
// optimizer extracts `component$`'s callback into its own lazy-loaded QRL
// chunk, and a module-scope array referenced from inside it (here, one
// containing function values) was found to crash the SSR bundle at
// runtime ("Cannot access 't' before initialization" — a minified-bundle
// TDZ error) when the dev-app was built and curled directly. Keeping them
// as local consts, recomputed fresh every render, sidesteps that
// cross-chunk-capture path entirely and is harmless (cheap array
// literals).
export default component$(() => {
  const nameValidators = [matRequiredValidator];
  const emailValidators = [matRequiredValidator, matEmailValidator];

  const nameControl = useMatFormControl({value: ''});
  const nameErrors = matValidationErrors(nameControl.value, nameValidators);

  const emailControl = useMatFormControl({value: ''});
  const emailErrors = matValidationErrors(emailControl.value, emailValidators);

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Full name</MatLabel>}
          control={
            <MatInput
              placeholder="Jane Doe"
              value={nameControl.value}
              required={matControlHasValidator(nameValidators, matRequiredValidator)}
              formBound
              touched={nameControl.touched}
              dirty={nameControl.dirty}
              invalid={nameErrors !== null}
              onInput$={(_, el) => nameControl.setValue$(el.value)}
              onBlur$={() => nameControl.markAsTouched$()}
            />
          }
          errors={nameErrors?.required ? <MatError>Name is required</MatError> : undefined}
        />
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Email</MatLabel>}
          control={
            <MatInput
              placeholder="pat@example.com"
              value={emailControl.value}
              required={matControlHasValidator(emailValidators, matRequiredValidator)}
              formBound
              touched={emailControl.touched}
              dirty={emailControl.dirty}
              invalid={emailErrors !== null}
              onInput$={(_, el) => emailControl.setValue$(el.value)}
              onBlur$={() => emailControl.markAsTouched$()}
            />
          }
          errors={[
            emailErrors?.required ? <MatError>Email is required</MatError> : undefined,
            emailErrors?.email ? <MatError>Enter a valid email</MatError> : undefined,
          ]}
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
