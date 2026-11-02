import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';

/**
 * Port of material.angular.dev's `select-value-binding` docs example
 * (src/components-examples/material/select/select-value-binding/). `[(value)]="selected"` is
 * qwik-material's plain `value`/`onValueChange$` round trip — see `mat-select.tsx`'s own doc
 * comment ("why value is not a live prop") for why `value` only seeds the initial selection and
 * `onValueChange$` is what keeps `selected`/the `<p>` text live.
 *
 * The real template's bare `<mat-option>None</mat-option>` (no `[value]`) is `{value: undefined,
 * label: 'None'}` here — selecting it resets `selected` to `undefined`, matching upstream.
 */
export default component$(() => {
  const selected = useSignal<string | undefined>('option2');

  return (
    <select-value-binding-example>
      <MatFormField
        label={<MatLabel>Select an option</MatLabel>}
        control={
          <MatSelect
            controlType="mat-select"
            value={selected.value}
            onValueChange$={v => (selected.value = v as string | undefined)}
            options={[
              {value: undefined, label: 'None'},
              {value: 'option1', label: 'Option 1'},
              {value: 'option2', label: 'Option 2'},
              {value: 'option3', label: 'Option 3'},
            ]}
          />
        }
      />
      <p>You selected: {selected.value}</p>
    </select-value-binding-example>
  );
});
