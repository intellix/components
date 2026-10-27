import {component$} from '@builder.io/qwik';
import {MatBadge} from '@angular-community/qwik-material/badge';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatBadge as="button" content="">
        Empty
      </MatBadge>
      <MatBadge as="button" content=" ">
        Whitespace
      </MatBadge>
      <MatBadge as="button" content={0}>
        Zero
      </MatBadge>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
