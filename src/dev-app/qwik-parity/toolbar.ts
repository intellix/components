import {Component, Type} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-toolbar/<name>/index.tsx.
// `color` is a real @Input on MatToolbar, so it is bound with [color] rather
// than a static attribute (see button-toggle.ts for why). MatToolbar has no
// `multipleRows` input of its own — upstream detects multiple-row mode via an
// @ContentChildren query for projected <mat-toolbar-row> elements, so the
// Qwik `multipleRows` prop is mirrored simply by projecting (or not
// projecting) <mat-toolbar-row> children.

@Component({
  template: `
    <div data-parity-root>
      <mat-toolbar>My Application</mat-toolbar>
    </div>
  `,
  imports: [MatToolbarModule],
})
export class ToolbarBasic {}

@Component({
  template: `
    <div data-parity-root>
      <mat-toolbar [color]="'accent'">Accent toolbar</mat-toolbar>
    </div>
  `,
  imports: [MatToolbarModule],
})
export class ToolbarColorAccent {}

@Component({
  template: `
    <div data-parity-root>
      <mat-toolbar [color]="'primary'">Primary toolbar</mat-toolbar>
    </div>
  `,
  imports: [MatToolbarModule],
})
export class ToolbarColorPrimary {}

@Component({
  template: `
    <div data-parity-root>
      <mat-toolbar [color]="'warn'">Warn toolbar</mat-toolbar>
    </div>
  `,
  imports: [MatToolbarModule],
})
export class ToolbarColorWarn {}

@Component({
  template: `
    <div data-parity-root>
      <mat-toolbar>
        <mat-toolbar-row>First row</mat-toolbar-row>
        <mat-toolbar-row>Second row</mat-toolbar-row>
      </mat-toolbar>
    </div>
  `,
  imports: [MatToolbarModule],
})
export class ToolbarMultipleRows {}

export const TOOLBAR_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': ToolbarBasic,
  'color-accent': ToolbarColorAccent,
  'color-primary': ToolbarColorPrimary,
  'color-warn': ToolbarColorWarn,
  'multiple-rows': ToolbarMultipleRows,
};
