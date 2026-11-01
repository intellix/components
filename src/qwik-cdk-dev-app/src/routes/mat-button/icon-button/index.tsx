import {component$} from '@qwik.dev/core';
import {MatIconButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatIconButton ariaLabel="Menu">≡</MatIconButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
