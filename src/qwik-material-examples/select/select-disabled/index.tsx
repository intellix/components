import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';
import {NativeSelectControl} from '../_lib/native-select-control';

/**
 * Port of material.angular.dev's `select-disabled` docs example
 * (src/components-examples/material/select/select-disabled/) — a checkbox drives `[disabled]` on
 * both a `<mat-select>` and a native `<select matNativeControl>`. Neither select is itself
 * `ngModel`/`formControl`-bound (only `[disabled]` reads a derived value), so neither gets
 * `ng-*` classes — only the CHECKBOX is (`[formControl]="disableSelect"`). `qwik-material/
 * checkbox`'s `MatCheckbox` has no `formBound` concept (checkbox isn't one of this batch's
 * components, and no other scenario needs it), so the fixed, never-touched/dirty resulting
 * classes (`ng-untouched ng-pristine ng-valid` — no validators, so always valid) are added as
 * plain literal extra classes here, same "hardcode the one fixed resulting DOM state" approach
 * `select-form`'s `<form>` wrapper uses.
 */
export default component$(() => {
  const disabled = useSignal(false);
  const value = useSignal('');

  return (
    <select-disabled-example>
      <p>
        <MatCheckbox
          class="ng-untouched ng-pristine ng-valid"
          checked={disabled.value}
          onChange$={e => (disabled.value = e.checked)}
        >
          Disable select
        </MatCheckbox>
      </p>

      <h4>mat-select</h4>
      <MatFormField
        label={<MatLabel>Choose an option</MatLabel>}
        control={
          <MatSelect
            controlType="mat-select"
            disabled={disabled.value}
            value={value.value}
            onValueChange$={v => (value.value = v as string)}
            options={[
              {value: 'option1', label: 'Option 1'},
              {value: 'option2', label: 'Option 2 (disabled)', disabled: true},
              {value: 'option3', label: 'Option 3'},
            ]}
          />
        }
      />

      <h4>native html select</h4>
      <MatFormField
        label={<MatLabel>Choose an option</MatLabel>}
        control={
          <NativeSelectControl controlType="mat-native-select" disabled={disabled.value} value="">
            <option value="" selected></option>
            <option value="volvo">Volvo</option>
            <option value="saab" disabled>
              Saab
            </option>
            <option value="mercedes">Mercedes</option>
            <option value="audi">Audi</option>
          </NativeSelectControl>
        }
      />
    </select-disabled-example>
  );
});
