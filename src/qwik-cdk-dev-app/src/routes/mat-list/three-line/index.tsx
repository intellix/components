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
        <MatListItem title lineCount={2}>
          <MatListItemTitle q:slot="title">Message from Alice</MatListItemTitle>
          <MatListItemLine q:slot="line">Subject line here</MatListItemLine>
          <MatListItemLine q:slot="line">Preview text of the message body</MatListItemLine>
        </MatListItem>
        <MatListItem title lineCount={2}>
          <MatListItemTitle q:slot="title">Message from Bob</MatListItemTitle>
          <MatListItemLine q:slot="line">Different subject</MatListItemLine>
          <MatListItemLine q:slot="line">Different preview</MatListItemLine>
        </MatListItem>
        <MatListItem title lineCount={2}>
          <MatListItemTitle q:slot="title">Message from Carol</MatListItemTitle>
          <MatListItemLine q:slot="line">Third subject</MatListItemLine>
          <MatListItemLine q:slot="line">Third preview</MatListItemLine>
        </MatListItem>
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
