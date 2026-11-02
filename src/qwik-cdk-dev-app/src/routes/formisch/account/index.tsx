import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {Form, useForm$, useField, reset, setInput, validate} from '@formisch/qwik';
import {
  MatFormField,
  MatLabel,
  MatHint,
  MatError,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatSelect} from '@angular-community/qwik-material/select';
import {MatRadioGroup, MatRadioButton} from '@angular-community/qwik-material/radio';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';
import {MatButton} from '@angular-community/qwik-material/button';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  useMatDatepicker,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';
import {MatFormSubmittedProvider} from '@angular-community/qwik-material/core';
import {
  AccountSchema,
  ACCOUNT_INITIAL_INPUT,
  ACCOUNT_EXAMPLE_INPUT,
  COUNTRIES,
  CONTACT_PREFERENCES,
  type AccountOutput,
} from './account-schema';
import {
  matInputBindings,
  matSelectBindings,
  matRadioGroupBindings,
  matCheckboxBindings,
  matSlideToggleBindings,
  matDatepickerInputBindings,
  matDatepickerOnValueChange,
  matFieldErrors,
  matFieldState,
  matShouldShowError,
  ngStatusClasses,
  useSyncDatepickerField,
  isoToDate,
} from './formisch-bindings';
import styles from './account.css?inline';

/**
 * Formisch (`@formisch/qwik`) + qwik-material integration spike — see
 * `qwik-material/README.md`'s "Using with Formisch" section for the write-up this page
 * demonstrates. The actual form controls (everything inside `[data-parity-root]`) are mirrored,
 * attribute-for-attribute, by an Angular reactive-forms page at
 * `/qwik-parity/formisch/account` (`src/dev-app/qwik-parity/formisch.ts`) — see
 * `src/qwik-cdk-parity-tests/specs/formisch/angular-parity.spec.ts`. The live JSON panel and
 * the extra "Fill example data"/"Validate" buttons are THIS page's own demo chrome, outside
 * `[data-parity-root]` — not part of the parity contract.
 */
