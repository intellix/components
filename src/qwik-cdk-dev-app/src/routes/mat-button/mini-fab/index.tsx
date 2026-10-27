import {component$} from '@builder.io/qwik';
import {MatMiniFabButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatMiniFabButton ariaLabel="Add">+</MatMiniFabButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
