import {$, component$, useSignal} from '@qwik.dev/core';
import {MatForm} from '@angular-community/qwik-material/core';
import {
  MatFormField,
  matRequiredValidator,
  matValidationErrors,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatStepper} from '@angular-community/qwik-material/stepper';
import {StepperNextButton, StepperPreviousButton} from './stepper-nav-buttons';

// Qwik port of material.angular.dev's `stepper-header-position` docs example — see
// src/components-examples/material/stepper/stepper-header-position/
// stepper-header-position-example.{ts,html}. Rendered unmodified by the Angular dev-app at
// /qwik-parity/examples/stepper-header-position. Same 3-step structure as the headline example,
// `headerPosition="bottom"`, second step `optional`, neither form field has a `<mat-label>`
// (upstream's own template omits it here, unlike the headline/label-position-bottom examples).

export default component$(() => {
  const selected = useSignal(0);
  const firstCtrl = useMatFormControl({value: ''});
  const firstErrors = matValidationErrors(firstCtrl.value, [matRequiredValidator]);
  const firstInvalid = firstErrors !== null;
  const firstFormClasses = [
    firstCtrl.touched ? 'ng-touched' : 'ng-untouched',
    firstCtrl.dirty ? 'ng-dirty' : 'ng-pristine',
    firstInvalid ? 'ng-invalid' : 'ng-valid',
  ];

  const secondCtrl = useMatFormControl({value: ''});
  const secondErrors = matValidationErrors(secondCtrl.value, [matRequiredValidator]);
  const secondInvalid = secondErrors !== null;
  const secondFormClasses = [
    secondCtrl.touched ? 'ng-touched' : 'ng-untouched',
    secondCtrl.dirty ? 'ng-dirty' : 'ng-pristine',
    secondInvalid ? 'ng-invalid' : 'ng-valid',
  ];

  return (
    <stepper-header-position-example>
      <MatStepper
        headerPosition="bottom"
        selectedIndex={selected.value}
        onSelectedIndexChange$={$((i: number) => {
          selected.value = i;
        })}
        steps={[
          {
            labelTemplate: 'Fill out your name',
            stepControl: {valid: !firstInvalid, invalid: firstInvalid},
            content: (
              <MatForm noValidate class={firstFormClasses}>
                <MatFormField
                  control={
                    <MatInput
                      placeholder="Last name, First name"
                      required
                      formBound
                      value={firstCtrl.value}
                      touched={firstCtrl.touched}
                      dirty={firstCtrl.dirty}
                      invalid={firstInvalid}
                      onInput$={$((_: Event, el: HTMLInputElement) => firstCtrl.setValue$(el.value))}
                      onBlur$={$(() => firstCtrl.markAsTouched$())}
                    />
                  }
                />
                <div>
                  <StepperNextButton>Next</StepperNextButton>
                </div>
              </MatForm>
            ),
          },
          {
            labelTemplate: 'Fill out your address',
            optional: true,
            stepControl: {valid: !secondInvalid, invalid: secondInvalid},
            content: (
              <MatForm noValidate class={secondFormClasses}>
                <MatFormField
                  control={
                    <MatInput
                      placeholder="Address"
                      required
                      formBound
                      value={secondCtrl.value}
                      touched={secondCtrl.touched}
                      dirty={secondCtrl.dirty}
                      invalid={secondInvalid}
                      onInput$={$((_: Event, el: HTMLInputElement) => secondCtrl.setValue$(el.value))}
                      onBlur$={$(() => secondCtrl.markAsTouched$())}
                    />
                  }
                />
                <div>
                  <StepperPreviousButton>Back</StepperPreviousButton>
                  <StepperNextButton>Next</StepperNextButton>
                </div>
              </MatForm>
            ),
          },
          {
            labelTemplate: 'Done',
            content: (
              <>
                You are now done.
                <div>
                  <StepperPreviousButton>Back</StepperPreviousButton>
                  <MatButton
                    onClick$={$(() => {
                      selected.value = 0;
                    })}
                  >
                    Reset
                  </MatButton>
                </div>
              </>
            ),
          },
        ]}
      />
    </stepper-header-position-example>
  );
});
