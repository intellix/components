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
    <MatList role="list">
      <MatListItem>
        <MatListItemIcon>
          <div
            style={{width: '100%', height: '100%', background: '#f44336', borderRadius: '4px'}}
          />
        </MatListItemIcon>
        <MatListItemTitle>Inbox</MatListItemTitle>
        <MatListItemMeta>128</MatListItemMeta>
      </MatListItem>
      <MatListItem>
        <MatListItemIcon>
          <div
            style={{width: '100%', height: '100%', background: '#4caf50', borderRadius: '4px'}}
          />
        </MatListItemIcon>
        <MatListItemTitle>Sent</MatListItemTitle>
        <MatListItemMeta>42</MatListItemMeta>
      </MatListItem>
      <MatListItem>
        <MatListItemIcon>
          <div
            style={{width: '100%', height: '100%', background: '#2196f3', borderRadius: '4px'}}
          />
        </MatListItemIcon>
        <MatListItemTitle>Drafts</MatListItemTitle>
        <MatListItemMeta>7</MatListItemMeta>
      </MatListItem>
    </MatList>
    <main data-scenario-ready>ready</main>
  </>
));
