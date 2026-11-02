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
        <MatListItem title={<MatListItemTitle>Message 1</MatListItemTitle>} />
        <MatListItem title={<MatListItemTitle>Message 2</MatListItemTitle>} />
        <MatDivider />
        <MatSubheader>Archive</MatSubheader>
        <MatListItem title={<MatListItemTitle>Archived 1</MatListItemTitle>} />
        <MatListItem title={<MatListItemTitle>Archived 2</MatListItemTitle>} />
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
