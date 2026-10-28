import {component$, useSignal} from '@builder.io/qwik';
import {
  MatStepper,
  MatStepperNext,
  MatStepperPrevious,
  useRequiredControl,
} from '@angular-community/qwik-material/stepper';

export default component$(() => {
  const selected = useSignal(0);
  const nameCtrl = useRequiredControl();

  return (
    <>
      <div data-parity-root>
        <MatStepper
          linear
          style="width: 480px"
          selectedIndex={selected.value}
          onSelectedIndexChange$={i => {
            selected.value = i;
          }}
          steps={[
            {
              labelTemplate: 'Fill out your name',
              stepControl: nameCtrl.control.value,
              content: (
                <>
                  <input
                    placeholder="Name"
                    value={nameCtrl.value.value}
                    class={nameCtrl.ngClasses.value}
                    onInput$={nameCtrl.onInput$}
                    onBlur$={nameCtrl.onBlur$}
                  />
                  <div>
                    <MatStepperNext>Next</MatStepperNext>
                  </div>
                </>
              ),
            },
            {
              labelTemplate: 'Done',
              content: (
                <>
                  <p>You are now done.</p>
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
