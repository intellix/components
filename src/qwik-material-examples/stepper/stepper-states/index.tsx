import {$, component$, useContextProvider, useSignal, useStyles$} from '@qwik.dev/core';
import {CDK_STEPPER_GLOBAL_OPTIONS} from '@angular-community/qwik-cdk/stepper';
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
import {MatIcon} from '@angular-community/qwik-material/icon';
import {MatStepper} from '@angular-community/qwik-material/stepper';
import styles from './stepper-states-example.css?inline';
import {StepperNextButton, StepperPreviousButton} from './stepper-nav-buttons';

// Qwik port of material.angular.dev's `stepper-states` docs example — see
// src/components-examples/material/stepper/stepper-states/stepper-states-example.{ts,html}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/stepper-states.
//
// Two independent `<mat-stepper>`s, as upstream's single component renders both: a forms-based
// one (identical shape to `stepper-editable`'s, minus the editable toggle, plus a Reset button —
// `stepper.reset()` is simplified to `selected.value = 0`, same precedent already established by
// `stepper-vertical`/`stepper-editable`'s own Reset buttons, since this port has no exportAs/
// instance-method equivalent), and the `matStepperIcon`-overrides one this example exists to
// demonstrate (`stepperIcon={{phone: ..., chat: ...}}` — see `MatStepperProps.stepperIcon`'s doc
// comment). `STEPPER_GLOBAL_OPTIONS = {displayDefaultIndicatorType: false}` is provided once,
// component-wide (upstream's own `providers:`), affecting BOTH steppers' icon-state computation
// identically (ported, DOM-free, in qwik-cdk/stepper/step-logic.ts's `computeIndicatorType`) —
// e.g. the first stepper's initially-selected, non-completed step 1 shows an "edit" pencil icon
// rather than its number, a real, confirmed upstream behavior of this exact example, not specific
// to the icon-override demo below it.

export default component$(() => {
  useStyles$(styles);
  useContextProvider(CDK_STEPPER_GLOBAL_OPTIONS, {displayDefaultIndicatorType: false});

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

  const statesSelected = useSignal(0);

  return (
    <stepper-states-example>
      <MatStepper
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

      <MatStepper
        selectedIndex={statesSelected.value}
        onSelectedIndexChange$={$((i: number) => {
          statesSelected.value = i;
        })}
        stepperIcon={{
          phone: <MatIcon>call_end</MatIcon>,
          chat: <MatIcon>forum</MatIcon>,
        }}
        steps={[
          {
            label: 'Step 1',
            state: 'phone',
            content: (
              <>
                <p>Put down your phones.</p>
                <div>
                  <StepperNextButton>Next</StepperNextButton>
                </div>
              </>
            ),
          },
          {
            label: 'Step 2',
            state: 'chat',
            content: (
              <>
                <p>Socialize with each other.</p>
                <div>
                  <StepperPreviousButton>Back</StepperPreviousButton>
                  <StepperNextButton>Next</StepperNextButton>
                </div>
              </>
            ),
          },
          {
            label: 'Step 3',
            content: <p>You're welcome.</p>,
          },
        ]}
      />
    </stepper-states-example>
  );
});
