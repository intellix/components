import {component$, useSignal} from '@qwik.dev/core';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';

export default component$(() => {
  const checked = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatSlideToggle
          aria-label="Airplane mode"
          checked={checked.value}
          onChange$={next => (checked.value = next)}
        />
        <p>Checked: {checked.value ? 'true' : 'false'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
