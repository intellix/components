import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatBadge as="button" content="5" description="3 unread messages">
        Messages
      </MatBadge>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
