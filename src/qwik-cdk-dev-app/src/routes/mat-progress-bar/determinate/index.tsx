import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar mode="determinate" value={75} />
    <main data-scenario-ready>ready</main>
  </>
));
