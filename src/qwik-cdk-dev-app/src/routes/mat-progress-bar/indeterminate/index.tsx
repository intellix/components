import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar mode="indeterminate" />
    <main data-scenario-ready>ready</main>
  </>
));
