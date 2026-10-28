import {component$, useSignal} from '@builder.io/qwik';
import {MatStepper, MatStepperPrevious} from '@angular-community/qwik-material/stepper';

export default component$(() => {
  const selected = useSignal(2);

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
              labelTemplate: 'Step one',
              content: <p>Content for step one.</p>,
            },
            {
              labelTemplate: 'Step two',
              content: <p>Content for step two.</p>,
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
            {
              labelTemplate: 'Step four',
              content: (
                <>
                  <p>Content for step four.</p>
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
