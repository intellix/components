import {component$} from '@qwik.dev/core';
import {MatActionList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatActionList>
        <MatListItem as="button" title>
          <MatListItemTitle q:slot="title">Save</MatListItemTitle>
        </MatListItem>
        <MatListItem as="button" title>
          <MatListItemTitle q:slot="title">Duplicate</MatListItemTitle>
        </MatListItem>
        <MatListItem as="button" disabled title>
          <MatListItemTitle q:slot="title">Delete</MatListItemTitle>
        </MatListItem>
      </MatActionList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
