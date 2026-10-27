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
        <MatListItem
          title={<MatListItemTitle>Message from Alice</MatListItemTitle>}
          lineContent={[
            <MatListItemLine key="a1">Subject line here</MatListItemLine>,
            <MatListItemLine key="a2">Preview text of the message body</MatListItemLine>,
          ]}
        />
        <MatListItem
          title={<MatListItemTitle>Message from Bob</MatListItemTitle>}
          lineContent={[
            <MatListItemLine key="b1">Different subject</MatListItemLine>,
            <MatListItemLine key="b2">Different preview</MatListItemLine>,
          ]}
        />
        <MatListItem
          title={<MatListItemTitle>Message from Carol</MatListItemTitle>}
          lineContent={[
            <MatListItemLine key="c1">Third subject</MatListItemLine>,
            <MatListItemLine key="c2">Third preview</MatListItemLine>,
          ]}
        />
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
