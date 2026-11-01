import {component$} from '@qwik.dev/core';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatIcon fontIcon="home" />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
