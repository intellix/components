import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteOptionDef,
} from '@angular-community/qwik-material/autocomplete';
import styles from './autocomplete-auto-active-first-option-example.css?inline';

// Port of material.angular.dev's `autocomplete-auto-active-first-option` docs example
// (src/components-examples/material/autocomplete/autocomplete-auto-active-first-option/) — same
// `autoActiveFirstOption` wiring as this port's own `mat-autocomplete/auto-active-first-option`
// mirror scenario.
const OPTIONS = ['One', 'Two', 'Three'];

function filterOptions(val: string): MatAutocompleteOptionDef[] {
  const filterValue = (val || '').toLowerCase();
  return OPTIONS.filter(option => option.toLowerCase().includes(filterValue)).map(option => ({
    value: option,
    label: option,
  }));
}

export default component$(() => {
  useStyles$(styles);
  const fc = useMatFormControl();
  const value = useSignal('');
  const filteredOptions = useSignal<MatAutocompleteOptionDef[]>(filterOptions(''));

  return (
    <autocomplete-auto-active-first-option-example>
      <form class="example-form ng-untouched ng-pristine ng-valid" noValidate>
        <MatFormField
          class="example-full-width"
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
              type="text"
              placeholder="Pick one"
              inputAriaLabel="Number"
              value={value.value}
              onValueChange$={v => {
                fc.markAsDirty$();
                value.value = v as string;
                filteredOptions.value = filterOptions(v as string);
              }}
              onTouched$={fc.markAsTouched$}
              options={filteredOptions}
              onInput$={(_, el) => (filteredOptions.value = filterOptions(el.value))}
              onFocus$={(_, el) => (filteredOptions.value = filterOptions(el.value))}
            />
          }
        />
      </form>
    </autocomplete-auto-active-first-option-example>
  );
});
