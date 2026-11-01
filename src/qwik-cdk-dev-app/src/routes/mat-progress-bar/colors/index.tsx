import {component$} from '@qwik.dev/core';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatProgressBar color="primary" value={25} />
      <MatProgressBar color="accent" value={50} />
      <MatProgressBar color="warn" value={75} />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
