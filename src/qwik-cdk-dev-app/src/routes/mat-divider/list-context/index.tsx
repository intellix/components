import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <div>Item A</div>
    <MatDivider />
    <div>Item B</div>
    <MatDivider />
    <div>Item C</div>
    <main data-scenario-ready>ready</main>
  </>
));
