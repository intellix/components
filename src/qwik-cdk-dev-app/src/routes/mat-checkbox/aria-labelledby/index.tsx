import {component$} from '@builder.io/qwik';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

export default component$(() => {
  return (
    <>
      <div data-parity-root>
        <label id="ext-label">External label text</label>
        <MatCheckbox aria-labelledby="ext-label" />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
