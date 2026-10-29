import {component$, useSignal} from '@builder.io/qwik';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteOptionDef,
} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's AutocompletePanelWidth.
// Same 4-item fruit list as basic-filter, against the usual 300px-wide
// field, isolating just the `panelWidth` geometry. See basic-filter's own
// comment for why `formBound`/`touched`/`dirty` are wired through
// `useMatFormControl()`, and for why `options` must be the live `Signal`
// itself, never `.value`.
const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date'];

function filterFruits(val: string): MatAutocompleteOptionDef[] {
  const filterValue = (val || '').toLowerCase();
  return FRUITS.filter(fruit => fruit.toLowerCase().includes(filterValue)).map(fruit => ({
    value: fruit,
    label: fruit,
  }));
}

export default component$(() => {
  const fc = useMatFormControl();
  const value = useSignal('');
  const filteredFruits = useSignal<MatAutocompleteOptionDef[]>(filterFruits(''));

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Fruit</MatLabel>}
          touched={fc.touched}
          dirty={fc.dirty}
          invalid={false}
          control={
            <MatAutocomplete
              panelWidth="500px"
              formBound
              touched={fc.touched}
              dirty={fc.dirty}
              invalid={false}
              value={value.value}
              onValueChange$={v => {
                fc.markAsDirty$();
                value.value = v as string;
                filteredFruits.value = filterFruits(v as string);
              }}
              onTouched$={fc.markAsTouched$}
              options={filteredFruits}
              onInput$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
              onFocus$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
