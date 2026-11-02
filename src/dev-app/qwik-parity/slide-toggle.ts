import {Component, Type} from '@angular/core';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-slide-toggle/.
// See button-toggle.ts for the general approach. Inputs use [prop] bindings. `checked` is
// kept as a plain component field wired through [checked]/(change) (no ngModel/forms) so a
// click can be observed round-tripping through the DOM — see material-slide-toggle/angular-parity.spec.ts
// for exactly what each scenario renders and which steps run against it.

@Component({
  template: `
    <div data-parity-root>
      <mat-slide-toggle [checked]="checked" (change)="checked = $event.checked">
        Subscribe to newsletter
      </mat-slide-toggle>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleBasic {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slide-toggle [checked]="checked" (change)="checked = $event.checked">
        Enable notifications
      </mat-slide-toggle>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleChecked {
  checked = true;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slide-toggle [disabled]="true" [checked]="checked" (change)="checked = $event.checked">
        Disabled toggle
      </mat-slide-toggle>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleDisabled {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slide-toggle [disabled]="true" [checked]="checked" (change)="checked = $event.checked">
        Disabled toggle (checked)
      </mat-slide-toggle>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleDisabledChecked {
  checked = true;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slide-toggle
        [disabled]="true"
        [disabledInteractive]="true"
        [checked]="checked"
        (change)="checked = $event.checked">
        Disabled interactive toggle
      </mat-slide-toggle>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleDisabledInteractive {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slide-toggle [hideIcon]="true" [checked]="checked" (change)="checked = $event.checked">
        No icon
      </mat-slide-toggle>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleHideIcon {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slide-toggle
        [labelPosition]="'before'"
        [checked]="checked"
        (change)="checked = $event.checked">
        Label before
      </mat-slide-toggle>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleLabelBefore {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slide-toggle
        [aria-label]="'Airplane mode'"
        [checked]="checked"
        (change)="checked = $event.checked" />
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleNoLabel {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <form>
        <mat-slide-toggle
          [required]="true"
          [name]="'terms'"
          [checked]="checked"
          (change)="checked = $event.checked">
          Accept terms
        </mat-slide-toggle>
      </form>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleRequiredInForm {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slide-toggle
        [color]="'primary'"
        [checked]="checked"
        (change)="checked = $event.checked">
        Primary color toggle
      </mat-slide-toggle>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatSlideToggleModule],
})
export class SlideToggleColorPrimary {
  checked = false;
}

export const SLIDE_TOGGLE_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': SlideToggleBasic,
  'checked': SlideToggleChecked,
  'disabled': SlideToggleDisabled,
  'disabled-checked': SlideToggleDisabledChecked,
  'disabled-interactive': SlideToggleDisabledInteractive,
  'hide-icon': SlideToggleHideIcon,
  'label-before': SlideToggleLabelBefore,
  'no-label': SlideToggleNoLabel,
  'required-in-form': SlideToggleRequiredInForm,
  'color-primary': SlideToggleColorPrimary,
};
