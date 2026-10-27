import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatBadge as="button" content="3" color="primary">
        Primary
      </MatBadge>
      <MatBadge as="button" content="7" color="accent">
        Accent
      </MatBadge>
      <MatBadge as="button" content="9" color="warn">
        Warn
      </MatBadge>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
