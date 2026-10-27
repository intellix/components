import {Component} from '@angular/core';
import {MatBadgeModule} from '@angular/material/badge';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-badge/<name>/index.tsx.
// Upstream matBadge is a `[matBadge]` attribute directive applied to the host element
// (here, the <button>); the badge content <span> is created dynamically by the
// directive, not authored in the template. Inputs use [prop] bindings (see
// button-toggle.ts) because a static `matBadge="5"` attribute would also be echoed
// onto the host element, which Qwik's wrapper-based MatBadge never renders.

@Component({
  template: `
    <div data-parity-root>
      <button [matBadge]="'5'">Notifications</button>
    </div>
  `,
  imports: [MatBadgeModule],
})
export class BadgeBasic {}

@Component({
  template: `
    <div data-parity-root>
      <button [matBadge]="'3'" [matBadgeColor]="'primary'">Primary</button>
      <button [matBadge]="'7'" [matBadgeColor]="'accent'">Accent</button>
      <button [matBadge]="'9'" [matBadgeColor]="'warn'">Warn</button>
    </div>
  `,
  imports: [MatBadgeModule],
})
export class BadgeColors {}

@Component({
  template: `
    <div data-parity-root>
      <button [matBadge]="'5'" [matBadgeDescription]="'3 unread messages'">Messages</button>
    </div>
  `,
  imports: [MatBadgeModule],
})
export class BadgeDescription {}

@Component({
  template: `
    <div data-parity-root>
      <button [matBadge]="'5'" [matBadgeDisabled]="true">Alerts</button>
    </div>
  `,
  imports: [MatBadgeModule],
})
export class BadgeDisabled {}

@Component({
  template: `
    <div data-parity-root>
      <button [matBadge]="''">Empty</button>
      <button [matBadge]="' '">Whitespace</button>
      <button [matBadge]="0">Zero</button>
    </div>
  `,
  imports: [MatBadgeModule],
})
export class BadgeEmptyContent {}

@Component({
  template: `
    <div data-parity-root>
      <button [matBadge]="'5'" [matBadgeHidden]="true">Inbox</button>
    </div>
  `,
  imports: [MatBadgeModule],
})
export class BadgeHidden {}

@Component({
  template: `
    <div data-parity-root>
      <button [matBadge]="'9'" [matBadgeOverlap]="false">Cart</button>
    </div>
  `,
  imports: [MatBadgeModule],
})
export class BadgeNoOverlap {}

@Component({
  template: `
    <div data-parity-root>
      <button [matBadge]="'1'" [matBadgePosition]="'above after'">Above-After</button>
      <button [matBadge]="'2'" [matBadgePosition]="'above before'">Above-Before</button>
      <button [matBadge]="'3'" [matBadgePosition]="'below after'">Below-After</button>
      <button [matBadge]="'4'" [matBadgePosition]="'below before'">Below-Before</button>
    </div>
  `,
  imports: [MatBadgeModule],
})
export class BadgePositions {}

@Component({
  template: `
    <div data-parity-root>
      <button [matBadge]="'1'" [matBadgeSize]="'small'">Small</button>
      <button [matBadge]="'5'" [matBadgeSize]="'medium'">Medium</button>
      <button [matBadge]="'99'" [matBadgeSize]="'large'">Large</button>
    </div>
  `,
  imports: [MatBadgeModule],
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
