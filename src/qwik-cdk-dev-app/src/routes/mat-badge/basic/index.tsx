import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatBadge content="5">
        <button>Notifications</button>
      </MatBadge>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
