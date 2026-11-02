import {component$, useSignal} from '@qwik.dev/core';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

export default component$(() => {
  const checked = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <form>
          <MatCheckbox
            required
            checked={checked.value}
            onChange$={event => {
              checked.value = event.checked;
            }}
          >
            I agree to the terms (required)
          </MatCheckbox>
        </form>
        <p>Checked: {String(checked.value)}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
