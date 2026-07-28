import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <MatBadge content="">
      <button>Empty</button>
    </MatBadge>
    <MatBadge content=" ">
      <button>Whitespace</button>
    </MatBadge>
    <MatBadge content={0}>
      <button>Zero</button>
    </MatBadge>
    <main data-scenario-ready>ready</main>
  </>
));
