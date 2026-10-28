import {component$, useSignal} from '@builder.io/qwik';
import {
  MatStepper,
  MatStepperNext,
  MatStepperPrevious,
} from '@angular-community/qwik-material/stepper';

export default component$(() => {
  const selected = useSignal(0);

  return (
    <>
      <div data-parity-root>
        <MatStepper
          style="width: 480px"
          selectedIndex={selected.value}
          onSelectedIndexChange$={i => {
            selected.value = i;
          }}
          steps={[
            {
              // Plain string input ([label]="'Step one'") — no <ng-template>.
              label: 'Step one',
              content: (
                <>
                  <p>Content for step one.</p>
                  <div>
                    <MatStepperNext>Next</MatStepperNext>
                  </div>
                </>
              ),
            },
            {
              // <ng-template matStepLabel><strong>Step two</strong> (custom)</ng-template>.
              labelTemplate: (
                <>
                  <strong>Step two</strong> (custom)
                </>
              ),
              content: (
                <>
                  <p>Content for step two.</p>
                  <div>
                    <MatStepperPrevious>Back</MatStepperPrevious>
                  </div>
                </>
              ),
            },
          ]}
        />
        <p>Selected index: {selected.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
