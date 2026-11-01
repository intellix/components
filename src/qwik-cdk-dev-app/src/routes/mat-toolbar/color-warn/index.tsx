import {component$} from '@qwik.dev/core';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatToolbar color="warn">Warn toolbar</MatToolbar>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
