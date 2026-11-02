import {component$, useSignal} from '@qwik.dev/core';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

export default component$(() => {
  const checkedPrimary = useSignal(true);

  return (
    <>
      <div data-parity-root>
        <MatCheckbox checked>Default</MatCheckbox>
        <MatCheckbox
          color="primary"
          checked={checkedPrimary.value}
          onChange$={event => {
            checkedPrimary.value = event.checked;
          }}
        >
          Primary
        </MatCheckbox>
        <MatCheckbox color="accent" checked>
          Accent
        </MatCheckbox>
        <MatCheckbox color="warn" checked>
          Warn
        </MatCheckbox>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
