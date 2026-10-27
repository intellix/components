import {component$} from '@builder.io/qwik';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatListItemIcon,
  MatListItemMeta,
} from '@angular-community/qwik-material/list';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatList role="list">
        <MatListItem
          icon={
            <MatListItemIcon
              style={{width: '100%', height: '100%', background: '#f44336', borderRadius: '4px'}}
            />
          }
          title={<MatListItemTitle>Inbox</MatListItemTitle>}
          meta={<MatListItemMeta>128</MatListItemMeta>}
        />
        <MatListItem
          icon={
            <MatListItemIcon
              style={{width: '100%', height: '100%', background: '#4caf50', borderRadius: '4px'}}
            />
          }
          title={<MatListItemTitle>Sent</MatListItemTitle>}
          meta={<MatListItemMeta>42</MatListItemMeta>}
        />
        <MatListItem
          icon={
            <MatListItemIcon
              style={{width: '100%', height: '100%', background: '#2196f3', borderRadius: '4px'}}
            />
          }
          title={<MatListItemTitle>Drafts</MatListItemTitle>}
          meta={<MatListItemMeta>7</MatListItemMeta>}
        />
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
