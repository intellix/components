import {component$} from '@qwik.dev/core';
import {MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatButtonToggle value="favorite" aria-label="Favorite">
        ★ Favorite
      </MatButtonToggle>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
