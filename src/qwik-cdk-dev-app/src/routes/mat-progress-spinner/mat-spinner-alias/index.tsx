import {component$} from '@builder.io/qwik';
import {MatSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatSpinner />
    <main data-scenario-ready>ready</main>
  </>
));
