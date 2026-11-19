import {component$} from '@qwik.dev/core';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatSubheader,
} from '@angular-community/qwik-material/list';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatList role="list">
        <MatSubheader>Inbox</MatSubheader>
        <MatListItem title>
          <MatListItemTitle q:slot="title">Message 1</MatListItemTitle>
        </MatListItem>
        <MatListItem title>
          <MatListItemTitle q:slot="title">Message 2</MatListItemTitle>
        </MatListItem>
        <MatDivider />
        <MatSubheader>Archive</MatSubheader>
        <MatListItem title>
          <MatListItemTitle q:slot="title">Archived 1</MatListItemTitle>
        </MatListItem>
        <MatListItem title>
          <MatListItemTitle q:slot="title">Archived 2</MatListItemTitle>
        </MatListItem>
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
