import {component$} from '@qwik.dev/core';
import {MatProgressSpinner} from '@angular-community/qwik-material/progress-spinner';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatProgressSpinner mode="indeterminate" />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
