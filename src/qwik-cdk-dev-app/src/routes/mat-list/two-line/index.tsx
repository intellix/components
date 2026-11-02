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
        <MatListItem
          title={<MatListItemTitle>Message from Alice</MatListItemTitle>}
          lineContent={<MatListItemLine>Preview text goes here</MatListItemLine>}
        />
        <MatListItem
          title={<MatListItemTitle>Message from Bob</MatListItemTitle>}
          lineContent={<MatListItemLine>Another preview line</MatListItemLine>}
        />
        <MatListItem
          title={<MatListItemTitle>Message from Carol</MatListItemTitle>}
          lineContent={<MatListItemLine>Yet another preview</MatListItemLine>}
        />
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
