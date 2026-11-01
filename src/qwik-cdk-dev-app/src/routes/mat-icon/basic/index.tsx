import {component$} from '@qwik.dev/core';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatIcon>home</MatIcon>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
