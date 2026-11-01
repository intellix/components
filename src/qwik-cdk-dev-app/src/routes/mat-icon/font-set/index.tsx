import {component$} from '@qwik.dev/core';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatIcon fontSet="material-symbols-outlined" fontIcon="home" />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
