import {component$} from '@builder.io/qwik';
import {MatList, MatListItem} from '@angular-community/qwik-material/list';
import {MatDivider} from '@angular-community/qwik-material/divider';

// Port of src/components-examples/material/divider/divider-overview
// (divider-overview-example.html/.ts) — material.angular.dev's "Basic
// divider" example. No CSS file upstream.
export default component$(() => (
  <>
    <div data-parity-root>
      <divider-overview-example>
        <MatList>
          <MatListItem content="Item 1" />
          <MatDivider />
          <MatListItem content="Item 2" />
          <MatDivider />
          <MatListItem content="Item 3" />
        </MatList>
      </divider-overview-example>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
