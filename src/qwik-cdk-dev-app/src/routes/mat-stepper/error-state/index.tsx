import {component$, useSignal} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatStepper, useRequiredControl} from '@angular-community/qwik-material/stepper';

export default component$(() => {
  const selected = useSignal(0);
  const nameCtrl = useRequiredControl();

  return (
    <QwikMaterialProvider
      stepperGlobalOptions={{showError: true}}
      matIconConfig={{fontSet: 'material-symbols-outlined'}}
    >
      <div data-parity-root>
        <MatStepper
          style="width: 480px"
          selectedIndex={selected.value}
          onSelectedIndexChange$={i => {
            selected.value = i;
          }}
          steps={[
            {
              labelTemplate: 'Fill out your name',
              stepControl: nameCtrl.control.value,
              errorMessage: 'Name is required.',
              content: (
                <input
                  placeholder="Name"
                  value={nameCtrl.value.value}
                  class={nameCtrl.ngClasses.value}
                  onInput$={nameCtrl.onInput$}
                  onBlur$={nameCtrl.onBlur$}
                />
              ),
            },
            {
              labelTemplate: 'Step two',
              content: <p>Content for step two.</p>,
            },
          ]}
        />
        <p>Selected index: {selected.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
