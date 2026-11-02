import {component$, useSignal} from '@qwik.dev/core';
import {MatRadioGroup, MatRadioButton} from '@angular-community/qwik-material/radio';

export default component$(() => {
  const season = useSignal<string | undefined>(undefined);

  return (
    <>
      <div data-parity-root>
        <MatRadioGroup
          value={season.value}
          onChange$={(v: unknown) => {
            season.value = v as string | undefined;
          }}
          aria-label="Favorite season"
        >
          <MatRadioButton value="winter">Winter</MatRadioButton>
          <MatRadioButton value="spring">Spring</MatRadioButton>
          <MatRadioButton value="summer">Summer</MatRadioButton>
        </MatRadioGroup>
        <p>Selected: {season.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
