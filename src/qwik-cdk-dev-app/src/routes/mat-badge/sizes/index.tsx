import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatBadge as="button" content="1" size="small">
        Small
      </MatBadge>
      <MatBadge as="button" content="5" size="medium">
        Medium
      </MatBadge>
      <MatBadge as="button" content="99" size="large">
        Large
      </MatBadge>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
