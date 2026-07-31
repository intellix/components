import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <p>Section 1</p>
    <MatDivider />
    <p>Section 2</p>
    <main data-scenario-ready>ready</main>
  </>
));
