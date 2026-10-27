import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <div data-parity-root>
      <p>Section 1</p>
      <MatDivider />
      <p>Section 2</p>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
