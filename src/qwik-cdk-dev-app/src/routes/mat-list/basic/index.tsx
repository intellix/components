import {component$} from '@builder.io/qwik';
import {MatList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatList role="list">
        <MatListItem title={<MatListItemTitle>Item 1</MatListItemTitle>} />
        <MatListItem title={<MatListItemTitle>Item 2</MatListItemTitle>} />
        <MatListItem title={<MatListItemTitle>Item 3</MatListItemTitle>} />
        <MatListItem title={<MatListItemTitle>Item 4</MatListItemTitle>} />
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
