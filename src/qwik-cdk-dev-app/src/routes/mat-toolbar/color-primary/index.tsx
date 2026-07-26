import {component$} from '@builder.io/qwik';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <MatToolbar color="primary">Primary toolbar</MatToolbar>
    <main data-scenario-ready>ready</main>
  </>
));
