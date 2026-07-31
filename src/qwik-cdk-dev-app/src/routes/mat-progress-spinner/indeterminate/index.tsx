import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <MatProgressSpinner mode="indeterminate" />
    <main data-scenario-ready>ready</main>
  </>
));
