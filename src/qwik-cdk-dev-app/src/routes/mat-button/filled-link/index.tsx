import {component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatButton appearance="filled" href="/about">
        Filled link
      </MatButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
