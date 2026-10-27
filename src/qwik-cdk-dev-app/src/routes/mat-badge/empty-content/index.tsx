import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatBadge content="">
        <button>Empty</button>
      </MatBadge>
      <MatBadge content=" ">
        <button>Whitespace</button>
      </MatBadge>
      <MatBadge content={0}>
        <button>Zero</button>
      </MatBadge>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
