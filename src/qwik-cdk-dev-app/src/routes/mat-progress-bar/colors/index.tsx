import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar color="primary" value={25} />
    <MatProgressBar color="accent" value={50} />
    <MatProgressBar color="warn" value={75} />
    <main data-scenario-ready>ready</main>
  </>
));
