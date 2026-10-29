import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatAutocomplete} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's
// AutocompleteDisabledOption. Static list, no filtering at all — isolates
// just the disabled-option mechanics (same "isolate one concern" approach
// as checkbox.ts's dedicated scenarios).
export default component$(() => {
  const value = useSignal('');

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
              options={[
                {value: 'Apple', label: 'Apple'},
                {value: 'Banana', label: 'Banana', disabled: true},
                {value: 'Cherry', label: 'Cherry'},
                {value: 'Date', label: 'Date'},
              ]}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
