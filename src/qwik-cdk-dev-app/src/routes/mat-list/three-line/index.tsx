import {component$} from '@builder.io/qwik';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatListItemLine,
} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatList role="list">
        <MatListItem>
          <MatListItemTitle>Message from Alice</MatListItemTitle>
          <MatListItemLine>Subject line here</MatListItemLine>
          <MatListItemLine>Preview text of the message body</MatListItemLine>
        </MatListItem>
        <MatListItem>
          <MatListItemTitle>Message from Bob</MatListItemTitle>
          <MatListItemLine>Different subject</MatListItemLine>
          <MatListItemLine>Different preview</MatListItemLine>
        </MatListItem>
        <MatListItem>
          <MatListItemTitle>Message from Carol</MatListItemTitle>
          <MatListItemLine>Third subject</MatListItemLine>
          <MatListItemLine>Third preview</MatListItemLine>
        </MatListItem>
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
