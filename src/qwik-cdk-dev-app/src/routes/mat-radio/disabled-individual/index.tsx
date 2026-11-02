import {component$, useSignal} from '@qwik.dev/core';
import {MatRadioGroup, MatRadioButton} from '@angular-community/qwik-material/radio';

export default component$(() => {
  const value = useSignal<string | undefined>(undefined);

  return (
    <>
      <div data-parity-root>
        <MatRadioGroup
          value={value.value}
          onChange$={(v: unknown) => {
            value.value = v as string | undefined;
          }}
          aria-label="One button disabled"
        >
          <MatRadioButton value="a">Option A</MatRadioButton>
          <MatRadioButton value="b" disabled>
            Option B
          </MatRadioButton>
          <MatRadioButton value="c">Option C</MatRadioButton>
        </MatRadioGroup>
        <p>Selected: {value.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
