import {component$, useSignal} from '@builder.io/qwik';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

export default component$(() => {
  const checked = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatCheckbox
          labelPosition="before"
          checked={checked.value}
          onChange$={event => {
            checked.value = event.checked;
          }}
        >
          Label before checkbox
        </MatCheckbox>
        <p>Checked: {String(checked.value)}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
