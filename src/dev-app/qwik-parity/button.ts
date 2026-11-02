import {Component} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-button/<name>/index.tsx.
// Angular buttons are attribute directives (matButton/matFab/matMiniFab/matIconButton), so the
// selector attribute itself is always a static HTML attribute (there is no bindable property
// that only selects the component without also appearing in the DOM). Appearance ("filled",
// "outlined", etc.) and other @Input-backed props (color, disabled, disabledInteractive,
// extended) are written the same idiomatic static-attribute way real Angular apps use them
// (see src/dev-app/button/button-demo.html and src/material/button/button.md); Angular echoes
// each of those onto the host element as a literal attribute in addition to using it as the
// initial input value, which Qwik's MatButton/MatFabButton/MatIconButton/MatMiniFabButton do not
// currently render as DOM attributes. See this component's SYNC note / PR description for the
// full list of attributes affected.

@Component({
  template: `
    <div data-parity-root>
      <button [matButton]="'filled'" [color]="'accent'">Accent</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonColorAccent {}

@Component({
  template: `
    <div data-parity-root>
      <button [matButton]="'filled'" [color]="'primary'">Primary</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonColorPrimary {}

@Component({
  template: `
    <div data-parity-root>
      <button [matButton]="'filled'" [color]="'warn'">Warn</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonColorWarn {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton [disabledInteractive]="true">Interactive only</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonDisabledInteractiveOnly {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton [disabled]="true" [disabledInteractive]="true">Disabled interactive</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonDisabledInteractive {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton [disabled]="true">Disabled button</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonDisabled {}

@Component({
  template: `
    <div data-parity-root>
      <button [matButton]="'elevated'">Elevated button</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonElevated {}

@Component({
  template: `
    <div data-parity-root>
      <button matFab [extended]="true">+ New</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonFabExtended {}

@Component({
  template: `
    <div data-parity-root>
      <button matFab aria-label="Add">+</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonFab {}

@Component({
  template: `
    <div data-parity-root>
      <a [matButton]="'filled'" href="/about">Filled link</a>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonFilledLink {}

@Component({
  template: `
    <div data-parity-root>
      <button [matButton]="'filled'">Filled button</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonFilled {}

@Component({
  template: `
    <div data-parity-root>
      <button matIconButton aria-label="Menu">≡</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonIconButton {}

@Component({
  template: `
    <div data-parity-root>
      <button matMiniFab aria-label="Add">+</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonMiniFab {}

@Component({
  template: `
    <div data-parity-root>
      <button [matButton]="'outlined'">Outlined button</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonOutlined {}

@Component({
  template: `
    <div data-parity-root>
      <a matButton href="/about">Text link</a>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonTextLink {}

@Component({
  template: `
    <div data-parity-root>
      <button matButton>Text button</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonText {}

@Component({
  template: `
    <div data-parity-root>
      <button [matButton]="'tonal'">Tonal button</button>
    </div>
  `,
  imports: [MatButtonModule],
})
export class ButtonTonal {}

export const BUTTON_SCENARIOS = {
  'color-accent': ButtonColorAccent,
  'color-primary': ButtonColorPrimary,
  'color-warn': ButtonColorWarn,
  'disabled-interactive-only': ButtonDisabledInteractiveOnly,
  'disabled-interactive': ButtonDisabledInteractive,
  'disabled': ButtonDisabled,
  'elevated': ButtonElevated,
  'fab-extended': ButtonFabExtended,
  'fab': ButtonFab,
  'filled-link': ButtonFilledLink,
  'filled': ButtonFilled,
  'icon-button': ButtonIconButton,
  'mini-fab': ButtonMiniFab,
  'outlined': ButtonOutlined,
  'text-link': ButtonTextLink,
  'text': ButtonText,
  'tonal': ButtonTonal,
};
