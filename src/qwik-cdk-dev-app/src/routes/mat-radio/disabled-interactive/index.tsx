import {component$, useSignal} from '@builder.io/qwik';
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
          disabled
          disabledInteractive
          aria-label="Disabled interactive group"
        >
          <MatRadioButton value="a">Option A</MatRadioButton>
          <MatRadioButton value="b">Option B</MatRadioButton>
        </MatRadioGroup>
        <p>Selected: {value.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
