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
        <MatListItem>
          <MatListItemAvatar>
            <div style={{width: '100%', height: '100%', background: '#f44336'}} />
          </MatListItemAvatar>
          <MatListItemTitle>Alice Smith</MatListItemTitle>
          <MatListItemLine>alice@example.com</MatListItemLine>
        </MatListItem>
        <MatListItem>
          <MatListItemAvatar>
            <div style={{width: '100%', height: '100%', background: '#4caf50'}} />
          </MatListItemAvatar>
          <MatListItemTitle>Bob Jones</MatListItemTitle>
          <MatListItemLine>bob@example.com</MatListItemLine>
        </MatListItem>
        <MatListItem>
          <MatListItemAvatar>
            <div style={{width: '100%', height: '100%', background: '#2196f3'}} />
          </MatListItemAvatar>
          <MatListItemTitle>Carol Davis</MatListItemTitle>
          <MatListItemLine>carol@example.com</MatListItemLine>
        </MatListItem>
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
