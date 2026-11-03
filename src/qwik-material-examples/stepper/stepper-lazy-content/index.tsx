import {component$} from '@qwik.dev/core';
import {MatStepper} from '@angular-community/qwik-material/stepper';
import {StepperNextButton, StepperPreviousButton} from './stepper-nav-buttons';

// Qwik port of material.angular.dev's `stepper-lazy-content` docs example. Rendered unmodified
// by the Angular dev-app at /qwik-parity/examples/stepper-lazy-content.
//
// Upstream contrasts steps 1-2 (lazy, via `<ng-template matStepContent>`) with step 3 (eager,
// plain content) — `MatStepDef.lazyContent` now reproduces this exactly (ported, see
// qwik-material/stepper/SYNC.md): steps 1-2 use `lazyContent` (rendered only once each step is
// first selected, then kept forever), step 3 uses the always-eager `content`.

export default component$(() => (
  <stepper-lazy-content-example>
    <MatStepper
      orientation="vertical"
      steps={[
        {
          label: 'Step 1',
          lazyContent: (
            <>
              <p>This content was rendered lazily</p>
              <StepperNextButton>Next</StepperNextButton>
            </>
          ),
        },
        {
          label: 'Step 2',
          lazyContent: (
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
