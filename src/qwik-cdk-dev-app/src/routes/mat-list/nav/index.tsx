import {component$} from '@qwik.dev/core';
import {MatNavList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatNavList>
        <MatListItem as="a" href="/inbox" title>
          <MatListItemTitle q:slot="title">Inbox</MatListItemTitle>
        </MatListItem>
        <MatListItem as="a" href="/sent" activated title>
          <MatListItemTitle q:slot="title">Sent</MatListItemTitle>
        </MatListItem>
        <MatListItem as="a" href="/drafts" title>
          <MatListItemTitle q:slot="title">Drafts</MatListItemTitle>
        </MatListItem>
      </MatNavList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
