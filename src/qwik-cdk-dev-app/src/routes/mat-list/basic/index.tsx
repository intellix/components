import {component$} from '@qwik.dev/core';
import {MatList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatList role="list">
        <MatListItem title>
          <MatListItemTitle q:slot="title">Item 1</MatListItemTitle>
        </MatListItem>
        <MatListItem title>
          <MatListItemTitle q:slot="title">Item 2</MatListItemTitle>
        </MatListItem>
        <MatListItem title>
          <MatListItemTitle q:slot="title">Item 3</MatListItemTitle>
        </MatListItem>
        <MatListItem title>
          <MatListItemTitle q:slot="title">Item 4</MatListItemTitle>
        </MatListItem>
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
