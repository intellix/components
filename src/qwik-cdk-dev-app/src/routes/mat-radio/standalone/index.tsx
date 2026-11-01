import {component$, useSignal} from '@qwik.dev/core';
import {MatRadioButton} from '@angular-community/qwik-material/radio';

export default component$(() => {
  const selected = useSignal<string | undefined>('vanilla');

  return (
    <>
      <div data-parity-root>
        <MatRadioButton
          name="flavor"
          value="vanilla"
          checked
          onChange$={(v: unknown) => {
            selected.value = v as string | undefined;
          }}
        >
          Vanilla
        </MatRadioButton>
        <MatRadioButton
          name="flavor"
          value="chocolate"
          onChange$={(v: unknown) => {
            selected.value = v as string | undefined;
          }}
        >
          Chocolate
        </MatRadioButton>
        <p>Selected: {selected.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
