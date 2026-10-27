import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatBadge content="1" size="small">
        <button>Small</button>
      </MatBadge>
      <MatBadge content="5" size="medium">
        <button>Medium</button>
      </MatBadge>
      <MatBadge content="99" size="large">
        <button>Large</button>
      </MatBadge>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
