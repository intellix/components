import {Component, Type} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatStepperModule} from '@angular/material/stepper';
import {STEPPER_GLOBAL_OPTIONS, StepperOptions} from '@angular/cdk/stepper';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-stepper/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static attribute
// input is also echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop.
//
// Every `<mat-stepper>` below gets a fixed inline `style="width: 480px"` (a plain DOM
// attribute, not a Material input) so wrapping/line lengths don't depend on the surrounding
// dev-app chrome, which differs between the Angular and Qwik dev-apps.
//
// Navigation buttons use plain `<button matStepperNext>`/`<button matStepperPrevious>` (no
// `matButton`) so the comparison stays scoped to the stepper's own DOM contract, not
// mat-button's. See the spec header comment for the exact attributes/classes these two
// directives add to a plain `<button>` (not consumer-chosen — Material's own host bindings).
//
// `error-state` is the only scenario that provides `STEPPER_GLOBAL_OPTIONS`
// (`{showError: true}`) — see its component below and the spec header comment for how that
// interacts with a required `FormControl`. `linear-required` and `error-state` are the only
// two scenarios that use Angular forms at all (a bare `[formControl]` on a plain `<input>`,
// no `mat-form-field`/`matInput`), per the task's "forms only where needed" scope.
const SHOW_ERROR = {
  provide: STEPPER_GLOBAL_OPTIONS,
  useValue: {showError: true} as StepperOptions,
};

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step>
          <ng-template matStepLabel>Step one</ng-template>
          <p>Content for step one.</p>
          <div>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step two</ng-template>
          <p>Content for step two.</p>
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step three</ng-template>
          <p>Content for step three.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule],
})
export class StepperHorizontalBasic {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper [orientation]="'vertical'" style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step>
          <ng-template matStepLabel>Step one</ng-template>
          <p>Content for step one.</p>
          <div>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step two</ng-template>
          <p>Content for step two.</p>
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step three</ng-template>
          <p>Content for step three.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule],
})
export class StepperVerticalBasic {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper [linear]="true" style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step [stepControl]="nameCtrl">
          <ng-template matStepLabel>Fill out your name</ng-template>
          <input [formControl]="nameCtrl" placeholder="Name">
          <div>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Done</ng-template>
          <p>You are now done.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule, ReactiveFormsModule],
})
export class StepperLinearRequired {
  nameCtrl = new FormControl('', Validators.required);
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step>
          <ng-template matStepLabel>Step one</ng-template>
          <p>Content for step one.</p>
          <div>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step [optional]="true">
          <ng-template matStepLabel>Step two</ng-template>
          <p>Content for step two.</p>
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step three</ng-template>
          <p>Content for step three.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule],
})
export class StepperOptionalStep {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step [editable]="false">
          <ng-template matStepLabel>Step one</ng-template>
          <p>Content for step one.</p>
          <div>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step [editable]="false">
          <ng-template matStepLabel>Step two</ng-template>
          <p>Content for step two.</p>
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step three</ng-template>
          <p>Content for step three.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule],
})
export class StepperEditableFalse {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step>
          <ng-template matStepLabel>Step one (editable)</ng-template>
          <p>Content for step one.</p>
          <div>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step [editable]="false">
          <ng-template matStepLabel>Step two (not editable)</ng-template>
          <p>Content for step two.</p>
          <div>
            <button matStepperPrevious>Back</button>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step three</ng-template>
          <p>Content for step three.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule],
})
export class StepperCompletedStepIcons {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step [label]="'Step one'">
          <p>Content for step one.</p>
          <div>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel><strong>Step two</strong> (custom)</ng-template>
          <p>Content for step two.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule],
})
export class StepperCustomLabel {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper [labelPosition]="'bottom'" style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step>
          <ng-template matStepLabel>Step one</ng-template>
          <p>Content for step one.</p>
          <div>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step [optional]="true">
          <ng-template matStepLabel>Step two</ng-template>
          <p>Content for step two.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule],
})
export class StepperLabelPositionBottom {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper [headerPosition]="'bottom'" style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step>
          <ng-template matStepLabel>Step one</ng-template>
          <p>Content for step one.</p>
          <div>
            <button matStepperNext>Next</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step two</ng-template>
          <p>Content for step two.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule],
})
export class StepperHeaderPositionBottom {
  selected = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper [selectedIndex]="2" style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step>
          <ng-template matStepLabel>Step one</ng-template>
          <p>Content for step one.</p>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step two</ng-template>
          <p>Content for step two.</p>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step three</ng-template>
          <p>Content for step three.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step four</ng-template>
          <p>Content for step four.</p>
          <div>
            <button matStepperPrevious>Back</button>
          </div>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule],
})
export class StepperSelectedIndexInitial {
  selected = 2;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-stepper style="width: 480px" (selectedIndexChange)="selected = $event">
        <mat-step [stepControl]="nameCtrl" [errorMessage]="'Name is required.'">
          <ng-template matStepLabel>Fill out your name</ng-template>
          <input [formControl]="nameCtrl" placeholder="Name">
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Step two</ng-template>
          <p>Content for step two.</p>
        </mat-step>
      </mat-stepper>
      <p>Selected index: {{ selected }}</p>
    </div>
  `,
  imports: [MatStepperModule, ReactiveFormsModule],
  providers: [SHOW_ERROR],
})
export class StepperErrorState {
  nameCtrl = new FormControl('', Validators.required);
  selected = 0;
}

export const STEPPER_SCENARIOS: Record<string, Type<unknown>> = {
  'horizontal-basic': StepperHorizontalBasic,
  'vertical-basic': StepperVerticalBasic,
  'linear-required': StepperLinearRequired,
  'optional-step': StepperOptionalStep,
  'editable-false': StepperEditableFalse,
  'completed-step-icons': StepperCompletedStepIcons,
  'custom-label': StepperCustomLabel,
  'label-position-bottom': StepperLabelPositionBottom,
  'header-position-bottom': StepperHeaderPositionBottom,
  'selected-index-initial': StepperSelectedIndexInitial,
  'error-state': StepperErrorState,
};
