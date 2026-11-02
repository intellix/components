import {Component, Type} from '@angular/core';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {AnimationsConfig, MATERIAL_ANIMATIONS} from '@angular/material/core';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-checkbox/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static attribute
// input is also echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop.
//
// Every scenario EXCEPT `animations-disabled` runs with Angular's default animation
// behavior (animations enabled) — same as a real app. That means clicking/Space-toggling a
// checkbox genuinely adds a CSS transition class to the native `<input>` (e.g.
// `mdc-checkbox--anim-unchecked-checked`), which MDC's checkmark-draw animation CSS keys off
// of, removed again ~1 second later via `_ngZone.runOutsideAngular(() => setTimeout(...,
// 1000))` (see `MatCheckbox._transitionCheckState` in src/material/checkbox/checkbox.ts).
// The Qwik port must reproduce this class (and its lifetime) for true parity; see the spec's
// header comment for the exact class observed per scenario/step and how the spec waits for
// it to clear before each DOM comparison.
//
// `animations-disabled` is a dedicated copy of `basic` that provides `MATERIAL_ANIMATIONS`
// with `animationsDisabled: true`, pinning the *other* path: `_animationsDisabled()` returns
// `true`, so the host `<mat-checkbox>` carries `_mat-animation-noopable` and no transition
// class is ever added (`_getAnimationClassForCheckStateTransition` short-circuits to `''`).
const NO_ANIMATIONS = {
  provide: MATERIAL_ANIMATIONS,
  useValue: {animationsDisabled: true} as AnimationsConfig,
};

@Component({
  template: `
    <div data-parity-root>
      <mat-checkbox [checked]="checked" (change)="checked = $event.checked">
        Subscribe to newsletter
      </mat-checkbox>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxBasic {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-checkbox [checked]="checked" (change)="checked = $event.checked">
        Subscribe to newsletter
      </mat-checkbox>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatCheckboxModule],
  providers: [NO_ANIMATIONS],
})
export class CheckboxAnimationsDisabled {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-checkbox [checked]="checked" (change)="checked = $event.checked">
        Accept terms and conditions
      </mat-checkbox>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxChecked {
  checked = true;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-checkbox [checked]="checked" [indeterminate]="indeterminate" (change)="onChange($event.checked)">
        Select all
      </mat-checkbox>
      <p>Checked: {{ checked }}</p>
      <p>Indeterminate: {{ indeterminate }}</p>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxIndeterminate {
  checked = false;
  indeterminate = true;

  onChange(checked: boolean) {
    this.checked = checked;
    this.indeterminate = false;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <div>
        <mat-checkbox [disabled]="true">Disabled unchecked</mat-checkbox>
      </div>
      <div>
        <mat-checkbox [disabled]="true" [checked]="true">Disabled checked</mat-checkbox>
      </div>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxDisabled {}

@Component({
  template: `
    <div data-parity-root>
      <mat-checkbox
        [disabled]="true"
        [disabledInteractive]="true"
        [checked]="checked"
        (change)="checked = $event.checked">
        Disabled but interactive
      </mat-checkbox>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxDisabledInteractive {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-checkbox [labelPosition]="'before'" [checked]="checked" (change)="checked = $event.checked">
        Label before checkbox
      </mat-checkbox>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxLabelBefore {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <form>
        <mat-checkbox [required]="true" [checked]="checked" (change)="checked = $event.checked">
          I agree to the terms (required)
        </mat-checkbox>
      </form>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxRequired {
  checked = false;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-checkbox [checked]="true">Default</mat-checkbox>
      <mat-checkbox [color]="'primary'" [checked]="checkedPrimary" (change)="checkedPrimary = $event.checked">
        Primary
      </mat-checkbox>
      <mat-checkbox [color]="'accent'" [checked]="true">Accent</mat-checkbox>
      <mat-checkbox [color]="'warn'" [checked]="true">Warn</mat-checkbox>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxColors {
  checkedPrimary = true;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-checkbox [aria-label]="'Enable notifications'"></mat-checkbox>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxAriaLabel {}

@Component({
  template: `
    <div data-parity-root>
      <label id="ext-label">External label text</label>
      <mat-checkbox [aria-labelledby]="'ext-label'"></mat-checkbox>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxAriaLabelledby {}

@Component({
  template: `
    <div data-parity-root>
      <mat-checkbox
        [aria-describedby]="'details-1'"
        [aria-expanded]="true"
        [aria-controls]="'details-1'"
        [aria-owns]="'details-1'">
        Show advanced options
      </mat-checkbox>
      <div id="details-1">Additional details shown when expanded.</div>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxAriaExtra {}

@Component({
  template: `
    <div data-parity-root>
      <form>
        <mat-checkbox [name]="'subscribe'" [value]="'yes'" [checked]="checked" (change)="checked = $event.checked">
          Subscribe (form checkbox)
        </mat-checkbox>
      </form>
      <p>Checked: {{ checked }}</p>
    </div>
  `,
  imports: [MatCheckboxModule],
})
export class CheckboxNameValueForm {
  checked = false;
}

export const CHECKBOX_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': CheckboxBasic,
  'animations-disabled': CheckboxAnimationsDisabled,
  'checked': CheckboxChecked,
  'indeterminate': CheckboxIndeterminate,
  'disabled': CheckboxDisabled,
  'disabled-interactive': CheckboxDisabledInteractive,
  'label-before': CheckboxLabelBefore,
  'required': CheckboxRequired,
  'colors': CheckboxColors,
  'aria-label': CheckboxAriaLabel,
  'aria-labelledby': CheckboxAriaLabelledby,
  'aria-extra': CheckboxAriaExtra,
  'name-value-form': CheckboxNameValueForm,
};
