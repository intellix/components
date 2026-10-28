import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect, MatOption} from '@angular-community/qwik-material/select';

// Mirrors src/dev-app/qwik-parity/select.ts's SelectMultiple —
// `[multiple]="true"`, 2 of 4 toppings preselected. `<p>Value: {{ value }}</p>`
// on the Angular side interpolates an ARRAY, which Angular stringifies via
// plain JS array-to-string (comma-joined, no space) — mirrored explicitly
// here since JSX would otherwise just concatenate array items with no
// separator at all.
export default component$(() => {
  const value = useSignal<string[]>(['mushroom', 'onion']);

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Toppings</MatLabel>}
          control={
            <MatSelect
              controlType="mat-select"
              multiple
              value={value.value}
              onValueChange$={v => (value.value = v as string[])}
              options={[
                <MatOption value="cheese">Extra cheese</MatOption>,
                <MatOption value="mushroom">Mushroom</MatOption>,
                <MatOption value="onion">Onion</MatOption>,
                <MatOption value="pepperoni">Pepperoni</MatOption>,
              ]}
            />
          }
        />
        <p>Value: {value.value.join(',')}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
