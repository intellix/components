import {Component, Type} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-tabs/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static attribute
// input is also echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop.
//
// Every `<mat-tab-group>`/`<nav mat-tab-nav-bar>` below gets a fixed inline `style="width: …"`
// (directly on the element, a plain DOM attribute, not a Material input) so that header width —
// and therefore pagination/ink-bar geometry — doesn't depend on the surrounding dev-app chrome,
// which differs between the Angular and Qwik dev-apps. See the spec header comment for exact
// pixel values and verified behavior (ink-bar placement, pagination thresholds, the tab-body
// transition/detach timing that every tab-switching step has to wait out).

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
        <mat-tab label="Third">Content 3</mat-tab>
      </mat-tab-group>
      <p>Selected: {{ selected }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsBasic {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 480px" [selectedIndex]="2" (selectedIndexChange)="selected = $event">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
        <mat-tab label="Third">Content 3</mat-tab>
      </mat-tab-group>
      <p>Selected: {{ selected }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsSelectedIndexInitial {
  selected = 2;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second" [disabled]="true">Content 2 (disabled)</mat-tab>
        <mat-tab label="Third">Content 3</mat-tab>
      </mat-tab-group>
      <p>Selected: {{ selected }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsDisabledTab {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-tab>
          <ng-template mat-tab-label>
            <strong>First</strong> (custom)
          </ng-template>
          Content 1
        </mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
      </mat-tab-group>
      <p>Selected: {{ selected }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsCustomLabel {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-tab label="First">
          <ng-template matTabContent>
            <p>Loaded content 1</p>
          </ng-template>
        </mat-tab>
        <mat-tab label="Second">
          <ng-template matTabContent>
            <p>Loaded content 2</p>
          </ng-template>
        </mat-tab>
      </mat-tab-group>
      <p>Selected: {{ selected }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsLazyContent {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 480px" [preserveContent]="true" (selectedIndexChange)="selected = $event">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
      </mat-tab-group>
      <p>Selected: {{ selected }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsPreserveContent {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 320px" [mat-stretch-tabs]="false" [mat-align-tabs]="'start'">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
      </mat-tab-group>
      <mat-tab-group style="width: 320px" [mat-stretch-tabs]="false" [mat-align-tabs]="'center'">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
      </mat-tab-group>
      <mat-tab-group style="width: 320px" [mat-stretch-tabs]="false" [mat-align-tabs]="'end'">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
      </mat-tab-group>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsAlign {}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 480px" [headerPosition]="'below'" (selectedIndexChange)="selected = $event">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
        <mat-tab label="Third">Content 3</mat-tab>
      </mat-tab-group>
      <p>Selected: {{ selected }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsHeaderBelow {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 480px" [dynamicHeight]="true" (selectedIndexChange)="selected = $event">
        <mat-tab label="Short">
          <p style="margin: 0; height: 40px;">Short content.</p>
        </mat-tab>
        <mat-tab label="Tall">
          <p style="margin: 0; height: 200px;">Tall content.</p>
        </mat-tab>
      </mat-tab-group>
      <p>Selected: {{ selected }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsDynamicHeight {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 300px" (selectedIndexChange)="selected = $event">
        @for (tab of tabs; track tab) {
          <mat-tab [label]="tab">Content for {{ tab }}</mat-tab>
        }
      </mat-tab-group>
      <p>Selected: {{ selected }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsPagination {
  tabs = Array.from({length: 20}, (_, i) => `Tab ${i}`);
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <nav mat-tab-nav-bar style="width: 480px" [tabPanel]="tabPanel">
        @for (link of links; track link) {
          <a mat-tab-link (click)="activeLink = link" [active]="activeLink === link">{{ link }}</a>
        }
        <a mat-tab-link [disabled]="true">Disabled</a>
      </nav>
      <mat-tab-nav-panel #tabPanel>
        <p>Panel content for {{ activeLink }}</p>
      </mat-tab-nav-panel>
      <p>Selected: {{ activeLink }}</p>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsNavBar {
  links = ['First', 'Second', 'Third'];
  activeLink = this.links[0];
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tab-group style="width: 480px" [aria-label]="'Settings sections'">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
      </mat-tab-group>
      <label id="ext-tabs-label">External tabs label</label>
      <mat-tab-group style="width: 480px" [aria-labelledby]="'ext-tabs-label'">
        <mat-tab label="First">Content 1</mat-tab>
        <mat-tab label="Second">Content 2</mat-tab>
      </mat-tab-group>
    </div>
  `,
  imports: [MatTabsModule],
})
export class TabsAriaLabel {}

export const TABS_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': TabsBasic,
  'selected-index-initial': TabsSelectedIndexInitial,
  'disabled-tab': TabsDisabledTab,
  'custom-label': TabsCustomLabel,
  'lazy-content': TabsLazyContent,
  'preserve-content': TabsPreserveContent,
  'align': TabsAlign,
  'header-below': TabsHeaderBelow,
  'dynamic-height': TabsDynamicHeight,
  'pagination': TabsPagination,
  'nav-bar': TabsNavBar,
  'aria-label': TabsAriaLabel,
};
