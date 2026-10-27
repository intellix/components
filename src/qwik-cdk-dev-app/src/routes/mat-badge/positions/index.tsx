import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatBadge as="button" content="1" position="above after">
        Above-After
      </MatBadge>
      <MatBadge as="button" content="2" position="above before">
        Above-Before
      </MatBadge>
      <MatBadge as="button" content="3" position="below after">
        Below-After
      </MatBadge>
      <MatBadge as="button" content="4" position="below before">
        Below-Before
      </MatBadge>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
