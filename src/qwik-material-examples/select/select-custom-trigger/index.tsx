import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';
import styles from './select-custom-trigger-example.css?inline';

/**
 * Port of material.angular.dev's `select-custom-trigger` docs example
 * (src/components-examples/material/select/select-custom-trigger/) — `toppings = new
 * FormControl('')` (no preselection, unlike this port's own `mat-select/custom-trigger` mirror
 * scenario) bound to a `[multiple]` select with a `<mat-select-trigger>` showing the first
 * selected topping plus a "(+N others)" count. `MatSelect` only renders `customTrigger` when
 * non-`empty` (confirmed live: with an empty value, upstream shows the ordinary placeholder span
 * instead, same as a select with no custom trigger at all) — so this starts identical to a plain
 * empty select and only differs once something is selected.
 */
export default component$(() => {
  useStyles$(styles);
  const value = useSignal<string[]>([]);

  const toppingList = ['Extra cheese', 'Mushroom', 'Onion', 'Pepperoni', 'Sausage', 'Tomato'];

  return (
    <select-custom-trigger-example>
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
            customTrigger={
              <>
                {value.value[0] || ''}
                {value.value.length > 1 && (
                  <span class="example-additional-selection">
                    {' '}
                    (+{value.value.length - 1} {value.value.length === 2 ? 'other' : 'others'})
                  </span>
                )}
              </>
            }
            options={toppingList.map(t => ({value: t, label: t}))}
          />
        }
      />
    </select-custom-trigger-example>
  );
});
