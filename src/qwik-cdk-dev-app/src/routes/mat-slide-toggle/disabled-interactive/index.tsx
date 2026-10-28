import {component$, useSignal} from '@builder.io/qwik';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';

export default component$(() => {
  const checked = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatSlideToggle
          disabled
          disabledInteractive
          checked={checked.value}
          onChange$={next => (checked.value = next)}
        >
          Disabled interactive toggle
        </MatSlideToggle>
        <p>Checked: {checked.value ? 'true' : 'false'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
