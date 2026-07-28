import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="3" color="primary">
      <button>Primary</button>
    </MatBadge>
    <MatBadge content="7" color="accent">
      <button>Accent</button>
    </MatBadge>
    <MatBadge content="9" color="warn">
      <button>Warn</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
