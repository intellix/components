import {component$} from '@qwik.dev/core';
import {MatList, MatListItem} from '@angular-community/qwik-material/list';

// Port of src/components-examples/material/list/list-overview
// (list-overview-example.html/.ts) — material.angular.dev's "Basic list"
// example. No CSS file upstream. `content` (not `title`) matches upstream's
// plain unscoped-text list items (no matListItemTitle directive in the
// template) — see mat-list-item.tsx's `content` prop doc.
export default component$(() => (
  <>
    <div data-parity-root>
      <list-overview-example>
        <MatList role="list">
          <MatListItem role="listitem" content="Item 1" />
          <MatListItem role="listitem" content="Item 2" />
          <MatListItem role="listitem" content="Item 3" />
        </MatList>
      </list-overview-example>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
