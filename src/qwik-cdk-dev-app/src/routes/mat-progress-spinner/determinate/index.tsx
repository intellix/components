import {component$} from '@builder.io/qwik';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatProgressSpinner mode="determinate" value={75} />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
