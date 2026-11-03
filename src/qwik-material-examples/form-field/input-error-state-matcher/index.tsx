import {$, component$, useStyles$} from '@qwik.dev/core';
import {
  MatError,
  MatFormField,
  MatHint,
  MatLabel,
  matEmailValidator,
  matRequiredValidator,
  matValidationErrors,
  useMatFormControl,
  type MatErrorStateSnapshot,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import styles from './input-error-state-matcher-example.css?inline';

/**
 * Port of material.angular.dev's `input-error-state-matcher` docs example
 * (src/components-examples/material/input/input-error-state-matcher/) — upstream's
 * `MyErrorStateMatcher`:
 *
 * ```ts
 * class MyErrorStateMatcher implements ErrorStateMatcher {
 *   isErrorState(control, form) {
 *     const isSubmitted = form && form.submitted;
 *     return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
 *   }
 * }
 * ```
 *
 * ported as a `QRL<(state: MatErrorStateSnapshot) => boolean>` — see
 * `core/error-state-matcher.ts`'s own doc comment for why a plain class instance can't cross
 * this port's component boundaries the way it does upstream, and for the full design this
 * example is the first real consumer of. Passed as `<MatInput errorStateMatcher={matcher}>` —
 * mirrors upstream's per-control `[errorStateMatcher]="matcher"` exactly (there is no app-wide
 * `<QwikMaterialProvider errorStateMatcher={...}>` in this example, same as upstream's own
 * `providers: []`).
 *
 * The whole POINT of this matcher — shows the error the moment the field becomes
 * `dirty` (a single keystroke), without waiting for `touched` (blur) the way the DEFAULT
 * `ErrorStateMatcher` upstream's OTHER examples (`form-field-error`) rely on does — is exercised
 * by `specs/examples-forms/error-state-matcher.spec.ts` (Qwik-only functional spec; the Angular-
 * parity comparison in `specs/examples-forms/angular-parity.spec.ts` only exercises the
 * default, no-interaction render, matching `form-field-error`'s own established precedent — see
 * that id's own `EXAMPLE_STEPS` comment for why an interactive step was dropped there).
 */
const myErrorStateMatcher = $(
  (state: MatErrorStateSnapshot) => state.invalid && (state.dirty || state.touched || state.submitted),
);

export default component$(() => {
  useStyles$(styles);
  const email = useMatFormControl({value: ''});
  const errors = matValidationErrors(email.value, [matRequiredValidator, matEmailValidator]);
  const errorMessage = errors?.required
    ? 'Email is required'
    : errors?.email
      ? 'Please enter a valid email address'
      : '';

  return (
    <input-error-state-matcher-example>
      {/* Upstream imports `FormsModule`, which attaches an IMPLICIT `NgForm` to every bare
          `<form>` tag with no `[formGroup]`/`ngNoForm` (confirmed live, a well-known Angular
          Forms gotcha, not specific to this example) — its `NgControlStatusGroup` always shows
          `ng-pristine ng-untouched ng-valid` here (this FORM-level `NgForm` has nothing
          registered to it — `emailFormControl` is bound via standalone `[formControl]`, never
          `[ngModel]` — so its aggregate status never actually changes), and `NgForm`'s own host
          binding always adds `novalidate`. Both are therefore literal, static markup here rather
          than derived from `email`'s own state. */}
      <form class="example-form ng-pristine ng-untouched ng-valid" noValidate>
        <MatFormField
          class="example-full-width"
          label={<MatLabel>Email</MatLabel>}
          touched={email.touched}
          dirty={email.dirty}
          invalid={errors !== null}
          control={
            <MatInput
              type="email"
              placeholder="Ex. pat@example.com"
              // Mirrors upstream's `MatInput.required` GETTER, not a literal template
              // attribute: upstream's template never writes `required` either, but
              // `ngControl.control.hasValidator(Validators.required)` reports `true` (the
              // FormControl's own `Validators.required`), which upstream's getter folds in —
              // confirmed live, the real Angular DOM has `required`/`aria-required="true"`
              // despite no `required` attribute in the source template.
              required
              formBound
              value={email.value}
              touched={email.touched}
              dirty={email.dirty}
              invalid={errors !== null}
              errorStateMatcher={myErrorStateMatcher}
              onInput$={(_, el) => email.setValue$(el.value)}
              onBlur$={() => email.markAsTouched$()}
            />
          }
          hintStart={<MatHint>Errors appear instantly!</MatHint>}
          errors={errors !== null ? <MatError>{errorMessage}</MatError> : undefined}
        />
      </form>
    </input-error-state-matcher-example>
  );
});
