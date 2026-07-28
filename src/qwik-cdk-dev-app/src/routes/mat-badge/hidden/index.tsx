import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="5" hidden>
      <button>Inbox</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
