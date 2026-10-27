import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatButton disabled disabledInteractive>
        Disabled interactive
      </MatButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
