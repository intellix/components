import {component$} from '@builder.io/qwik';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <MatToolbar>My Application</MatToolbar>
    <main data-scenario-ready>ready</main>
  </>
));
