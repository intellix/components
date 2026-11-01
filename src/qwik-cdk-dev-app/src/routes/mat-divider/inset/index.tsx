import {component$} from '@qwik.dev/core';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <div data-parity-root>
      <p>Section 1</p>
      <MatDivider inset />
      <p>Section 2</p>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
