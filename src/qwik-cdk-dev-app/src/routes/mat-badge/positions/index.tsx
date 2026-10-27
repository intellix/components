import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatBadge content="1" position="above after">
        <button>Above-After</button>
      </MatBadge>
      <MatBadge content="2" position="above before">
        <button>Above-Before</button>
      </MatBadge>
      <MatBadge content="3" position="below after">
        <button>Below-After</button>
      </MatBadge>
      <MatBadge content="4" position="below before">
        <button>Below-Before</button>
      </MatBadge>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
