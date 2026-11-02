import {component$} from '@qwik.dev/core';
import Example from '@angular-community/qwik-material-examples/autocomplete/autocomplete-display';

export default component$(() => (
  <>
    <div data-parity-root>
      <Example />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
