import {afterNextRender, ChangeDetectorRef, Component, Type} from '@angular/core';
import {MatProgressBarModule} from '@angular/material/progress-bar';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-progress-bar/<name>/index.tsx.
// See button-toggle.ts for the [prop]-binding vs static-attribute convention.

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-bar [value]="50"></mat-progress-bar>
    </div>
  `,
  imports: [MatProgressBarModule],
})
export class ProgressBarBasic {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-bar [value]="25" aria-label="Uploading"></mat-progress-bar>
    </div>
  `,
  imports: [MatProgressBarModule],
})
export class ProgressBarAriaLabeled {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-bar [mode]="'buffer'" [value]="30" [bufferValue]="65"></mat-progress-bar>
    </div>
  `,
  imports: [MatProgressBarModule],
})
export class ProgressBarBuffer {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-bar [color]="'primary'" [value]="25"></mat-progress-bar>
      <mat-progress-bar [color]="'accent'" [value]="50"></mat-progress-bar>
      <mat-progress-bar [color]="'warn'" [value]="75"></mat-progress-bar>
    </div>
  `,
  imports: [MatProgressBarModule],
})
export class ProgressBarColors {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-bar [mode]="'determinate'" [value]="75"></mat-progress-bar>
    </div>
  `,
  imports: [MatProgressBarModule],
})
export class ProgressBarDeterminate {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-bar [mode]="'indeterminate'"></mat-progress-bar>
    </div>
  `,
  imports: [MatProgressBarModule],
})
export class ProgressBarIndeterminate {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-bar [mode]="'query'"></mat-progress-bar>
    </div>
  `,
  imports: [MatProgressBarModule],
})
export class ProgressBarQuery {}

@Component({
  template: `
    <div data-parity-root>
      <mat-progress-bar [value]="value" (animationEnd)="onAnimationEnd()"></mat-progress-bar>
      <div [attr.data-animation-end]="fired ? 'fired' : 'pending'">
        {{ fired ? 'fired' : 'pending' }}
      </div>
    </div>
  `,
  imports: [MatProgressBarModule],
})
export class ProgressBarAnimationEnd {
  value = 0;
  fired = false;

  constructor(private _changeDetectorRef: ChangeDetectorRef) {
    // Kick the value from 0 to 100 once the bar has rendered at 0, mirroring the
    // Qwik route's useVisibleTask$ + queueMicrotask, so a CSS transition runs.
    afterNextRender(() =>
      setTimeout(() => {
        this.value = 100;
        this._changeDetectorRef.markForCheck();
      }),
    );
  }

  onAnimationEnd(): void {
    this.fired = true;
    this._changeDetectorRef.markForCheck();
  }
}

export const PROGRESS_BAR_SCENARIOS: Record<string, Type<unknown>> = {
  'animation-end': ProgressBarAnimationEnd,
  'aria-labeled': ProgressBarAriaLabeled,
  'basic': ProgressBarBasic,
  'buffer': ProgressBarBuffer,
  'colors': ProgressBarColors,
  'determinate': ProgressBarDeterminate,
  'indeterminate': ProgressBarIndeterminate,
  'query': ProgressBarQuery,
};
