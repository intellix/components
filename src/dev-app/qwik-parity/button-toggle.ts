import {Component} from '@angular/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-button-toggle/<name>/index.tsx.
// Only the subtree inside [data-parity-root] is compared. Inputs use [prop]
// bindings: a static attribute input (value="x") is also echoed onto the host
// element by Angular, which a Qwik component cannot distinguish from a prop.

@Component({
  template: `
    <div data-parity-root>
      <mat-button-toggle-group [(value)]="style" aria-label="Text style">
        <mat-button-toggle [value]="'bold'">Bold</mat-button-toggle>
        <mat-button-toggle [value]="'italic'">Italic</mat-button-toggle>
        <mat-button-toggle [value]="'underline'">Underline</mat-button-toggle>
      </mat-button-toggle-group>
      <p>Selected: {{ style ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatButtonToggleModule],
})
export class ButtonToggleBasic {
  style: string | undefined;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-button-toggle-group [multiple]="true" [(value)]="perms" aria-label="Permissions">
        <mat-button-toggle [value]="'read'">Read</mat-button-toggle>
        <mat-button-toggle [value]="'write'">Write</mat-button-toggle>
        <mat-button-toggle [value]="'admin'">Admin</mat-button-toggle>
      </mat-button-toggle-group>
      <p>Selected: {{ perms.join(', ') || '(none)' }}</p>
    </div>
  `,
  imports: [MatButtonToggleModule],
})
export class ButtonToggleMulti {
  perms: string[] = [];
}

@Component({
  template: `
    <div data-parity-root>
      <mat-button-toggle-group [(value)]="style" aria-label="Text style (preselected italic)">
        <mat-button-toggle [value]="'bold'">Bold</mat-button-toggle>
        <mat-button-toggle [value]="'italic'">Italic</mat-button-toggle>
        <mat-button-toggle [value]="'underline'">Underline</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  `,
  imports: [MatButtonToggleModule],
})
export class ButtonTogglePreselected {
  style: string | undefined = 'italic';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-button-toggle [value]="'favorite'" [aria-label]="'Favorite'">★ Favorite</mat-button-toggle>
    </div>
  `,
  imports: [MatButtonToggleModule],
})
export class ButtonToggleStandalone {}

@Component({
  template: `
    <div data-parity-root>
      <mat-button-toggle-group
        [(value)]="style"
        [disabled]="true"
        aria-label="Text style (disabled group)">
        <mat-button-toggle [value]="'bold'">Bold</mat-button-toggle>
        <mat-button-toggle [value]="'italic'">Italic</mat-button-toggle>
        <mat-button-toggle [value]="'underline'">Underline</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
  `,
  imports: [MatButtonToggleModule],
})
export class ButtonToggleDisabledGroup {
  style: string | undefined = 'bold';
}

@Component({
  template: `
    <div data-parity-root>
      <mat-button-toggle-group [(value)]="style" aria-label="Text style (middle disabled)">
        <mat-button-toggle [value]="'bold'">Bold</mat-button-toggle>
        <mat-button-toggle [value]="'italic'" [disabled]="true">Italic</mat-button-toggle>
        <mat-button-toggle [value]="'underline'">Underline</mat-button-toggle>
      </mat-button-toggle-group>
      <p>Selected: {{ style ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatButtonToggleModule],
})
export class ButtonToggleDisabledIndividual {
  style: string | undefined;
}

@Component({
  template: `
    <div data-parity-root>
      <form>
        <mat-button-toggle-group
          [name]="'text-style'"
          [(value)]="style"
          aria-label="Text style (form-name)">
          <mat-button-toggle [value]="'bold'">Bold</mat-button-toggle>
          <mat-button-toggle [value]="'italic'">Italic</mat-button-toggle>
          <mat-button-toggle [value]="'underline'">Underline</mat-button-toggle>
        </mat-button-toggle-group>
      </form>
    </div>
  `,
  imports: [MatButtonToggleModule],
})
export class ButtonToggleFormName {
  style: string | undefined = 'bold';
}

export const BUTTON_TOGGLE_SCENARIOS = {
  'basic': ButtonToggleBasic,
  'multi': ButtonToggleMulti,
  'preselected': ButtonTogglePreselected,
  'standalone': ButtonToggleStandalone,
  'disabled-group': ButtonToggleDisabledGroup,
  'disabled-individual': ButtonToggleDisabledIndividual,
  'form-name': ButtonToggleFormName,
};
