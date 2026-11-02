import {component$} from '@qwik.dev/core';
import {MatStepper} from '@angular-community/qwik-material/stepper';
import {StepperNextButton, StepperPreviousButton} from './stepper-nav-buttons';

// Qwik port of material.angular.dev's `stepper-lazy-content` docs example. Rendered unmodified
// by the Angular dev-app at /qwik-parity/examples/stepper-lazy-content.
//
// Upstream contrasts steps 1-2 (lazy, via `<ng-template matStepContent>`) with step 3 (eager,
// plain content) -- but this port's `MatStepDef.content` is NEVER detached once rendered
// regardless (qwik-material/stepper/SYNC.md: "step content is never detached regardless"), so
// there's no structural "lazy vs eager" distinction to reproduce here; all three steps render
// identically either way. The DOM/behavior is faithfully reproduced; only the upstream-internal
// initialization-timing nuance the example's prose describes has no equivalent to demonstrate.

export default component$(() => (
  <stepper-lazy-content-example>
    <MatStepper
      orientation="vertical"
      steps={[
        {
          label: 'Step 1',
          content: (
            <>
              <p>This content was rendered lazily</p>
              <StepperNextButton>Next</StepperNextButton>
            </>
          ),
        },
        {
          label: 'Step 2',
          content: (
            <>
              <p>This content was also rendered lazily</p>
              <StepperPreviousButton>Back</StepperPreviousButton>
              <StepperNextButton>Next</StepperNextButton>
            </>
          ),
        },
        {
          label: 'Step 3',
          content: (
            <>
              <p>This content was rendered eagerly</p>
              <StepperPreviousButton>Back</StepperPreviousButton>
            </>
          ),
        },
      ]}
    />
  </stepper-lazy-content-example>
));
