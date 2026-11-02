import {Component, Type} from '@angular/core';
import {MatSliderModule} from '@angular/material/slider';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-slider/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings — `value` uses the
// two-way `[(value)]` form (banana-in-box over the `value`/`valueChange` pair declared on
// `matSliderThumb`/`matSliderStartThumb`/`matSliderEndThumb`) so each scenario's `<p>` readout
// stays in sync after an interaction. A static attribute input is also echoed onto the host
// element by Angular, which a Qwik component cannot distinguish from a prop.
//
// `matSliderThumb`, `matSliderStartThumb` and `matSliderEndThumb` are directive SELECTORS
// (`input[matSliderThumb]`, `input[matSliderStartThumb], input[matSliderEndThumb]`), not
// `@Input`s — they only ever appear as bare attributes in a consumer's template (there is no
// bracket form). Same category as `matButton`/`mat-tab-link` elsewhere in this file set —
// report these three for `CONSUMER_SELECTOR_ATTRS` (not edited here).
//
// Every `<mat-slider>` below gets a fixed inline `style="width: …px"` (a plain DOM attribute,
// not a Material input) so the measured track width — and therefore every thumb/track-active
// transform and tick-mark position — is identical regardless of the surrounding dev-app chrome,
// which differs between the Angular and Qwik dev-apps. See the spec header comment for exact
// formulas and verified behaviors (ripple lifecycles, tick marks, value-indicator text,
// aria-valuetext, and the native range input's `value` ATTRIBUTE vs PROPERTY).

@Component({
  template: `
    <div data-parity-root>
      <mat-slider style="width: 300px">
        <input matSliderThumb [(value)]="value" />
      </mat-slider>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatSliderModule],
})
export class SliderBasic {
  value = 0;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slider style="width: 300px">
        <input matSliderThumb [(value)]="value" />
      </mat-slider>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatSliderModule],
})
export class SliderInitialValue {
  value = 30;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slider style="width: 300px" [min]="10" [max]="50" [step]="5">
        <input matSliderThumb [(value)]="value" />
      </mat-slider>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatSliderModule],
})
export class SliderMinMaxStep {
  value = 25;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slider style="width: 300px" [discrete]="true">
        <input matSliderThumb [(value)]="value" />
      </mat-slider>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatSliderModule],
})
export class SliderDiscrete {
  value = 40;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slider style="width: 300px" [showTickMarks]="true" [min]="0" [max]="100" [step]="20">
        <input matSliderThumb [(value)]="value" />
      </mat-slider>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatSliderModule],
})
export class SliderTickMarks {
  value = 40;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slider
        style="width: 300px"
        [discrete]="true"
        [displayWith]="formatLabel"
        [min]="0"
        [max]="100000"
        [step]="1000">
        <input matSliderThumb [(value)]="value" />
      </mat-slider>
      <p>Value: {{ value }}</p>
    </div>
  `,
  imports: [MatSliderModule],
})
export class SliderDisplayWith {
  value = 3000;

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }
    return `${value}`;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <div>
        <mat-slider style="width: 300px" [disabled]="true">
          <input matSliderThumb [value]="50" />
        </mat-slider>
      </div>
      <div>
        <mat-slider style="width: 300px" [disabled]="true">
          <input matSliderStartThumb [value]="30" />
          <input matSliderEndThumb [value]="70" />
        </mat-slider>
      </div>
    </div>
  `,
  imports: [MatSliderModule],
})
export class SliderDisabled {}

@Component({
  template: `
    <div data-parity-root>
      <mat-slider style="width: 300px">
        <input matSliderStartThumb [(value)]="start" />
        <input matSliderEndThumb [(value)]="end" />
      </mat-slider>
      <p>Value: {{ start }} : {{ end }}</p>
    </div>
  `,
  imports: [MatSliderModule],
})
export class SliderRange {
  start = 30;
  end = 70;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-slider style="width: 150px">
        <input matSliderThumb [(value)]="valueDefault" />
      </mat-slider>
      <mat-slider style="width: 150px" [color]="'primary'">
        <input matSliderThumb [(value)]="valuePrimary" />
      </mat-slider>
      <mat-slider style="width: 150px" [color]="'accent'">
        <input matSliderThumb [value]="50" />
      </mat-slider>
      <mat-slider style="width: 150px" [color]="'warn'">
        <input matSliderThumb [value]="50" />
      </mat-slider>
    </div>
  `,
  imports: [MatSliderModule],
})
export class SliderColors {
  valueDefault = 50;
  valuePrimary = 50;
}

export const SLIDER_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': SliderBasic,
  'initial-value': SliderInitialValue,
  'min-max-step': SliderMinMaxStep,
  'discrete': SliderDiscrete,
  'tick-marks': SliderTickMarks,
  'display-with': SliderDisplayWith,
  'disabled': SliderDisabled,
  'range': SliderRange,
  'colors': SliderColors,
};
