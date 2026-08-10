import {component$} from '@builder.io/qwik';
import {MatList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatList role="list">
      <MatListItem>
        <MatListItemTitle>Item 1</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Item 2</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Item 3</MatListItemTitle>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Item 4</MatListItemTitle>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
