import {component$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';
import {NativeSelectControl} from './native-select-control';

/**
 * Port of material.angular.dev's `select-overview` docs example
 * (src/components-examples/material/select/select-overview/). Two independent cards: a plain,
 * uncontrolled `<mat-select>` (no `[(ngModel)]`/`[value]` binding — the real template never reads
 * a selection back out, so this doesn't either) and a native `<select matNativeControl required>`
 * — see `./native-select-control.tsx` for why the second card is a small local control rather
 * than a `qwik-material/input` feature.
 *
 * The real template's `<mat-option [value]="food.value">` is a BOUND property (no static-
 * attribute echo on Angular's side — confirmed live), unlike this port's own authored mirror
 * scenarios (`select.ts`), which always write a literal, unbound `value="apple"` specifically to
 * get `MatOption`'s `echoValueAttr` default (`true`) to match. This example needs the opposite:
 * `echoValueAttr: false` on every option def suppresses the attribute so the open panel matches
 * the real, bound-property Angular output exactly.
 */
export default component$(() => (
  <>
    <div data-parity-root>
      <select-overview-example>
        <h4>Basic mat-select</h4>
        <MatFormField
          label={<MatLabel>Favorite food</MatLabel>}
          control={
            <MatSelect
              controlType="mat-select"
              options={[
                {value: 'steak-0', label: 'Steak', echoValueAttr: false},
                {value: 'pizza-1', label: 'Pizza', echoValueAttr: false},
                {value: 'tacos-2', label: 'Tacos', echoValueAttr: false},
              ]}
            />
          }
        />

        <h4>Basic native select</h4>
        <MatFormField
          label={<MatLabel>Cars</MatLabel>}
          control={<NativeSelectControl value="volvo" required controlType="mat-native-select" />}
        />
      </select-overview-example>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
