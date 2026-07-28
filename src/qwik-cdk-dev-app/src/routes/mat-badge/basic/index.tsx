import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="5">
      <button>Notifications</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
