import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatButton href="/about">Text link</MatButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
