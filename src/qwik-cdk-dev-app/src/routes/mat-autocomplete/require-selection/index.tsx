import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatAutocomplete} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's
// AutocompleteRequireSelection. Upstream's Angular mirror reads the raw
// native `(input)` event (rather than `(ngModelChange)`) specifically
// because `requireSelection` skips the CVA's `_onChange` while typing — see
// that file's CRITICAL GOTCHA note. This port's `<MatAutocomplete>` already
// reproduces that same gate INTERNALLY (`onValueChange$` is suppressed
// while `requireSelection` is set, regardless of how filtering is wired),
// so this route uses the SAME `onInput$`/`onFocus$` filtering convention as
// every other scenario here — no special-casing needed.
const OPTIONS = ['One', 'Two', 'Three', 'Four', 'Five'];

function filterOptions(val: string): string[] {
  const filterValue = (val || '').toLowerCase();
  return OPTIONS.filter(option => option.toLowerCase().includes(filterValue));
}

export default component$(() => {
  const value = useSignal('');
  const filteredOptions = useSignal<string[]>(OPTIONS.slice());

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Number</MatLabel>}
          control={
            <MatAutocomplete
              requireSelection
              value={value.value}
              onValueChange$={v => (value.value = v as string)}
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
