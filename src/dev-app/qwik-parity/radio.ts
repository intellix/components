import {Component, Type} from '@angular/core';
import {MatRadioModule} from '@angular/material/radio';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-radio/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static
// attribute input (value="x") is also echoed onto the host element by Angular, which a
// Qwik component cannot distinguish from a prop. `mat-radio-group` has no `valueChange`
// output (only a `change: EventEmitter<MatRadioChange>`), so selection state is wired with
// `[value]` + `(change)="x = $event.value"` rather than `[(value)]` two-way binding.

@Component({
  template: `
    <div data-parity-root>
      <mat-radio-group [value]="season" (change)="season = $event.value" aria-label="Favorite season">
        <mat-radio-button [value]="'winter'">Winter</mat-radio-button>
        <mat-radio-button [value]="'spring'">Spring</mat-radio-button>
        <mat-radio-button [value]="'summer'">Summer</mat-radio-button>
      </mat-radio-group>
      <p>Selected: {{ season ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioBasic {
  season: string | undefined;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-radio-group
        [value]="season"
        (change)="season = $event.value"
        aria-label="Favorite season (preselected)">
        <mat-radio-button [value]="'winter'">Winter</mat-radio-button>
        <mat-radio-button [value]="'spring'">Spring</mat-radio-button>
        <mat-radio-button [value]="'summer'">Summer</mat-radio-button>
      </mat-radio-group>
      <p>Selected: {{ season }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioPreselected {
  season = 'spring';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-radio-button [name]="'flavor'" [value]="'vanilla'" [checked]="true" (change)="selected = $event.value"
        >Vanilla</mat-radio-button
      >
      <mat-radio-button [name]="'flavor'" [value]="'chocolate'" (change)="selected = $event.value"
        >Chocolate</mat-radio-button
      >
      <p>Selected: {{ selected ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioStandalone {
  selected: string | undefined = 'vanilla';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-radio-group
        [value]="color"
        (change)="color = $event.value"
        [color]="'primary'"
        aria-label="Color variants">
        <mat-radio-button [value]="'a'">Default (group primary)</mat-radio-button>
        <mat-radio-button [value]="'b'" [color]="'warn'">Warn override</mat-radio-button>
        <mat-radio-button [value]="'c'" [color]="'accent'">Accent override</mat-radio-button>
      </mat-radio-group>
      <p>Selected: {{ color ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioColor {
  color: string | undefined;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-radio-group
        [value]="value"
        (change)="value = $event.value"
        [labelPosition]="'before'"
        aria-label="Label position before">
        <mat-radio-button [value]="'a'">Option A</mat-radio-button>
        <mat-radio-button [value]="'b'">Option B</mat-radio-button>
      </mat-radio-group>
      <p>Selected: {{ value ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioLabelPosition {
  value: string | undefined;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-radio-group
        [value]="value"
        (change)="value = $event.value"
        [disabled]="true"
        aria-label="Disabled group">
        <mat-radio-button [value]="'a'">Option A</mat-radio-button>
        <mat-radio-button [value]="'b'">Option B</mat-radio-button>
      </mat-radio-group>
      <p>Selected: {{ value ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioDisabledGroup {
  value: string | undefined = 'a';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-radio-group [value]="value" (change)="value = $event.value" aria-label="One button disabled">
        <mat-radio-button [value]="'a'">Option A</mat-radio-button>
        <mat-radio-button [value]="'b'" [disabled]="true">Option B</mat-radio-button>
        <mat-radio-button [value]="'c'">Option C</mat-radio-button>
      </mat-radio-group>
      <p>Selected: {{ value ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioDisabledIndividual {
  value: string | undefined;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-radio-group
        [value]="value"
        (change)="value = $event.value"
        [disabled]="true"
        [disabledInteractive]="true"
        aria-label="Disabled interactive group">
        <mat-radio-button [value]="'a'">Option A</mat-radio-button>
        <mat-radio-button [value]="'b'">Option B</mat-radio-button>
      </mat-radio-group>
      <p>Selected: {{ value ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioDisabledInteractive {
  value: string | undefined;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-radio-group
        [value]="value"
        (change)="value = $event.value"
        [required]="true"
        aria-label="Required group">
        <mat-radio-button [value]="'a'">Option A</mat-radio-button>
        <mat-radio-button [value]="'b'">Option B</mat-radio-button>
      </mat-radio-group>
      <p>Selected: {{ value ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioRequired {
  value: string | undefined;
}

@Component({
  template: `
    <div data-parity-root>
      <form>
        <mat-radio-group
          [name]="'season'"
          [value]="value"
          (change)="value = $event.value"
          aria-label="Named group">
          <mat-radio-button [value]="'a'">Option A</mat-radio-button>
          <mat-radio-button [value]="'b'">Option B</mat-radio-button>
        </mat-radio-group>
      </form>
      <p>Selected: {{ value ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioNamedGroup {
  value: string | undefined = 'a';
}

@Component({
  template: `
    <div data-parity-root>
      <span id="radio-aria-attrs-label">Baby banana</span>
      <span id="radio-aria-attrs-desc">A smaller banana</span>
      <mat-radio-button [name]="'fruit-1'" [value]="'banana'" [aria-label]="'Banana'"></mat-radio-button>
      <mat-radio-button
        [name]="'fruit-2'"
        [value]="'kiwi'"
        [aria-labelledby]="'radio-aria-attrs-label'"
        [aria-describedby]="'radio-aria-attrs-desc'"></mat-radio-button>
    </div>
  `,
  imports: [MatRadioModule],
})
export class RadioAriaAttrs {}

export const RADIO_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': RadioBasic,
  'preselected': RadioPreselected,
  'standalone': RadioStandalone,
  'color': RadioColor,
  'label-position': RadioLabelPosition,
  'disabled-group': RadioDisabledGroup,
  'disabled-individual': RadioDisabledIndividual,
  'disabled-interactive': RadioDisabledInteractive,
  'required': RadioRequired,
  'named-group': RadioNamedGroup,
  'aria-attrs': RadioAriaAttrs,
};
