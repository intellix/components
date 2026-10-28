import {Component, Type} from '@angular/core';
import {MatTooltipModule} from '@angular/material/tooltip';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-tooltip/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static attribute
// input is also echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop.
//
// The tooltip itself renders into `.cdk-overlay-container` under <body>, not inside
// `[data-parity-root]` — see this file's spec (angular-parity.spec.ts) for how both the
// trigger area (`[data-parity-root]`) and the overlay are compared. Every trigger below is a
// plain native `<button>` (not `matButton`) given a fixed position AND fixed size via a
// *static* inline `style` attribute (never bound — these values never change), so the
// overlay's computed pixel geometry (top/left on the connected-position bounding box and
// pane) is identical on both apps regardless of surrounding dev-app chrome.

@Component({
  template: `
    <div data-parity-root>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matTooltip]="message"
        aria-label="Button that displays a tooltip when hovered or focused">
        Action
      </button>
    </div>
  `,
  imports: [MatTooltipModule],
})
export class TooltipBasic {
  message = 'Info about the action';
}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 100px; left: 320px; width: 160px; height: 48px;"
        [matTooltip]="message"
        [matTooltipPosition]="'above'"
        aria-label="Button with a tooltip positioned above">
        above
      </button>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 180px; left: 320px; width: 160px; height: 48px;"
        [matTooltip]="message"
        [matTooltipPosition]="'left'"
        aria-label="Button with a tooltip positioned to the left">
        left
      </button>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 260px; left: 320px; width: 160px; height: 48px;"
        [matTooltip]="message"
        [matTooltipPosition]="'right'"
        aria-label="Button with a tooltip positioned to the right">
        right
      </button>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 340px; left: 320px; width: 160px; height: 48px;"
        [matTooltip]="message"
        [matTooltipPosition]="'before'"
        aria-label="Button with a tooltip positioned before (start)">
        before
      </button>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 420px; left: 320px; width: 160px; height: 48px;"
        [matTooltip]="message"
        [matTooltipPosition]="'after'"
        aria-label="Button with a tooltip positioned after (end)">
        after
      </button>
    </div>
  `,
  imports: [MatTooltipModule],
})
export class TooltipPositions {
  message = 'Info about the action';
}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matTooltip]="message"
        [matTooltipShowDelay]="50"
        [matTooltipHideDelay]="50"
        aria-label="Button that displays a tooltip with a 50ms show/hide delay">
        Action
      </button>
    </div>
  `,
  imports: [MatTooltipModule],
})
export class TooltipShowHideDelay {
  message = 'Info about the action';
}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matTooltip]="message"
        [matTooltipDisabled]="true"
        aria-label="Button whose tooltip is disabled">
        Action
      </button>
    </div>
  `,
  imports: [MatTooltipModule],
})
export class TooltipDisabled {
  message = 'Info about the action';
}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matTooltip]="message"
        [matTooltipClass]="tooltipClass"
        aria-label="Button whose tooltip has custom CSS classes">
        Action
      </button>
    </div>
  `,
  imports: [MatTooltipModule],
})
export class TooltipCustomClass {
  message = 'Info about the action';
  tooltipClass = {'custom-one': true, 'custom-two': true};
}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matTooltip]="message"
        [matTooltipTouchGestures]="'off'"
        aria-label="Button whose tooltip has touch gestures turned off">
        Action
      </button>
    </div>
  `,
  imports: [MatTooltipModule],
})
export class TooltipTouchGesturesOff {
  message = 'Info about the action';
}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 160px; left: 160px; width: 200px; height: 200px;"
        [matTooltip]="message"
        [matTooltipPositionAtOrigin]="true"
        aria-label="Button whose tooltip is positioned at the pointer origin">
        Action
      </button>
    </div>
  `,
  imports: [MatTooltipModule],
})
export class TooltipPositionAtOrigin {
  message = 'Info about the action';
}

@Component({
  template: `
    <div data-parity-root>
      <button
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        [matTooltip]="message"
        (keydown.m)="changeMessage()"
        aria-label="Button whose tooltip message can change while open">
        Action
      </button>
    </div>
  `,
  imports: [MatTooltipModule],
})
export class TooltipMessageChange {
  // Changed via a keydown on the trigger itself (NOT a click on a separate element): per
  // MatTooltip._createOverlay, the overlay's `outsidePointerEvents()` closes the tooltip on
  // ANY click/pointerdown that lands outside its panel, anywhere on the page — including on an
  // unrelated "change the message" button. A keydown that isn't Escape never reaches that
  // dismissal path (the overlay's own `_overlayEventPredicate` only forwards Escape keydowns),
  // so pressing a key while the trigger itself is focused is the only way to mutate the bound
  // message without the tooltip closing out from under the change.
  message = 'Info about the action';

  changeMessage() {
    this.message = 'Updated tooltip text that is noticeably longer than before';
  }
}

export const TOOLTIP_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': TooltipBasic,
  'positions': TooltipPositions,
  'show-hide-delay': TooltipShowHideDelay,
  'disabled': TooltipDisabled,
  'tooltip-class': TooltipCustomClass,
  'touch-gestures-off': TooltipTouchGesturesOff,
  'position-at-origin': TooltipPositionAtOrigin,
  'message-change': TooltipMessageChange,
};
