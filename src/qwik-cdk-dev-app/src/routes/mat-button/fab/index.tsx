import {component$} from '@builder.io/qwik';
import {MatFabButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFabButton ariaLabel="Add">+</MatFabButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
