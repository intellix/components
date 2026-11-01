import {component$} from '@qwik.dev/core';
import {MatToolbar, MatToolbarRow} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatToolbar multipleRows>
        <MatToolbarRow>First row</MatToolbarRow>
        <MatToolbarRow>Second row</MatToolbarRow>
      </MatToolbar>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
