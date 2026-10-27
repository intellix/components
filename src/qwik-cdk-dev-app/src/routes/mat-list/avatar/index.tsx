import {component$} from '@builder.io/qwik';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatListItemLine,
  MatListItemAvatar,
} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatList role="list">
        <MatListItem
          avatar={
            <MatListItemAvatar style={{width: '100%', height: '100%', background: '#f44336'}} />
          }
          title={<MatListItemTitle>Alice Smith</MatListItemTitle>}
          lineContent={<MatListItemLine>alice@example.com</MatListItemLine>}
        />
        <MatListItem
          avatar={
            <MatListItemAvatar style={{width: '100%', height: '100%', background: '#4caf50'}} />
          }
          title={<MatListItemTitle>Bob Jones</MatListItemTitle>}
          lineContent={<MatListItemLine>bob@example.com</MatListItemLine>}
        />
        <MatListItem
          avatar={
            <MatListItemAvatar style={{width: '100%', height: '100%', background: '#2196f3'}} />
          }
          title={<MatListItemTitle>Carol Davis</MatListItemTitle>}
          lineContent={<MatListItemLine>carol@example.com</MatListItemLine>}
        />
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
