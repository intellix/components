import {component$} from '@qwik.dev/core';
import {
  MatList,
  MatListItem,
  MatListItemTitle,
  MatListItemLine,
  MatListItemAvatar,
} from '@angular-community/qwik-material/list';

// Avatar swatches previously used inline `width: '100%', height: '100%'`,
// which overrides the `.mdc-list-item--with-leading-avatar
// .mdc-list-item__start` rule that sizes the real element to a 40px circle
// (list.scss) — an inline style always wins over an external stylesheet
// rule on the SAME element regardless of selector specificity, so the
// avatar stretched to fill its flex-row parent's full width instead of
// rendering as a circle. Dropping the width/height override (the component
// CSS already sizes + rounds it) and adding initials text — matching the
// realistic "named contact" content this scenario already uses — fixes it.
// Mirrors src/dev-app/qwik-parity/list.ts's identical fix. See
// EXAMPLES.md "Scenario visual cleanup" / mat-list.
const avatarStyle = (background: string) => ({
  background,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
});

export default component$(() => (
  <>
    <div data-parity-root>
      <MatList role="list">
        <MatListItem
          avatar={<MatListItemAvatar style={avatarStyle('#f44336')}>AS</MatListItemAvatar>}
          title={<MatListItemTitle>Alice Smith</MatListItemTitle>}
          lineContent={<MatListItemLine>alice@example.com</MatListItemLine>}
        />
        <MatListItem
          avatar={<MatListItemAvatar style={avatarStyle('#4caf50')}>BJ</MatListItemAvatar>}
          title={<MatListItemTitle>Bob Jones</MatListItemTitle>}
          lineContent={<MatListItemLine>bob@example.com</MatListItemLine>}
        />
        <MatListItem
          avatar={<MatListItemAvatar style={avatarStyle('#2196f3')}>CD</MatListItemAvatar>}
          title={<MatListItemTitle>Carol Davis</MatListItemTitle>}
          lineContent={<MatListItemLine>carol@example.com</MatListItemLine>}
        />
      </MatList>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
