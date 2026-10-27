import {component$} from '@builder.io/qwik';
import {MatFabButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFabButton extended>+ New</MatFabButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
