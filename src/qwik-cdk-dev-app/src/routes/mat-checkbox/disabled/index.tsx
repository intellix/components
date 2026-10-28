import {component$} from '@builder.io/qwik';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

export default component$(() => {
  return (
    <>
      <div data-parity-root>
        <div>
          <MatCheckbox disabled>Disabled unchecked</MatCheckbox>
        </div>
        <div>
          <MatCheckbox disabled checked>
            Disabled checked
          </MatCheckbox>
        </div>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
