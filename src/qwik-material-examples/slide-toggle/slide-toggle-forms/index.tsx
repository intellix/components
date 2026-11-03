import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatForm} from '@angular-community/qwik-material/core';
import styles from './example.css?inline';

/**
 * Port of `src/components-examples/material/slide-toggle/slide-toggle-forms`
 * (slide-toggle-forms-example.html/.ts/.css) — material.angular.dev's "Slide-toggle with forms"
 * example: a standalone `[(ngModel)]` toggle, a template-driven `<form #form="ngForm">` with two
 * `ngModel`-bound toggles (one `required`), and a reactive `<form [formGroup]>` with the same
 * two fields via `formControlName`. This port has no Angular Forms, so every toggle is a plain
 * `{value, touched, dirty}` signal triple wired through `MatSlideToggle`'s `formBound`/
 * `touched`/`dirty`/`invalid`/`onTouched$` contract (see `qwik-material/slide-toggle/SYNC.md`'s
 * "Form state" section).
 *
 * Both `<form>` elements get `NgControlStatusGroup`'s own aggregate `ng-touched`/`ng-untouched`,
 * `ng-pristine`/`ng-dirty`, `ng-valid`/`ng-invalid` classes — Angular's REAL formula for these
 * (`FormGroup.touched`/`.dirty`/`.invalid` getters: true if ANY child control is touched/dirty/
 * invalid), computed here by hand from the two toggles' own state per form. `<MatForm>` (not a
 * bare `<form>`) is used for both so `ng-submitted` (and the real `preventDefault`) come for
 * free — see `core/mat-form.tsx`; its own `class` prop carries the aggregate classes computed
 * here, same shape the Formisch account example's own `<Form class={[...]}>` already
 * establishes for a form library that owns its own `<form>` (`MatFormSubmittedProvider`'s doc
 * comment).
 *
 * The template-driven form's SECOND toggle (`ngModel name="acceptTerms" required`) triggers a
 * real, confirmed-live Angular Forms quirk already documented in `src/dev-app/qwik-parity/
 * formisch.ts`'s own comment for `<mat-checkbox required formControlName>`: `RequiredValidator`
 * (`@angular/forms`, selector `:not([type=checkbox])[required][ngModel],...` — matches ANY
 * element, not just natives, and does NOT exclude a custom element merely because it isn't an
 * `<input>`) activates purely because BOTH `required` and `ngModel` are present as bare
 * attributes, and its own host binding reflects a literal `required=""` attribute onto whatever
 * host it's attached to — here, `<mat-slide-toggle>` itself. This port's `MatSlideToggle` has no
 * mechanism to add a bare `required` attribute to its OWN host (only `aria-required` on the
 * inner button) — a documented, scoped gap, see this example's own `ignoreAttrs` entry in
 * `specs/examples-forms/angular-parity.spec.ts`. The REACTIVE form's equivalent field has no
 * bare `required` attribute in its template (`Validators.requiredTrue` lives in the
 * `FormControl` definition instead), so it doesn't trigger this at all.
 *
 * `alertFormValues` calls the real `alert()`, matching upstream exactly (a real user clicking
 * "Save Settings" sees the same browser dialog) — the parity/functional specs never click either
 * submit button, so this never actually fires during automated testing.
 */
interface ToggleField {
  value: boolean;
  touched: boolean;
  dirty: boolean;
}

function useToggleField(initial = false) {
  return useSignal<ToggleField>({value: initial, touched: false, dirty: false});
}

