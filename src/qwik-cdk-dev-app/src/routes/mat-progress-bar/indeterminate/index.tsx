import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatProgressBar mode="indeterminate" />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
