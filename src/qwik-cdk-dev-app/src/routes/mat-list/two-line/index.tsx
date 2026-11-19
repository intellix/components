import {component$} from '@qwik.dev/core';
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
        <MatListItem title lineCount={1}>
          <MatListItemTitle q:slot="title">Message from Alice</MatListItemTitle>
          <MatListItemLine q:slot="line">Preview text goes here</MatListItemLine>
        </MatListItem>
        <MatListItem title lineCount={1}>
          <MatListItemTitle q:slot="title">Message from Bob</MatListItemTitle>
          <MatListItemLine q:slot="line">Another preview line</MatListItemLine>
        </MatListItem>
        <MatListItem title lineCount={1}>
          <MatListItemTitle q:slot="title">Message from Carol</MatListItemTitle>
          <MatListItemLine q:slot="line">Yet another preview</MatListItemLine>
        </MatListItem>
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
