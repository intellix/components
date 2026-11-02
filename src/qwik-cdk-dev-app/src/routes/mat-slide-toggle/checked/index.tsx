import {component$, useSignal} from '@qwik.dev/core';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';

export default component$(() => {
  const checked = useSignal(true);

  return (
    <>
      <div data-parity-root>
        <MatSlideToggle checked={checked.value} onChange$={next => (checked.value = next)}>
          Enable notifications
        </MatSlideToggle>
        <p>Checked: {checked.value ? 'true' : 'false'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
