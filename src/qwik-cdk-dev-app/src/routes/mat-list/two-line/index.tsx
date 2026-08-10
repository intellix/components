import {component$} from '@builder.io/qwik';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatListItemLine,
} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <MatList role="list">
      <MatListItem>
        <MatListItemTitle>Message from Alice</MatListItemTitle>
        <MatListItemLine>Preview text goes here</MatListItemLine>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Message from Bob</MatListItemTitle>
        <MatListItemLine>Another preview line</MatListItemLine>
      </MatListItem>
      <MatListItem>
        <MatListItemTitle>Message from Carol</MatListItemTitle>
        <MatListItemLine>Yet another preview</MatListItemLine>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
