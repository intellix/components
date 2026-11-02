import {Component, Type} from '@angular/core';
import {MatDividerModule} from '@angular/material/divider';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-divider/<name>/index.tsx.
// <mat-divider> has no template content, so inputs are bound with [prop] syntax
// to avoid Angular also echoing a static `vertical`/`inset` attribute onto the
// host, which the Qwik <MatDivider> never renders.

@Component({
  template: `
    <div data-parity-root>
      <p>Section 1</p>
      <mat-divider></mat-divider>
      <p>Section 2</p>
    </div>
  `,
  imports: [MatDividerModule],
})
export class DividerBasic {}

@Component({
  template: `
    <div data-parity-root>
      <p>Comments</p>
      <mat-divider aria-label="End of comments"></mat-divider>
      <p>Suggested actions</p>
    </div>
  `,
  imports: [MatDividerModule],
})
export class DividerAriaLabeled {}

@Component({
  template: `
    <div data-parity-root>
      <p>Section 1</p>
      <mat-divider [inset]="true"></mat-divider>
      <p>Section 2</p>
    </div>
  `,
  imports: [MatDividerModule],
})
export class DividerInset {}

@Component({
  template: `
    <div data-parity-root>
      <div>Item A</div>
      <mat-divider></mat-divider>
      <div>Item B</div>
      <mat-divider></mat-divider>
      <div>Item C</div>
    </div>
  `,
  imports: [MatDividerModule],
})
export class DividerListContext {}

@Component({
  template: `
    <div data-parity-root>
      <div style="display: flex; align-items: stretch; height: 80px">
        <span>Left</span>
        <mat-divider [vertical]="true"></mat-divider>
        <span>Right</span>
      </div>
    </div>
  `,
  imports: [MatDividerModule],
})
export class DividerVertical {}

@Component({
  template: `
    <div data-parity-root>
      <div style="display: flex; align-items: stretch; height: 80px">
        <span>Left</span>
        <mat-divider [vertical]="true" [inset]="true"></mat-divider>
        <span>Right</span>
      </div>
    </div>
  `,
  imports: [MatDividerModule],
})
export class DividerVerticalInset {}

export const DIVIDER_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': DividerBasic,
  'aria-labeled': DividerAriaLabeled,
  'inset': DividerInset,
  'list-context': DividerListContext,
  'vertical': DividerVertical,
  'vertical-inset': DividerVerticalInset,
};
