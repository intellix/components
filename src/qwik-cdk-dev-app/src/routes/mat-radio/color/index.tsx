import {component$, useSignal} from '@builder.io/qwik';
import {MatRadioGroup, MatRadioButton} from '@angular-community/qwik-material/radio';

export default component$(() => {
  const color = useSignal<string | undefined>(undefined);

  return (
    <>
      <div data-parity-root>
        <MatRadioGroup
          value={color.value}
          onChange$={(v: unknown) => {
            color.value = v as string | undefined;
          }}
          color="primary"
          aria-label="Color variants"
        >
          <MatRadioButton value="a">Default (group primary)</MatRadioButton>
          <MatRadioButton value="b" color="warn">
            Warn override
          </MatRadioButton>
          <MatRadioButton value="c" color="accent">
            Accent override
          </MatRadioButton>
        </MatRadioGroup>
        <p>Selected: {color.value ?? '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
