import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatIcon inline>home</MatIcon>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
