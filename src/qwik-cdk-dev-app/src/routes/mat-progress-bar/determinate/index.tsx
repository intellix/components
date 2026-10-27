import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatProgressBar mode="determinate" value={75} />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
