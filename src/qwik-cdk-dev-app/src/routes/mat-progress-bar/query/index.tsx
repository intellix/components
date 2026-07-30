import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar mode="query" />
    <main data-scenario-ready>ready</main>
  </>
));
