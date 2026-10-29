import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel, useMatFormControl} from '@angular-community/qwik-material/form-field';
import {MatAutocomplete} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's
// AutocompleteAutoActiveFirstOption. Same 3-option list upstream's own
// autocomplete-auto-active-first-option-example uses.
const OPTIONS = ['One', 'Two', 'Three'];

function filterOptions(val: string): string[] {
  const filterValue = (val || '').toLowerCase();
  return OPTIONS.filter(option => option.toLowerCase().includes(filterValue));
}

// See basic-filter's own comment for why `formBound`/`touched`/`dirty` are
// wired through `useMatFormControl()`.
export default component$(() => {
  const fc = useMatFormControl();
  const value = useSignal('');
  const filteredOptions = useSignal<string[]>(OPTIONS.slice());

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Number</MatLabel>}
          touched={fc.touched}
          dirty={fc.dirty}
          invalid={false}
          control={
            <MatAutocomplete
              autoActiveFirstOption
              formBound
              touched={fc.touched}
              dirty={fc.dirty}
              invalid={false}
              value={value.value}
              onValueChange$={v => {
                fc.markAsDirty$();
                value.value = v as string;
              }}
              onTouched$={fc.markAsTouched$}
              options={filteredOptions.value.map(option => ({value: option, label: option}))}
              onInput$={(_, el) => (filteredOptions.value = filterOptions(el.value))}
              onFocus$={(_, el) => (filteredOptions.value = filterOptions(el.value))}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
