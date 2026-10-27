import {component$} from '@builder.io/qwik';
import {MatActionList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatActionList>
        <MatListItem as="button" title={<MatListItemTitle>Save</MatListItemTitle>} />
        <MatListItem as="button" title={<MatListItemTitle>Duplicate</MatListItemTitle>} />
        <MatListItem as="button" disabled title={<MatListItemTitle>Delete</MatListItemTitle>} />
      </MatActionList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
