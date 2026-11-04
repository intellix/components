import {component$, useSignal} from '@qwik.dev/core';
import {
  MatStepper,
  useRequiredControl,
  useMatStepperProvider,
} from '@angular-community/qwik-material/stepper';

// Only overrides stepperGlobalOptions here — the `matIconConfig` set by the parent
// `mat-stepper/layout.tsx`'s `useMatIconProvider()` is still inherited: each provider hook
// provides ONLY its own context, so a nested call here doesn't reset anything the ancestor
// already provided (unlike the single all-in-one provider component this port used to have).
export default component$(() => {
  const selected = useSignal(0);
  const nameCtrl = useRequiredControl();

  useMatStepperProvider({showError: true});
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
    </>
  );
});
