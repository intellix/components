import {Component, Type} from '@angular/core';
import {MatExpansionModule} from '@angular/material/expansion';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-expansion/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static attribute
// input is also echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop.
//
// Timing note: `MatExpansionPanel` adds the class `mat-expansion-panel-animations-enabled`
// to its host ~200ms after `ngAfterContentInit` (see `_setupAnimationEvents` in
// src/material/expansion/expansion-panel.ts), but only when animations are enabled — which is
// the dev-app's default (`cachedAppState.animations` defaults to `true` in
// src/dev-app/dev-app/dev-app-state.ts, wired to `MATERIAL_ANIMATIONS` in src/dev-app/main.ts).
// None of these scenarios opt out of that default, so every `.mat-expansion-panel` here gets
// the class ~200ms after load. All other DOM changes driven by `expanded` (classes, `aria-*`,
// the body wrapper's `inert` attribute, header height) happen synchronously with clicks/keys —
// the 200ms class is the only async part, and the parity spec waits for it before the first
// comparison. The qwik-material port must reproduce the same one-time, time-delayed class
// flip for the initial-state comparison to be stable.

@Component({
  template: `
    <div data-parity-root>
      <mat-expansion-panel (opened)="opened = true" (closed)="opened = false">
        <mat-expansion-panel-header>
          <mat-panel-title>Personal data</mat-panel-title>
          <mat-panel-description>Type your name and age</mat-panel-description>
        </mat-expansion-panel-header>
        <p>This is the primary content of the panel.</p>
      </mat-expansion-panel>
      <p>Opened: {{ opened }}</p>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionBasic {
  opened = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-expansion-panel [(expanded)]="panelExpanded">
        <mat-expansion-panel-header>
          <mat-panel-title>Billing address</mat-panel-title>
        </mat-expansion-panel-header>
        <p>Visible immediately because the panel starts expanded.</p>
      </mat-expansion-panel>
      <p>Expanded: {{ panelExpanded }}</p>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionInitiallyExpanded {
  panelExpanded = true;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-expansion-panel [disabled]="true">
        <mat-expansion-panel-header>
          <mat-panel-title>Destination</mat-panel-title>
          <mat-panel-description>Type the country name</mat-panel-description>
        </mat-expansion-panel-header>
        <p>This panel cannot be toggled.</p>
      </mat-expansion-panel>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionDisabled {}

@Component({
  template: `
    <div data-parity-root>
      <mat-expansion-panel [hideToggle]="true">
        <mat-expansion-panel-header>
          <mat-panel-title>No indicator</mat-panel-title>
        </mat-expansion-panel-header>
        <p>Content without an expansion indicator.</p>
      </mat-expansion-panel>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionHideToggle {}

@Component({
  template: `
    <div data-parity-root>
      <mat-expansion-panel [togglePosition]="'before'">
        <mat-expansion-panel-header>
          <mat-panel-title>Indicator before the title</mat-panel-title>
        </mat-expansion-panel-header>
        <p>Content with a leading expansion indicator.</p>
      </mat-expansion-panel>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionTogglePositionBefore {}

@Component({
  template: `
    <div data-parity-root>
      <mat-expansion-panel [(expanded)]="panelExpanded">
        <mat-expansion-panel-header [expandedHeight]="'64px'" [collapsedHeight]="'32px'">
          <mat-panel-title>Custom header heights</mat-panel-title>
        </mat-expansion-panel-header>
        <p>Header height changes between collapsed and expanded.</p>
      </mat-expansion-panel>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionHeaderHeights {
  panelExpanded = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-expansion-panel [(expanded)]="panelExpanded">
        <mat-expansion-panel-header>
          <mat-panel-title>Confirm changes</mat-panel-title>
        </mat-expansion-panel-header>
        <p>This is the primary content of the panel.</p>
        <mat-action-row>
          <button type="button" (click)="panelExpanded = false">CANCEL</button>
          <button type="button" (click)="panelExpanded = false">SAVE</button>
        </mat-action-row>
      </mat-expansion-panel>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionActionRow {
  panelExpanded = true;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-expansion-panel [(expanded)]="panelExpanded">
        <mat-expansion-panel-header>
          <mat-panel-title>Lazy-rendered content</mat-panel-title>
        </mat-expansion-panel-header>
        <ng-template matExpansionPanelContent>
          <p>Rendered only after the panel opens for the first time.</p>
        </ng-template>
      </mat-expansion-panel>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionLazyContent {
  panelExpanded = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-accordion>
        <mat-expansion-panel [(expanded)]="panel1Expanded">
          <mat-expansion-panel-header>
            <mat-panel-title>Section 1</mat-panel-title>
          </mat-expansion-panel-header>
          <p>Content of section 1.</p>
        </mat-expansion-panel>
        <mat-expansion-panel [(expanded)]="panel2Expanded">
          <mat-expansion-panel-header>
            <mat-panel-title>Section 2</mat-panel-title>
          </mat-expansion-panel-header>
          <p>Content of section 2.</p>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionAccordionSingle {
  panel1Expanded = true;
  panel2Expanded = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-accordion [multi]="true">
        <mat-expansion-panel [(expanded)]="panel1Expanded">
          <mat-expansion-panel-header>
            <mat-panel-title>Alpha</mat-panel-title>
          </mat-expansion-panel-header>
          <p>Alpha content.</p>
        </mat-expansion-panel>
        <mat-expansion-panel [(expanded)]="panel2Expanded">
          <mat-expansion-panel-header>
            <mat-panel-title>Beta</mat-panel-title>
          </mat-expansion-panel-header>
          <p>Beta content.</p>
        </mat-expansion-panel>
        <mat-expansion-panel [(expanded)]="panel3Expanded">
          <mat-expansion-panel-header>
            <mat-panel-title>Gamma</mat-panel-title>
          </mat-expansion-panel-header>
          <p>Gamma content.</p>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionAccordionMulti {
  panel1Expanded = false;
  panel2Expanded = false;
  panel3Expanded = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-accordion [displayMode]="'flat'">
        <mat-expansion-panel [(expanded)]="panel1Expanded">
          <mat-expansion-panel-header>
            <mat-panel-title>Flat section 1</mat-panel-title>
          </mat-expansion-panel-header>
          <p>Content of flat section 1.</p>
        </mat-expansion-panel>
        <mat-expansion-panel [(expanded)]="panel2Expanded">
          <mat-expansion-panel-header>
            <mat-panel-title>Flat section 2</mat-panel-title>
          </mat-expansion-panel-header>
          <p>Content of flat section 2.</p>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  imports: [MatExpansionModule],
})
export class ExpansionAccordionFlat {
  panel1Expanded = false;
  panel2Expanded = false;
}

export const EXPANSION_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': ExpansionBasic,
  'initially-expanded': ExpansionInitiallyExpanded,
  'disabled': ExpansionDisabled,
  'hide-toggle': ExpansionHideToggle,
  'toggle-position-before': ExpansionTogglePositionBefore,
  'header-heights': ExpansionHeaderHeights,
  'action-row': ExpansionActionRow,
  'lazy-content': ExpansionLazyContent,
  'accordion-single': ExpansionAccordionSingle,
  'accordion-multi': ExpansionAccordionMulti,
  'accordion-flat': ExpansionAccordionFlat,
};
