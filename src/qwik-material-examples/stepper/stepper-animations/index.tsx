import {$, component$, useSignal} from '@qwik.dev/core';
import {MatForm} from '@angular-community/qwik-material/core';
import {
  MatFormField,
  matValidationErrors,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatStepper} from '@angular-community/qwik-material/stepper';
import {StepperNextButton, StepperPreviousButton} from './stepper-nav-buttons';
import './stepper-animations-example.css';

// Qwik port of material.angular.dev's `stepper-animations` docs example — see
// src/components-examples/material/stepper/stepper-animations/stepper-animations-example.
// {ts,html,css}. Rendered unmodified by the Angular dev-app at
// /qwik-parity/examples/stepper-animations. Vertical, non-linear, `animationDuration` driven by
// a plain number input (not a form control — upstream reads it via a template ref's own `.value`,
// same "uncontrolled, read via local state" pattern as `sidenav-backdrop`'s selects). Neither
// step's `MatFormField` has validators upstream here (`firstCtrl: ['']`, no `Validators.required`).

export default component$(() => {
  const selected = useSignal(0);
  const duration = useSignal('2000');
  const firstCtrl = useMatFormControl({value: ''});
  const secondCtrl = useMatFormControl({value: ''});
  void matValidationErrors;

  return (
    <stepper-animations-example>
      <div class="example-input-wrapper">
        <label for="duration">Animation duration:</label>
        <input
          id="duration"
          type="number"
          min={0}
          step={100}
          value={duration.value}
          onInput$={$((_: Event, el: HTMLInputElement) => {
            duration.value = el.value;
          })}
        />
      </div>

      <MatStepper
        orientation="vertical"
        linear={false}
        animationDuration={duration.value}
        selectedIndex={selected.value}
        onSelectedIndexChange$={$((i: number) => {
          selected.value = i;
        })}
        steps={[
          {
            labelTemplate: 'Fill out your name',
            content: (
              <MatForm noValidate>
                <MatFormField
                  control={
                    <MatInput
                      placeholder="Last name, First name"
                      required
                      formBound
                      value={firstCtrl.value}
                      touched={firstCtrl.touched}
                      dirty={firstCtrl.dirty}
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
            content: (
              <MatForm noValidate>
                <MatFormField
                  control={
                    <MatInput
                      placeholder="Address"
                      required
                      formBound
                      value={secondCtrl.value}
                      touched={secondCtrl.touched}
                      dirty={secondCtrl.dirty}
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
    </stepper-animations-example>
  );
});
