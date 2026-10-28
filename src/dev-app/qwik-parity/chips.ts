import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Component, Type} from '@angular/core';
import {MatChipListboxChange, MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-chips/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings. Icon-like content
// (avatars, trailing icons, remove/edit glyphs) is written as plain text/spans, never
// `<mat-icon>` — qwik-material's icon component is out of scope for this port; only the chip
// DOM contract itself (the host classes/attributes/ng-content slots that a real `<mat-icon>`
// or custom glyph would plug into) is being ported here.
//
// See the parity spec's header comment for the full per-scenario DOM contract: chip ids, the
// grid/row/gridcell vs. listbox/option role split, `mdc-evolution-chip__action--primary`
// action classes, the lazy `MatRippleLoader` attribute/span contract (shared with
// qwik-material/button — see its SYNC.md), the `cdk-focused`/`cdk-*-focused` classes that
// `FocusMonitor` adds directly to a chip's host on focus (chips are one of the few ported
// components that use `FocusMonitor` instead of relying on `:focus`/`:focus-visible` alone),
// and exactly which chip receives focus after a removal.

@Component({
  template: `
    <div data-parity-root>
      <mat-chip-set aria-label="Fruit selection">
        <mat-chip>Apple</mat-chip>
        <mat-chip [highlighted]="true">Banana</mat-chip>
        <mat-chip [disabled]="true">Cherry</mat-chip>
      </mat-chip-set>
    </div>
  `,
  imports: [MatChipsModule],
})
export class ChipsBasic {}

@Component({
  template: `
    <div data-parity-root>
      <mat-chip-set aria-label="Contact selection">
        <mat-chip>
          <span matChipAvatar>K</span>
          Kara
          <button matChipRemove aria-label="Remove Kara">×</button>
        </mat-chip>
        <mat-chip>
          Jeremy
          <span matChipTrailingIcon>★</span>
        </mat-chip>
      </mat-chip-set>
    </div>
  `,
  imports: [MatChipsModule],
})
export class ChipsAvatarTrailingIcon {}

@Component({
  template: `
    <div data-parity-root>
      <mat-chip-set aria-label="Removable fruit selection">
        @for (fruit of fruits; track fruit) {
          <mat-chip (removed)="remove(fruit)">
            {{ fruit }}
            <button matChipRemove [attr.aria-label]="'Remove ' + fruit">×</button>
          </mat-chip>
        }
      </mat-chip-set>
      <p>Chips: {{ fruits.join(', ') || '(none)' }}</p>
    </div>
  `,
  imports: [MatChipsModule],
})
export class ChipsRemovable {
  fruits = ['One', 'Two', 'Three'];

  remove(fruit: string) {
    const index = this.fruits.indexOf(fruit);
    if (index >= 0) {
      this.fruits.splice(index, 1);
    }
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-chip-listbox aria-label="Shirt size" (change)="onChange($event)">
        <mat-chip-option [value]="'xs'">Extra Small</mat-chip-option>
        <mat-chip-option [value]="'s'">Small</mat-chip-option>
        <mat-chip-option [value]="'m'" [disabled]="true">Medium</mat-chip-option>
        <mat-chip-option [value]="'l'">Large</mat-chip-option>
      </mat-chip-listbox>
      <p>Selected: {{ size ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatChipsModule],
})
export class ChipsListboxSingle {
  size: string | undefined;

  onChange(event: MatChipListboxChange) {
    this.size = event.value;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-chip-listbox [multiple]="true" aria-label="Amenities" (change)="onChange($event)">
        <mat-chip-option [value]="'wifi'" [selected]="true">Wifi</mat-chip-option>
        <mat-chip-option [value]="'parking'">Parking</mat-chip-option>
        <mat-chip-option [value]="'pool'" [selected]="true">Pool</mat-chip-option>
        <mat-chip-option [value]="'gym'">Gym</mat-chip-option>
      </mat-chip-listbox>
      <p>Selected: {{ amenities.join(', ') || '(none)' }}</p>
    </div>
  `,
  imports: [MatChipsModule],
})
export class ChipsListboxMultiple {
  amenities: string[] = ['wifi', 'pool'];

  onChange(event: MatChipListboxChange) {
    this.amenities = event.value;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-chip-listbox [hideSingleSelectionIndicator]="true" aria-label="Accent color" (change)="onChange($event)">
        <mat-chip-option [value]="'none'">None</mat-chip-option>
        <mat-chip-option [value]="'primary'">Primary</mat-chip-option>
        <mat-chip-option [value]="'accent'">Accent</mat-chip-option>
      </mat-chip-listbox>
      <p>Selected: {{ color ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatChipsModule],
})
export class ChipsListboxHideIndicator {
  color: string | undefined;

  onChange(event: MatChipListboxChange) {
    this.color = event.value;
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-chip-listbox [selectable]="false" aria-label="Read-only tags">
        <mat-chip-option>Tag A</mat-chip-option>
        <mat-chip-option>Tag B</mat-chip-option>
      </mat-chip-listbox>
    </div>
  `,
  imports: [MatChipsModule],
})
export class ChipsListboxNotSelectable {}

@Component({
  template: `
    <div data-parity-root>
      <mat-chip-set aria-label="Color variants">
        <mat-chip>Default</mat-chip>
        <mat-chip [color]="'primary'">Primary</mat-chip>
        <mat-chip [color]="'accent'">Accent</mat-chip>
        <mat-chip [color]="'warn'">Warn</mat-chip>
      </mat-chip-set>
    </div>
  `,
  imports: [MatChipsModule],
})
export class ChipsColors {}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field [appearance]="'outline'" style="width: 300px">
        <mat-label>Fruits</mat-label>
        <mat-chip-grid #grid aria-label="Enter fruits">
          @for (fruit of fruits; track fruit) {
            <mat-chip-row (removed)="remove(fruit)">
              {{ fruit }}
              <button matChipRemove [attr.aria-label]="'Remove ' + fruit">×</button>
            </mat-chip-row>
          }
          <input
            placeholder="New fruit..."
            [matChipInputFor]="grid"
            [matChipInputSeparatorKeyCodes]="separatorKeys"
            (matChipInputTokenEnd)="add($event)" />
        </mat-chip-grid>
      </mat-form-field>
      <p>Chips: {{ fruits.join(', ') || '(none)' }}</p>
    </div>
  `,
  imports: [MatChipsModule, MatFormFieldModule],
})
export class ChipsGridInput {
  readonly separatorKeys = [ENTER, COMMA];
  fruits = ['Lemon', 'Lime'];

  add(event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value) {
      this.fruits.push(value);
    }
    event.chipInput!.clear();
  }

  remove(fruit: string) {
    const index = this.fruits.indexOf(fruit);
    if (index >= 0) {
      this.fruits.splice(index, 1);
    }
  }
}

@Component({
  template: `
    <div data-parity-root>
      <mat-form-field [appearance]="'outline'" style="width: 300px">
        <mat-label>Fruits</mat-label>
        <mat-chip-grid #grid [disabled]="true" aria-label="Enter fruits (disabled)">
          <mat-chip-row>
            Lemon
            <button matChipRemove aria-label="Remove Lemon">×</button>
          </mat-chip-row>
          <mat-chip-row>
            Lime
            <button matChipRemove aria-label="Remove Lime">×</button>
          </mat-chip-row>
          <input placeholder="New fruit..." [matChipInputFor]="grid" />
        </mat-chip-grid>
      </mat-form-field>
    </div>
  `,
  imports: [MatChipsModule, MatFormFieldModule],
})
export class ChipsGridDisabled {}

@Component({
  template: `
    <div data-parity-root>
      <mat-chip-listbox aria-label="Priority" [aria-orientation]="'vertical'">
        <mat-chip-option [value]="'low'">Low</mat-chip-option>
        <mat-chip-option [value]="'medium'">Medium</mat-chip-option>
        <mat-chip-option [value]="'high'" [selected]="true">High</mat-chip-option>
      </mat-chip-listbox>
    </div>
  `,
  imports: [MatChipsModule],
})
export class ChipsListboxVertical {}

export const CHIPS_SCENARIOS: Record<string, Type<unknown>> = {
  'basic': ChipsBasic,
  'avatar-trailing-icon': ChipsAvatarTrailingIcon,
  'removable': ChipsRemovable,
  'listbox-single': ChipsListboxSingle,
  'listbox-multiple': ChipsListboxMultiple,
  'listbox-hide-indicator': ChipsListboxHideIndicator,
  'listbox-not-selectable': ChipsListboxNotSelectable,
  'colors': ChipsColors,
  'grid-input': ChipsGridInput,
  'grid-disabled': ChipsGridDisabled,
  'listbox-vertical': ChipsListboxVertical,
};
