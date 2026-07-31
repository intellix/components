import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <p>Comments</p>
    <MatDivider aria-label="End of comments" />
    <p>Suggested actions</p>
    <main data-scenario-ready>ready</main>
  </>
));
