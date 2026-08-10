import {component$} from '@builder.io/qwik';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatSubheader,
} from '@angular-community/qwik-material/list';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <MatList role="list">
      <MatSubheader>Inbox</MatSubheader>
      <MatListItem>
        <MatListItemTitle>Message 1</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Message 2</MatListItemTitle>
      </MatListItem>
      <MatDivider />
      <MatSubheader>Archive</MatSubheader>
      <MatListItem>
        <MatListItemTitle>Archived 1</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Archived 2</MatListItemTitle>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
