import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatProgressBar value={25} aria-label="Uploading" />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
