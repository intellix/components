import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner value={50} diameter={40} strokeWidth={3} />
    <main data-scenario-ready>ready</main>
  </>
));
