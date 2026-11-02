import {$, component$, useSignal} from '@qwik.dev/core';
import {MatForm} from '@angular-community/qwik-material/core';
import {
  MatFormField,
  MatLabel,
  matRequiredValidator,
  matValidationErrors,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatStepper} from '@angular-community/qwik-material/stepper';
import {StepperNextButton, StepperPreviousButton} from './stepper-nav-buttons';

// Qwik port of material.angular.dev's `stepper-editable` docs example — see
// src/components-examples/material/stepper/stepper-editable/stepper-editable-example.{ts,html}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/stepper-editable. Linear;
// the toggle button flips `editable` on BOTH the first and second steps (the third, "Done" step
// has no `[editable]` binding upstream either).

export default component$(() => {
  const selected = useSignal(0);
  const isEditable = useSignal(false);
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
    <stepper-editable-example>
      <MatButton
        appearance="elevated"
        onClick$={$(() => {
          isEditable.value = !isEditable.value;
        })}
      >
        {!isEditable.value ? 'Enable edit mode' : 'Disable edit mode'}
      </MatButton>

      <MatStepper
        linear
        selectedIndex={selected.value}
        onSelectedIndexChange$={$((i: number) => {
          selected.value = i;
        })}
        steps={[
          {
            labelTemplate: 'Fill out your name',
            editable: isEditable.value,
            stepControl: {valid: !firstInvalid, invalid: firstInvalid},
            content: (
              <MatForm noValidate class={firstFormClasses}>
                <MatFormField
                  label={<MatLabel>Name</MatLabel>}
                  control={
                    <MatInput
                      placeholder="Last name, First name"
                      required
                      formBound
                      value={firstCtrl.value}
                      touched={firstCtrl.touched}
                      dirty={firstCtrl.dirty}
                      invalid={firstInvalid}
                      onInput$={(_, el) => firstCtrl.setValue$(el.value)}
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
            editable: isEditable.value,
            stepControl: {valid: !secondInvalid, invalid: secondInvalid},
            content: (
              <MatForm noValidate class={secondFormClasses}>
                <MatFormField
                  label={<MatLabel>Address</MatLabel>}
                  control={
                    <MatInput
                      placeholder="Ex. 1 Main St, New York, NY"
                      required
                      formBound
                      value={secondCtrl.value}
                      touched={secondCtrl.touched}
                      dirty={secondCtrl.dirty}
                      invalid={secondInvalid}
                      onInput$={(_, el) => secondCtrl.setValue$(el.value)}
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
                <p>You are now done.</p>
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
    </stepper-editable-example>
  );
});
