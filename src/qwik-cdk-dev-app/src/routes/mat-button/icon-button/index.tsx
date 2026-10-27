import {component$} from '@builder.io/qwik';
import {MatIconButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatIconButton ariaLabel="Menu">≡</MatIconButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
