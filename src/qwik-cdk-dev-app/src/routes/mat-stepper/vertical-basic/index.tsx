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
          orientation="vertical"
          style="width: 480px"
          selectedIndex={selected.value}
          onSelectedIndexChange$={i => {
            selected.value = i;
          }}
          steps={[
            {
              labelTemplate: 'Step one',
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
              labelTemplate: 'Step two',
              content: (
                <>
                  <p>Content for step two.</p>
                  <div>
                    <MatStepperPrevious>Back</MatStepperPrevious>
                    <MatStepperNext>Next</MatStepperNext>
                  </div>
                </>
              ),
            },
            {
              labelTemplate: 'Step three',
              content: (
                <>
                  <p>Content for step three.</p>
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
