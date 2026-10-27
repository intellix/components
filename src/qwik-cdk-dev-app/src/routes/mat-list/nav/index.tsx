import {component$} from '@builder.io/qwik';
import {MatNavList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatNavList>
        <MatListItem as="a" href="/inbox">
          <MatListItemTitle>Inbox</MatListItemTitle>
        </MatListItem>
        <MatListItem as="a" href="/sent" activated>
          <MatListItemTitle>Sent</MatListItemTitle>
        </MatListItem>
        <MatListItem as="a" href="/drafts">
          <MatListItemTitle>Drafts</MatListItemTitle>
        </MatListItem>
      </MatNavList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
