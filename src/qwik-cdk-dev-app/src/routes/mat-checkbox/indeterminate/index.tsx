import {component$, useSignal} from '@builder.io/qwik';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

export default component$(() => {
  const checked = useSignal(false);
  const indeterminate = useSignal(true);

  return (
    <>
      <div data-parity-root>
        <MatCheckbox
          checked={checked.value}
          indeterminate={indeterminate.value}
          onChange$={event => {
            checked.value = event.checked;
            indeterminate.value = false;
          }}
        >
          Select all
        </MatCheckbox>
        <p>Checked: {String(checked.value)}</p>
        <p>Indeterminate: {String(indeterminate.value)}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
