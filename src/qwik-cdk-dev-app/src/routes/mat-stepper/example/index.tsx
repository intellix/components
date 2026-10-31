import {$, component$, useSignal} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatForm} from '@angular-community/qwik-material/core';
import {
  MatFormField,
  MatLabel,
  matRequiredValidator,
  matValidationErrors,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatStepper} from '@angular-community/qwik-material/stepper';
import {StepperNextButton, StepperPreviousButton} from './stepper-nav-buttons';
import './stepper-overview-example.css';

// Qwik port of material.angular.dev's `stepper-overview` docs example — see
// src/components-examples/material/stepper/stepper-overview/stepper-overview-example.{ts,html,css}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/mat-stepper/example
// (src/dev-app/qwik-parity/examples.ts). Host tag mirrors the example's own component selector
// (`stepper-overview-example`). The Next/Back buttons are `<button matButton matStepperNext>` /
// `matStepperPrevious>` upstream — two directives stacked on one element — reproduced here via
// `useMatStepperNext()`/`useMatStepperPrevious()` spread onto `<MatButton>`
// (`./stepper-nav-buttons.tsx`), the "directive hooks" pattern
// (`qwik-material/README.md`'s "Composing directives") that replaced the old `matButton`
// composition prop `<MatStepperNext>`/`<MatStepperPrevious>` used to carry.
export default component$(() => {
  const isLinear = useSignal(false);
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
    <>
      <div data-parity-root>
        <stepper-overview-example>
          <MatButton
            appearance="elevated"
            id="toggle-linear"
            onClick$={$(() => {
              isLinear.value = !isLinear.value;
            })}
          >
            {!isLinear.value ? 'Enable linear mode' : 'Disable linear mode'}
          </MatButton>
          <MatStepper
            linear={isLinear.value}
            selectedIndex={selected.value}
            onSelectedIndexChange$={i => {
              selected.value = i;
            }}
            steps={[
              {
                labelTemplate: 'Fill out your name',
                stepControl: {valid: !firstInvalid, invalid: firstInvalid},
                content: (
                  <MatForm noValidate class={firstFormClasses}>
                    <MatFormField
                      touched={firstCtrl.touched}
                      dirty={firstCtrl.dirty}
                      invalid={firstInvalid}
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
                          onBlur$={() => firstCtrl.markAsTouched$()}
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
                label: 'Fill out your address',
                stepControl: {valid: !secondInvalid, invalid: secondInvalid},
                content: (
                  <MatForm noValidate class={secondFormClasses}>
                    <MatFormField
                      touched={secondCtrl.touched}
                      dirty={secondCtrl.dirty}
                      invalid={secondInvalid}
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
                          onBlur$={() => secondCtrl.markAsTouched$()}
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
        </stepper-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
