import {component$} from '@builder.io/qwik';
import {MatNavList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatNavList>
        <MatListItem as="a" href="/inbox" title={<MatListItemTitle>Inbox</MatListItemTitle>} />
        <MatListItem
          as="a"
          href="/sent"
          activated
          title={<MatListItemTitle>Sent</MatListItemTitle>}
        />
        <MatListItem as="a" href="/drafts" title={<MatListItemTitle>Drafts</MatListItemTitle>} />
      </MatNavList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
