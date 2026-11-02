import {component$} from '@qwik.dev/core';
import Example from '@angular-community/qwik-material-examples/snack-bar/snack-bar-annotated-component';

export default component$(() => (
  <>
    <div data-parity-root>
      <Example />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
