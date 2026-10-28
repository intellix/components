import {Component, Type} from '@angular/core';
import {MatSidenavModule} from '@angular/material/sidenav';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-sidenav/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static attribute
// input is also echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop.
//
// Every container below is given a fixed inline size (`style="height: 300px; width: 600px"`)
// so the inline `margin-left`/`margin-right`/width-driven values the drawer/sidenav applies to
// its content are deterministic pixel numbers rather than depending on viewport size.
//
// Timing notes shared by every scenario (see the parity spec's header comment for the full
// writeup, with exact class/attribute names and delays, drawn from src/material/sidenav/drawer.ts
// and drawer.spec.ts):
//  - `MatDrawerContainer` adds a `mat-drawer-transition` class to itself ~200ms after init
//    (skips the opening transition for a drawer that's open by default) — every scenario's spec
//    waits for it before the first comparison, the same way mat-expansion waits for
//    `mat-expansion-panel-animations-enabled`.
//  - Opening/closing a drawer after that point runs a real 400ms CSS transform transition, during
//    which the drawer carries a transient `mat-drawer-animating` class; `openedChange` (and thus
//    any `(opened)`/`(closed)` output) only fires once that transition's `transitionend` event
//    lands. The content's `inert` attribute (only ever applied while a backdrop is actually
//    showing) additionally lags that same event by a further ~50ms (`delay(50)` in
//    `MatDrawerContent._drawerToggled`).

@Component({
  template: `
    <div data-parity-root>
      <mat-drawer-container style="height: 300px; width: 600px">
        <mat-drawer #drawer [mode]="'over'" (opened)="opened = true" (closed)="opened = false">
          <p>Drawer content</p>
          <button type="button" (click)="drawer.close()">Close</button>
        </mat-drawer>
        <mat-drawer-content>
          <button type="button" (click)="drawer.toggle()">Toggle</button>
          <p>Opened: {{ opened }}</p>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavModeOver {
  opened = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-drawer-container style="height: 300px; width: 600px">
        <mat-drawer #drawer [mode]="'push'" style="width: 200px">
          <p>Push drawer</p>
        </mat-drawer>
        <mat-drawer-content>
          <button type="button" (click)="drawer.toggle()">Toggle</button>
          <p>Opened: {{ opened }}</p>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavModePush {
  opened = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-drawer-container style="height: 300px; width: 600px">
        <mat-drawer #drawer [mode]="'side'" style="width: 180px">
          <p>Side drawer</p>
        </mat-drawer>
        <mat-drawer-content>
          <button type="button" (click)="drawer.toggle()">Toggle</button>
          <p>Opened: {{ opened }}</p>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavModeSide {
  opened = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-drawer-container style="height: 300px; width: 600px">
        <mat-drawer [mode]="'side'" [opened]="true" style="width: 220px">
          <p>Already open</p>
        </mat-drawer>
        <mat-drawer-content>
          <p>Always open on load</p>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavInitiallyOpened {}

@Component({
  template: `
    <div data-parity-root>
      <mat-drawer-container style="height: 300px; width: 600px">
        <mat-drawer #drawer [position]="'end'" [mode]="'over'">
          <p>End drawer</p>
          <button type="button" (click)="drawer.close()">Close</button>
        </mat-drawer>
        <mat-drawer-content>
          <button type="button" (click)="drawer.toggle()">Toggle</button>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavPositionEnd {}

@Component({
  template: `
    <div data-parity-root>
      <mat-drawer-container style="height: 300px; width: 600px">
        <mat-drawer [position]="'start'" [mode]="'side'" [opened]="true" style="width: 150px">
          <p>Start</p>
        </mat-drawer>
        <mat-drawer [position]="'end'" [mode]="'side'" [opened]="true" style="width: 120px">
          <p>End</p>
        </mat-drawer>
        <mat-drawer-content>
          <p>Content between two side drawers</p>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavTwoDrawers {}

@Component({
  template: `
    <div data-parity-root>
      <mat-drawer-container [hasBackdrop]="false" style="height: 300px; width: 600px">
        <mat-drawer #drawer [mode]="'over'">
          <p>Drawer without backdrop</p>
          <button type="button" (click)="drawer.close()">Close</button>
        </mat-drawer>
        <mat-drawer-content>
          <button type="button" (click)="drawer.toggle()">Toggle</button>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavHasBackdropFalse {}

@Component({
  template: `
    <div data-parity-root>
      <mat-drawer-container style="height: 300px; width: 600px">
        <mat-drawer #drawer [mode]="'over'" [disableClose]="true">
          <p>Cannot be closed via escape/backdrop</p>
        </mat-drawer>
        <mat-drawer-content>
          <button type="button" (click)="drawer.open()">Open</button>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavDisableClose {}

@Component({
  template: `
    <div data-parity-root>
      <mat-drawer-container [autosize]="true" style="height: 300px; width: 600px">
        <mat-drawer #drawer [mode]="'push'" [opened]="true" style="width: auto">
          <p>Autosizing drawer</p>
          <div [style.width.px]="fillerWidth" style="height: 20px"></div>
          <button type="button" (click)="fillerWidth = fillerWidth ? 0 : 150">
            Toggle extra width
          </button>
        </mat-drawer>
        <mat-drawer-content>
          <p>Main content</p>
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavAutosize {
  fillerWidth = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-sidenav-container style="height: 300px; width: 600px">
        <mat-sidenav
          [mode]="'side'"
          [opened]="true"
          [fixedInViewport]="true"
          [fixedTopGap]="64"
          [fixedBottomGap]="32"
          style="width: 200px">
          <p>Fixed sidenav</p>
        </mat-sidenav>
        <mat-sidenav-content>
          <p>Content</p>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  imports: [MatSidenavModule],
})
export class SidenavFixedInViewport {}

export const SIDENAV_SCENARIOS: Record<string, Type<unknown>> = {
  'mode-over': SidenavModeOver,
  'mode-push': SidenavModePush,
  'mode-side': SidenavModeSide,
  'initially-opened': SidenavInitiallyOpened,
  'position-end': SidenavPositionEnd,
  'two-drawers': SidenavTwoDrawers,
  'has-backdrop-false': SidenavHasBackdropFalse,
  'disable-close': SidenavDisableClose,
  'autosize': SidenavAutosize,
  'fixed-in-viewport': SidenavFixedInViewport,
};
