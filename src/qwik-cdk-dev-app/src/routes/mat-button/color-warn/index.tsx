import {component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatButton color="warn" appearance="filled">
        Warn
      </MatButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
