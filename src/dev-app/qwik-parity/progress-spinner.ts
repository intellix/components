import {Component, Type} from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-progress-spinner/<name>/index.tsx.
// See button-toggle.ts for the [prop]-binding vs static-attribute convention.

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-spinner [value]="50"></mat-progress-spinner>
    </div>
  `,
  imports: [MatProgressSpinnerModule],
})
export class ProgressSpinnerBasic {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-spinner [value]="25" aria-label="Loading"></mat-progress-spinner>
    </div>
  `,
  imports: [MatProgressSpinnerModule],
})
export class ProgressSpinnerAriaLabeled {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-spinner [color]="'primary'" [value]="25"></mat-progress-spinner>
      <mat-progress-spinner [color]="'accent'" [value]="50"></mat-progress-spinner>
      <mat-progress-spinner [color]="'warn'" [value]="75"></mat-progress-spinner>
    </div>
  `,
  imports: [MatProgressSpinnerModule],
})
export class ProgressSpinnerColors {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-spinner [value]="50" [diameter]="40"></mat-progress-spinner>
    </div>
  `,
  imports: [MatProgressSpinnerModule],
})
export class ProgressSpinnerCustomDiameter {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-spinner [value]="50" [diameter]="40" [strokeWidth]="3"></mat-progress-spinner>
    </div>
  `,
  imports: [MatProgressSpinnerModule],
})
export class ProgressSpinnerCustomStroke {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-spinner [mode]="'determinate'" [value]="75"></mat-progress-spinner>
    </div>
  `,
  imports: [MatProgressSpinnerModule],
})
export class ProgressSpinnerDeterminate {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-spinner [mode]="'indeterminate'"></mat-progress-spinner>
    </div>
  `,
  imports: [MatProgressSpinnerModule],
})
export class ProgressSpinnerIndeterminate {}

@Component({
  template: `
    <div data-parity-root>
      <mat-spinner></mat-spinner>
    </div>
  `,
  imports: [MatProgressSpinnerModule],
})
export class ProgressSpinnerMatSpinnerAlias {}

export const PROGRESS_SPINNER_SCENARIOS: Record<string, Type<unknown>> = {
  'aria-labeled': ProgressSpinnerAriaLabeled,
  'basic': ProgressSpinnerBasic,
  'colors': ProgressSpinnerColors,
  'custom-diameter': ProgressSpinnerCustomDiameter,
  'custom-stroke': ProgressSpinnerCustomStroke,
  'determinate': ProgressSpinnerDeterminate,
  'indeterminate': ProgressSpinnerIndeterminate,
  'mat-spinner-alias': ProgressSpinnerMatSpinnerAlias,
};
