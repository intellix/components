import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';

/**
 * Port of material.angular.dev's `select-multiple` docs example
 * (src/components-examples/material/select/select-multiple/) — `toppings = new
 * FormControl('')` (no validators) bound to a `[multiple]` select; no preselection (unlike this
 * port's own `mat-select/multiple` mirror scenario, which starts with 2 preselected toppings).
 */
export default component$(() => {
  const value = useSignal<string[]>([]);

  return (
    <select-multiple-example>
      <MatFormField
        label={<MatLabel>Toppings</MatLabel>}
        touched={false}
        dirty={false}
        invalid={false}
        control={
          <MatSelect
            controlType="mat-select"
            multiple
            formBound
            touched={false}
            dirty={false}
            invalid={false}
            value={value.value}
            onValueChange$={v => (value.value = v as string[])}
            options={[
              {value: 'Extra cheese', label: 'Extra cheese'},
              {value: 'Mushroom', label: 'Mushroom'},
              {value: 'Onion', label: 'Onion'},
              {value: 'Pepperoni', label: 'Pepperoni'},
              {value: 'Sausage', label: 'Sausage'},
              {value: 'Tomato', label: 'Tomato'},
            ]}
          />
        }
      />
    </select-multiple-example>
  );
});
