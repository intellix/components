import {Component, Type} from '@angular/core';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-list/.
// See button-toggle.ts for the general approach. Qwik's list/mat-list-item-sections
// ports matListItemTitle/Line/Meta/Avatar/Icon as wrapping components (each rendering
// its own <div>), whereas upstream Material ships them as plain attribute directives
// applied directly to the content element — the forms used below follow the real
// Material API (see src/material/list/*.ts and src/dev-app/list/list-demo.html).

@Component({
  template: `
    <div data-parity-root>
      <mat-list role="list">
        <mat-list-item>
          <div matListItemTitle>Item 1</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemTitle>Item 2</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemTitle>Item 3</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemTitle>Item 4</div>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  imports: [MatListModule],
})
export class ListBasic {}

// Avatar swatches previously used inline `width: 100%; height: 100%`, which
// overrides the `.mdc-list-item--with-leading-avatar .mdc-list-item__start`
// rule that sizes the real element to a 40px circle (list.scss) — an inline
// style always wins over an external stylesheet rule on the SAME element
// regardless of selector specificity, so the avatar stretched to fill its
// flex-row parent's full width instead of rendering as a circle. Dropping
// the width/height override (the component CSS already sizes + rounds it)
// and adding initials text — matching the realistic "named contact" content
// this scenario already uses — fixes it. See EXAMPLES.md "Scenario visual
// cleanup" / mat-list.
@Component({
  template: `
    <div data-parity-root>
      <mat-list role="list">
        <mat-list-item>
          <div matListItemAvatar style="background: #f44336; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 500">AS</div>
          <div matListItemTitle>Alice Smith</div>
          <div matListItemLine>alice@example.com</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemAvatar style="background: #4caf50; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 500">BJ</div>
          <div matListItemTitle>Bob Jones</div>
          <div matListItemLine>bob@example.com</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemAvatar style="background: #2196f3; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 500">CD</div>
          <div matListItemTitle>Carol Davis</div>
          <div matListItemLine>carol@example.com</div>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  imports: [MatListModule],
})
export class ListAvatar {}

// Icon swatches had the same inline width:100%/height:100% bug as the
// avatar scenario above (overriding the fixed leading-icon size), AND used
// a plain colored <div> instead of a real icon — real usage is
// `<mat-icon matListItemIcon>`, as in list-sections-example.html. Icon
// names ("inbox"/"send"/"drafts") match each item's own label.
@Component({
  template: `
    <div data-parity-root>
      <mat-list role="list">
        <mat-list-item>
          <mat-icon matListItemIcon>inbox</mat-icon>
          <div matListItemTitle>Inbox</div>
          <div matListItemMeta>128</div>
        </mat-list-item>
        <mat-list-item>
          <mat-icon matListItemIcon>send</mat-icon>
          <div matListItemTitle>Sent</div>
          <div matListItemMeta>42</div>
        </mat-list-item>
        <mat-list-item>
          <mat-icon matListItemIcon>drafts</mat-icon>
          <div matListItemTitle>Drafts</div>
          <div matListItemMeta>7</div>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  imports: [MatListModule, MatIconModule],
})
export class ListIconMeta {}

@Component({
  template: `
    <div data-parity-root>
      <mat-nav-list>
        <a mat-list-item href="/inbox">
          <div matListItemTitle>Inbox</div>
        </a>
        <a mat-list-item href="/sent" [activated]="true">
          <div matListItemTitle>Sent</div>
        </a>
        <a mat-list-item href="/drafts">
          <div matListItemTitle>Drafts</div>
        </a>
      </mat-nav-list>
    </div>
  `,
  imports: [MatListModule],
})
export class ListNav {}

@Component({
  template: `
    <div data-parity-root>
      <mat-action-list>
        <button mat-list-item>
          <div matListItemTitle>Save</div>
        </button>
        <button mat-list-item>
          <div matListItemTitle>Duplicate</div>
        </button>
        <button mat-list-item [disabled]="true">
          <div matListItemTitle>Delete</div>
        </button>
      </mat-action-list>
    </div>
  `,
  imports: [MatListModule],
})
export class ListAction {}

@Component({
  template: `
    <div data-parity-root>
      <mat-list role="list">
        <mat-list-item>
          <div matListItemTitle>Message from Alice</div>
          <div matListItemLine>Subject line here</div>
          <div matListItemLine>Preview text of the message body</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemTitle>Message from Bob</div>
          <div matListItemLine>Different subject</div>
          <div matListItemLine>Different preview</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemTitle>Message from Carol</div>
          <div matListItemLine>Third subject</div>
          <div matListItemLine>Third preview</div>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  imports: [MatListModule],
})
export class ListThreeLine {}

@Component({
  template: `
    <div data-parity-root>
      <mat-list role="list">
        <mat-list-item>
          <div matListItemTitle>Message from Alice</div>
          <div matListItemLine>Preview text goes here</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemTitle>Message from Bob</div>
          <div matListItemLine>Another preview line</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemTitle>Message from Carol</div>
          <div matListItemLine>Yet another preview</div>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  imports: [MatListModule],
})
export class ListTwoLine {}

@Component({
  template: `
    <div data-parity-root>
      <mat-list role="list">
        <div mat-subheader>Inbox</div>
        <mat-list-item>
          <div matListItemTitle>Message 1</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemTitle>Message 2</div>
        </mat-list-item>
        <mat-divider></mat-divider>
        <div mat-subheader>Archive</div>
        <mat-list-item>
          <div matListItemTitle>Archived 1</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemTitle>Archived 2</div>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  imports: [MatListModule],
})
export class ListWithSubheader {}

export const LIST_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': ListBasic,
  'avatar': ListAvatar,
  'icon-meta': ListIconMeta,
  'nav': ListNav,
  'action': ListAction,
  'three-line': ListThreeLine,
  'two-line': ListTwoLine,
  'with-subheader': ListWithSubheader,
};
