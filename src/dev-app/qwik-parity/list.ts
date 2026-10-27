import {Component, Type} from '@angular/core';
import {MatListModule} from '@angular/material/list';

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

@Component({
  template: `
    <div data-parity-root>
      <mat-list role="list">
        <mat-list-item>
          <div matListItemAvatar style="width: 100%; height: 100%; background: #f44336"></div>
          <div matListItemTitle>Alice Smith</div>
          <div matListItemLine>alice@example.com</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemAvatar style="width: 100%; height: 100%; background: #4caf50"></div>
          <div matListItemTitle>Bob Jones</div>
          <div matListItemLine>bob@example.com</div>
        </mat-list-item>
        <mat-list-item>
          <div matListItemAvatar style="width: 100%; height: 100%; background: #2196f3"></div>
          <div matListItemTitle>Carol Davis</div>
          <div matListItemLine>carol@example.com</div>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  imports: [MatListModule],
})
export class ListAvatar {}

@Component({
  template: `
    <div data-parity-root>
      <mat-list role="list">
        <mat-list-item>
          <div
            matListItemIcon
            style="width: 100%; height: 100%; background: #f44336; border-radius: 4px"></div>
          <div matListItemTitle>Inbox</div>
          <div matListItemMeta>128</div>
        </mat-list-item>
        <mat-list-item>
          <div
            matListItemIcon
            style="width: 100%; height: 100%; background: #4caf50; border-radius: 4px"></div>
          <div matListItemTitle>Sent</div>
          <div matListItemMeta>42</div>
        </mat-list-item>
        <mat-list-item>
          <div
            matListItemIcon
            style="width: 100%; height: 100%; background: #2196f3; border-radius: 4px"></div>
          <div matListItemTitle>Drafts</div>
          <div matListItemMeta>7</div>
        </mat-list-item>
      </mat-list>
    </div>
  `,
  imports: [MatListModule],
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
