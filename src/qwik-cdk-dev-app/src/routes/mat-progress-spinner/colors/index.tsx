import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner color="primary" value={25} />
    <MatProgressSpinner color="accent" value={50} />
    <MatProgressSpinner color="warn" value={75} />
    <main data-scenario-ready>ready</main>
  </>
));
