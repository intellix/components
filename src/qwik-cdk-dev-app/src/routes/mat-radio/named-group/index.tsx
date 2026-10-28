import {component$, useSignal} from '@builder.io/qwik';
import {MatRadioGroup, MatRadioButton} from '@angular-community/qwik-material/radio';

export default component$(() => {
  const value = useSignal<string | undefined>('a');

  return (
    <>
      <div data-parity-root>
        <form>
          <MatRadioGroup
            name="season"
            value={value.value}
            onChange$={(v: unknown) => {
              value.value = v as string | undefined;
            }}
            aria-label="Named group"
          >
            <MatRadioButton value="a">Option A</MatRadioButton>
            <MatRadioButton value="b">Option B</MatRadioButton>
          </MatRadioGroup>
        </form>
        <p>Selected: {value.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