export default component$(() => {
  useStyles$(styles);

  const form = useForm$(() => ({
    schema: AccountSchema,
    initialInput: ACCOUNT_INITIAL_INPUT,
    // Matches Angular reactive forms' own always-on validity (a required-but-empty field is
    // `invalid` from the very first render on both sides) — see formisch-bindings.ts's module
    // doc comment "Validation timing" for the full rationale and the one difference that can't
    // be configured away (isTouched flips on focus, not just blur).
    validate: 'initial',
    revalidate: 'input',
  }));

  const nameField = useField(form, {path: ['name']});
  const emailField = useField(form, {path: ['email']});
  const bioField = useField(form, {path: ['bio']});
  const countryField = useField(form, {path: ['country']});
  const contactField = useField(form, {path: ['contactPreference']});
  const newsletterField = useField(form, {path: ['newsletter']});
  const termsField = useField(form, {path: ['terms']});
  const birthdayField = useField(form, {path: ['birthday']});

  // Instantiated at `D = Date`, then widened the same way every other `useMatDatepicker()`
  // consumer in this dev-app does (`component$` can't itself be generic per call site — see
  // `mat-datepicker/example`'s identical cast). `useSyncDatepickerField`/`matDatepickerInput
  // Bindings` both expect the narrowed `MatDatepickerHandle<Date>`, so the cast happens exactly
  // once, right here.
  const picker = useMatDatepicker<Date>({
    value: isoToDate(ACCOUNT_INITIAL_INPUT.birthday),
    onValueChange$: matDatepickerOnValueChange(birthdayField),
  }) as unknown as MatDatepickerHandle<unknown>;
  useSyncDatepickerField(birthdayField, picker as MatDatepickerHandle<Date>);

  const lastSubmitted = useSignal<AccountOutput | null>(null);

  return (
    <div class="formisch-demo">
      <h1 class="formisch-demo__title">Account settings</h1>
      <p class="formisch-demo__intro">
        A <a href="https://formisch.dev/qwik/">Formisch</a> form (<code>@formisch/qwik</code>) built
        entirely from qwik-material controls — see{' '}
        <code>src/routes/formisch/account/formisch-bindings.ts</code> for the wiring.
      </p>
      <div class="formisch-demo__layout">
        <div data-parity-root>
          <Form
            of={form}
            // `<Form>` forwards `class` onto the native `<form>` it renders — this is how
            // `ng-submitted` (and the other NgControlStatusGroup classes below) reach the real
            // element, since `<Form>`, not this page, owns it. See
            // `core/mat-form.tsx`'s `MatFormSubmittedProvider` doc comment.
            class={[
              form.isTouched.value ? 'ng-touched' : 'ng-untouched',
              form.isDirty.value ? 'ng-dirty' : 'ng-pristine',
              form.isValid.value ? 'ng-valid' : 'ng-invalid',
              form.isSubmitted.value && 'ng-submitted',
            ]}
            onSubmit$={$((output: AccountOutput) => {
              lastSubmitted.value = output;
            })}
          >
            <MatFormSubmittedProvider submitted={form.isSubmitted.value}>
              <div class="formisch-demo__field">
                <MatFormField
                  appearance="outline"
                  label={<MatLabel>Full name</MatLabel>}
                  style="width: 100%"
                  {...matFieldState(nameField)}
                  control={
                    <MatInput
                      required
                      value={(nameField.input.value as string | undefined) ?? ''}
                      {...matInputBindings(nameField)}
                    />
                  }
                  errors={matFieldErrors(nameField).map(message => (
                    <MatError key={message}>{message}</MatError>
                  ))}
                />
              </div>

              <div class="formisch-demo__field">
                <MatFormField
                  appearance="outline"
                  label={<MatLabel>Email</MatLabel>}
                  style="width: 100%"
                  {...matFieldState(emailField)}
                  control={
                    <MatInput
                      required
                      value={(emailField.input.value as string | undefined) ?? ''}
                      {...matInputBindings(emailField)}
                    />
                  }
                  errors={matFieldErrors(emailField).map(message => (
                    <MatError key={message}>{message}</MatError>
                  ))}
                />
              </div>

              <div class="formisch-demo__field">
                <MatFormField
                  appearance="outline"
                  label={<MatLabel>Bio</MatLabel>}
                  style="width: 100%"
                  hintStart={<MatHint>Optional — shown on your public profile</MatHint>}
                  {...matFieldState(bioField)}
                  control={
                    <MatInput
                      as="textarea"
                      rows={3}
                      value={(bioField.input.value as string | undefined) ?? ''}
                      {...matInputBindings(bioField)}
                    />
                  }
                />
              </div>

              <div class="formisch-demo__field">
                <MatFormField
                  appearance="outline"
                  label={<MatLabel>Country</MatLabel>}
                  style="width: 100%"
                  {...matFieldState(countryField)}
                  control={
                    <MatSelect
                      controlType="mat-select"
                      required
                      options={COUNTRIES}
                      value={(countryField.input.value as string | undefined) ?? ''}
                      {...matSelectBindings(countryField)}
                    />
                  }
                  errors={matFieldErrors(countryField).map(message => (
                    <MatError key={message}>{message}</MatError>
                  ))}
                />
              </div>

              <div class="formisch-demo__field">
                <span class="formisch-demo__group-label" id="contact-preference-label">
                  Contact preference
                </span>
                <MatRadioGroup
                  aria-labelledby="contact-preference-label"
                  class={ngStatusClasses(contactField)}
                  {...matRadioGroupBindings(contactField)}
                >
                  {CONTACT_PREFERENCES.map(option => (
                    <MatRadioButton key={option.value} value={option.value}>
                      {option.label}
                    </MatRadioButton>
                  ))}
                </MatRadioGroup>
                {matShouldShowError(contactField, form) && (
                  <div class="formisch-demo__error" role="alert">
                    {matFieldErrors(contactField)[0]}
                  </div>
                )}
              </div>

              <div class="formisch-demo__field">
                <MatSlideToggle
                  class={ngStatusClasses(newsletterField)}
                  {...matSlideToggleBindings(newsletterField)}
                >
                  Send me the monthly newsletter
                </MatSlideToggle>
              </div>

              <div class="formisch-demo__field">
                <MatCheckbox
                  required
                  class={ngStatusClasses(termsField)}
                  {...matCheckboxBindings(termsField)}
                >
                  I agree to the terms and conditions
                </MatCheckbox>
                {matShouldShowError(termsField, form) && (
                  <div class="formisch-demo__error" role="alert">
                    {matFieldErrors(termsField)[0]}
                  </div>
                )}
              </div>

              <div class="formisch-demo__field">
                <MatFormField
                  appearance="outline"
                  label={<MatLabel>Birthday</MatLabel>}
                  style="width: 100%"
                  {...matFieldState(birthdayField)}
                  control={
                    <MatDatepickerInput
                      picker={picker}
                      required
                      formBound
                      {...matDatepickerInputBindings(birthdayField)}
                    />
                  }
                  hintStart={<MatHint>MM/DD/YYYY</MatHint>}
                  iconSuffix={<MatDatepickerToggle picker={picker} />}
                  infixContent={<MatDatepicker picker={picker} />}
                  errors={matFieldErrors(birthdayField).map(message => (
                    <MatError key={message}>{message}</MatError>
                  ))}
                />
              </div>

              <div class="formisch-demo__actions">
                <MatButton appearance="filled" type="submit">
                  Submit
                </MatButton>
                <MatButton
                  appearance="outlined"
                  type="button"
                  onClick$={$(() => {
                    reset(form);
                    lastSubmitted.value = null;
                  })}
                >
                  Reset
                </MatButton>
              </div>
            </MatFormSubmittedProvider>
          </Form>
        </div>

        <aside class="formisch-demo__panel">
          <h2>Demo controls</h2>
          <div class="formisch-demo__panel-actions">
            <MatButton
              appearance="tonal"
              type="button"
              onClick$={$(() => setInput(form, {input: ACCOUNT_EXAMPLE_INPUT}))}
            >
              Fill example data
            </MatButton>
            <MatButton
              appearance="tonal"
              type="button"
              onClick$={$(() => validate(form, {shouldFocus: true}))}
            >
              Validate &amp; focus first error
            </MatButton>
          </div>

          <h2>Formisch form state</h2>
          <pre class="formisch-demo__json">
            {JSON.stringify(
              {
                input: {
                  name: nameField.input.value,
                  email: emailField.input.value,
                  bio: bioField.input.value,
                  country: countryField.input.value,
                  contactPreference: contactField.input.value,
                  newsletter: newsletterField.input.value,
                  terms: termsField.input.value,
                  birthday: birthdayField.input.value,
                },
                errors: {
                  name: nameField.errors.value,
                  email: emailField.errors.value,
                  bio: bioField.errors.value,
                  country: countryField.errors.value,
                  contactPreference: contactField.errors.value,
                  terms: termsField.errors.value,
                  birthday: birthdayField.errors.value,
                },
                form: {
                  isTouched: form.isTouched.value,
                  isDirty: form.isDirty.value,
                  isValid: form.isValid.value,
                  isSubmitting: form.isSubmitting.value,
                  isSubmitted: form.isSubmitted.value,
                },
              },
              null,
              2,
            )}
          </pre>

          <h2>Last valid submit output</h2>
          <pre class="formisch-demo__json">
            {lastSubmitted.value ? JSON.stringify(lastSubmitted.value, null, 2) : '(none yet)'}
          </pre>
        </aside>
      </div>
      {/* Parity-harness readiness marker — see `src/qwik-cdk-parity-tests/README.md` and every
          other `/qwik-parity`-compared route's identical sibling. */}
      <div data-scenario-ready style="display: none"></div>
    </div>
  );
});
