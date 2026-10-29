import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatAutocomplete} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's AutocompleteBasicFilter.
// Deliberately the same 4-item fruit list select.ts's `fill-basic` uses —
// see that file's own header comment.
const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date'];

function filterFruits(val: string): string[] {
  const filterValue = (val || '').toLowerCase();
  return FRUITS.filter(fruit => fruit.toLowerCase().includes(filterValue));
}

export default component$(() => {
  const value = useSignal('');
  const filteredFruits = useSignal<string[]>(FRUITS.slice());

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Fruit</MatLabel>}
          control={
            <MatAutocomplete
              value={value.value}
              onValueChange$={v => (value.value = v as string)}
              options={filteredFruits.value.map(fruit => ({value: fruit, label: fruit}))}
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
