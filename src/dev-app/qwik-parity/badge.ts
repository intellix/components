import {Component} from '@angular/core';
import {MatBadgeModule} from '@angular/material/badge';
import {MatButtonModule} from '@angular/material/button';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-badge/<name>/index.tsx.
// Upstream matBadge is a `[matBadge]` attribute directive applied to the host element
// (here, the <button>); the badge content <span> is created dynamically by the
// directive, not authored in the template. Inputs use [prop] bindings (see
// button-toggle.ts) because a static `matBadge="5"` attribute would also be echoed
// onto the host element, which Qwik's wrapper-based MatBadge never renders.
//
// The host is a real Material button (`matButton="elevated"`, matching
// `badge-overview-example.html`'s `<button matButton="elevated" matBadge="8" ...>`)
// rather than a bare unstyled `<button>` — previously these scenarios used an
// unstyled native button, which looked like a placeholder next to the docs
// example. Multi-button scenarios also get `margin-right: 16px` so an
// `above after`-positioned badge (which overflows ~11px past its own
// button's right edge) doesn't visually collide with the next button — it
// previously had none, so e.g. `positions`' badges overlapped the adjacent
// button. See EXAMPLES.md "Scenario visual cleanup" / mat-badge.

@Component({
  template: `
    <div data-parity-root>
      <button matButton="elevated" [matBadge]="'5'">Notifications</button>
    </div>
  `,
  imports: [MatBadgeModule, MatButtonModule],
})
export class BadgeBasic {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton="elevated" style="margin-right: 16px" [matBadge]="'3'" [matBadgeColor]="'primary'">
        Primary
      </button>
      <button matButton="elevated" style="margin-right: 16px" [matBadge]="'7'" [matBadgeColor]="'accent'">
        Accent
      </button>
      <button matButton="elevated" [matBadge]="'9'" [matBadgeColor]="'warn'">Warn</button>
    </div>
  `,
  imports: [MatBadgeModule, MatButtonModule],
})
export class BadgeColors {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton="elevated" [matBadge]="'5'" [matBadgeDescription]="'3 unread messages'">
        Messages
      </button>
    </div>
  `,
  imports: [MatBadgeModule, MatButtonModule],
})
export class BadgeDescription {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton="elevated" [matBadge]="'5'" [matBadgeDisabled]="true">Alerts</button>
    </div>
  `,
  imports: [MatBadgeModule, MatButtonModule],
})
export class BadgeDisabled {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton="elevated" style="margin-right: 16px" [matBadge]="''">Empty</button>
      <button matButton="elevated" style="margin-right: 16px" [matBadge]="' '">Whitespace</button>
      <button matButton="elevated" [matBadge]="0">Zero</button>
    </div>
  `,
  imports: [MatBadgeModule, MatButtonModule],
})
export class BadgeEmptyContent {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton="elevated" [matBadge]="'5'" [matBadgeHidden]="true">Inbox</button>
    </div>
  `,
  imports: [MatBadgeModule, MatButtonModule],
})
export class BadgeHidden {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton="elevated" [matBadge]="'9'" [matBadgeOverlap]="false">Cart</button>
    </div>
  `,
  imports: [MatBadgeModule, MatButtonModule],
})
export class BadgeNoOverlap {}

@Component({
  template: `
    <div data-parity-root>
      <button
        matButton="elevated"
        style="margin-right: 16px"
        [matBadge]="'1'"
        [matBadgePosition]="'above after'">
        Above-After
      </button>
      <button
        matButton="elevated"
        style="margin-right: 16px"
        [matBadge]="'2'"
        [matBadgePosition]="'above before'">
        Above-Before
      </button>
      <button
        matButton="elevated"
        style="margin-right: 16px"
        [matBadge]="'3'"
        [matBadgePosition]="'below after'">
        Below-After
      </button>
      <button matButton="elevated" [matBadge]="'4'" [matBadgePosition]="'below before'">
        Below-Before
      </button>
    </div>
  `,
  imports: [MatBadgeModule, MatButtonModule],
})
export class BadgePositions {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton="elevated" style="margin-right: 16px" [matBadge]="'1'" [matBadgeSize]="'small'">
        Small
      </button>
      <button matButton="elevated" style="margin-right: 16px" [matBadge]="'5'" [matBadgeSize]="'medium'">
        Medium
      </button>
      <button matButton="elevated" [matBadge]="'99'" [matBadgeSize]="'large'">Large</button>
    </div>
  `,
  imports: [MatBadgeModule, MatButtonModule],
})
export class BadgeSizes {}

export const BADGE_SCENARIOS = {
  'basic': BadgeBasic,
  'colors': BadgeColors,
  'description': BadgeDescription,
  'disabled': BadgeDisabled,
  'empty-content': BadgeEmptyContent,
  'hidden': BadgeHidden,
  'no-overlap': BadgeNoOverlap,
  'positions': BadgePositions,
  'sizes': BadgeSizes,
};
