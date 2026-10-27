import {Component, inject} from '@angular/core';
import {MatIconModule, MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-icon/<name>/index.tsx.
// Inputs use [prop] bindings (see button-toggle.ts) to avoid static-attribute echo
// onto the host. The svg-named/svg-literal scenarios register an icon with
// MatIconRegistry + DomSanitizer.bypassSecurityTrustHtml, mirroring the inline SVG
// literal content the Qwik route passes directly via `svgLiteral`.

@Component({
  template: `
    <div data-parity-root>
      <mat-icon aria-hidden="false" aria-label="Home">home</mat-icon>
    </div>
  `,
  imports: [MatIconModule],
})
export class IconAriaLabeled {}

@Component({
  template: `
    <div data-parity-root>
      <mat-icon>home</mat-icon>
    </div>
  `,
  imports: [MatIconModule],
})
export class IconBasic {}

@Component({
  template: `
    <div data-parity-root>
      <mat-icon [color]="'primary'">home</mat-icon>
      <mat-icon [color]="'accent'">home</mat-icon>
      <mat-icon [color]="'warn'">home</mat-icon>
    </div>
  `,
  imports: [MatIconModule],
})
export class IconColors {}

@Component({
  template: `
    <div data-parity-root>
      <mat-icon [fontIcon]="'home'"></mat-icon>
    </div>
  `,
  imports: [MatIconModule],
})
export class IconFontIcon {}

@Component({
  template: `
    <div data-parity-root>
      <mat-icon [fontSet]="'material-symbols-outlined'" [fontIcon]="'home'"></mat-icon>
    </div>
  `,
  imports: [MatIconModule],
})
export class IconFontSet {}

@Component({
  template: `
    <div data-parity-root>
      <mat-icon [inline]="true">home</mat-icon>
    </div>
  `,
  imports: [MatIconModule],
})
export class IconInline {}

const HOME_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3z"/></svg>`;

@Component({
  template: `
    <div data-parity-root>
      <mat-icon [svgIcon]="'home'"></mat-icon>
    </div>
  `,
  imports: [MatIconModule],
})
export class IconSvgLiteral {
  constructor() {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    iconRegistry.addSvgIconLiteral('home', sanitizer.bypassSecurityTrustHtml(HOME_SVG));
  }
}

const CAKE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6a2 2 0 100-4 2 2 0 000 4z"/></svg>`;

@Component({
  template: `
    <div data-parity-root>
      <mat-icon [svgIcon]="'social:cake'"></mat-icon>
    </div>
  `,
  imports: [MatIconModule],
})
export class IconSvgNamed {
  constructor() {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    iconRegistry.addSvgIconLiteralInNamespace(
      'social',
      'cake',
      sanitizer.bypassSecurityTrustHtml(CAKE_SVG),
    );
  }
}

export const ICON_SCENARIOS = {
  'aria-labeled': IconAriaLabeled,
  'basic': IconBasic,
  'colors': IconColors,
  'font-icon': IconFontIcon,
  'font-set': IconFontSet,
  'inline': IconInline,
  'svg-literal': IconSvgLiteral,
  'svg-named': IconSvgNamed,
};
