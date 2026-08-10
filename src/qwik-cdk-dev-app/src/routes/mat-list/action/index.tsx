import {component$} from '@builder.io/qwik';
import {MatActionList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatActionList>
      <MatListItem as="button">
        <MatListItemTitle>Save</MatListItemTitle>
      </MatListItem>
      <MatListItem as="button">
        <MatListItemTitle>Duplicate</MatListItemTitle>
      </MatListItem>
      <MatListItem as="button" disabled>
        <MatListItemTitle>Delete</MatListItemTitle>
      </MatListItem>
    </MatActionList>
    <main data-scenario-ready>ready</main>
  </>
));