export default component$(() => {
  useStyles$(styles);

  const isChecked = useToggleField(true);

  const enableWifi1 = useToggleField();
  const acceptTerms1 = useToggleField();
  const acceptTerms1Invalid = !acceptTerms1.value.value;
  const group1Touched = enableWifi1.value.touched || acceptTerms1.value.touched;
  const group1Dirty = enableWifi1.value.dirty || acceptTerms1.value.dirty;

  const enableWifi2 = useToggleField();
  const acceptTerms2 = useToggleField();
  const acceptTerms2Invalid = !acceptTerms2.value.value;
  const group2Touched = enableWifi2.value.touched || acceptTerms2.value.touched;
  const group2Dirty = enableWifi2.value.dirty || acceptTerms2.value.dirty;

  const alertFormValues = $((values: Record<string, unknown>) => {
    alert(JSON.stringify(values, null, 2));
  });

  return (
    <slide-toggle-forms-example>
      <p>Slide Toggle using a simple NgModel.</p>

      <MatSlideToggle
        checked={isChecked.value.value}
        formBound
        touched={isChecked.value.touched}
        dirty={isChecked.value.dirty}
        invalid={false}
        onChange$={next => {
          isChecked.value = {...isChecked.value, dirty: true, value: next};
        }}
        onTouched$={() => {
          isChecked.value = {...isChecked.value, touched: true};
        }}
      >
        Slide Toggle Checked: {String(isChecked.value.value)}
      </MatSlideToggle>

      <p>Slide Toggle inside of a Template-driven form</p>

      <MatForm
        noValidate
        class={[
          'example-form',
          group1Touched ? 'ng-touched' : 'ng-untouched',
          group1Dirty ? 'ng-dirty' : 'ng-pristine',
          acceptTerms1Invalid ? 'ng-invalid' : 'ng-valid',
        ]}
        onSubmit$={() =>
          alertFormValues({
            enableWifi: enableWifi1.value.value,
            acceptTerms: acceptTerms1.value.value,
          })
        }
      >
        <MatSlideToggle
          name="enableWifi"
          checked={enableWifi1.value.value}
          formBound
          touched={enableWifi1.value.touched}
          dirty={enableWifi1.value.dirty}
          invalid={false}
          onChange$={next => {
            enableWifi1.value = {...enableWifi1.value, dirty: true, value: next};
          }}
          onTouched$={() => {
            enableWifi1.value = {...enableWifi1.value, touched: true};
          }}
        >
          Enable Wifi
        </MatSlideToggle>
        <MatSlideToggle
          name="acceptTerms"
          required
          checked={acceptTerms1.value.value}
          formBound
          touched={acceptTerms1.value.touched}
          dirty={acceptTerms1.value.dirty}
          invalid={acceptTerms1Invalid}
          onChange$={next => {
            acceptTerms1.value = {...acceptTerms1.value, dirty: true, value: next};
          }}
          onTouched$={() => {
            acceptTerms1.value = {...acceptTerms1.value, touched: true};
          }}
        >
          Accept Terms of Service
        </MatSlideToggle>

        <MatButton appearance="elevated" type="submit">
          Save Settings
        </MatButton>
      </MatForm>

      <p>Slide Toggle inside of a Reactive form</p>

      <MatForm
        class={[
          'example-form',
          group2Touched ? 'ng-touched' : 'ng-untouched',
          group2Dirty ? 'ng-dirty' : 'ng-pristine',
          acceptTerms2Invalid ? 'ng-invalid' : 'ng-valid',
        ]}
        onSubmit$={() =>
          alertFormValues({
            enableWifi: enableWifi2.value.value,
            acceptTerms: acceptTerms2.value.value,
          })
        }
      >
        <MatSlideToggle
          checked={enableWifi2.value.value}
          formBound
          touched={enableWifi2.value.touched}
          dirty={enableWifi2.value.dirty}
          invalid={false}
          onChange$={next => {
            enableWifi2.value = {...enableWifi2.value, dirty: true, value: next};
          }}
          onTouched$={() => {
            enableWifi2.value = {...enableWifi2.value, touched: true};
          }}
        >
          Enable Wifi
        </MatSlideToggle>
        <MatSlideToggle
          checked={acceptTerms2.value.value}
          formBound
          touched={acceptTerms2.value.touched}
          dirty={acceptTerms2.value.dirty}
          invalid={acceptTerms2Invalid}
          onChange$={next => {
            acceptTerms2.value = {...acceptTerms2.value, dirty: true, value: next};
          }}
          onTouched$={() => {
            acceptTerms2.value = {...acceptTerms2.value, touched: true};
          }}
        >
          Accept Terms of Service
        </MatSlideToggle>

        <p>Form Group Status: {acceptTerms2Invalid ? 'INVALID' : 'VALID'}</p>

        <MatButton appearance="elevated" type="submit">
          Save Settings
        </MatButton>
      </MatForm>
    </slide-toggle-forms-example>
  );
});
