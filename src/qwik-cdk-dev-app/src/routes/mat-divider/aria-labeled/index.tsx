import {component$} from '@qwik.dev/core';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <div data-parity-root>
      <p>Comments</p>
      <MatDivider aria-label="End of comments" />
      <p>Suggested actions</p>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
