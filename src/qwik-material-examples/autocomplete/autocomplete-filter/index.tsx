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
import styles from './autocomplete-filter-example.css?inline';

// Port of material.angular.dev's `autocomplete-filter` docs example
// (src/components-examples/material/autocomplete/autocomplete-filter/). Same filtering shape as
// this port's own `mat-autocomplete/basic-filter` mirror scenario (see that route's own doc
// comment for the established `useMatFormControl()`/live-`Signal`-`options`/refilter-on-
// `onValueChange$` conventions this reuses) — only the labels/placeholder/wrapper markup differ
// to match the real docs example exactly.
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
    <autocomplete-filter-example>
      <form class="example-form ng-untouched ng-pristine ng-valid" noValidate>
        <MatFormField
          class="example-full-width"
          label={<MatLabel>Number</MatLabel>}
          touched={fc.touched}
          dirty={fc.dirty}
          invalid={false}
          control={
            <MatAutocomplete
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
    </autocomplete-filter-example>
  );
});
