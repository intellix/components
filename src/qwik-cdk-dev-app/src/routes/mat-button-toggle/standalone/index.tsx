import {component$} from '@builder.io/qwik';
import {MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

export default component$(() => (
  <>
    <MatButtonToggle value="favorite" aria-label="Favorite">
      ★ Favorite
    </MatButtonToggle>
    <main data-scenario-ready>ready</main>
  </>
));
