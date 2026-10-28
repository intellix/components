import {component$, useSignal} from '@builder.io/qwik';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';

export default component$(() => {
  const checked = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <form>
          <MatSlideToggle
            required
            name="terms"
            checked={checked.value}
            onChange$={next => (checked.value = next)}
          >
            Accept terms
          </MatSlideToggle>
        </form>
        <p>Checked: {checked.value ? 'true' : 'false'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
