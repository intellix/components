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
import styles from './autocomplete-require-selection-example.css?inline';

// Port of material.angular.dev's `autocomplete-require-selection` docs example
// (src/components-examples/material/autocomplete/autocomplete-require-selection/) — same
// `requireSelection` wiring as this port's own `mat-autocomplete/require-selection` mirror
// scenario (see that route's own doc comment for why `onInput$`/`onFocus$` filtering works
// without special-casing: `MatAutocomplete` already suppresses `onValueChange$` while
// `requireSelection` is set). The real example's own "Control value: …" paragraph is reproduced
// verbatim (a plain, non-`MatFormField` text node, unlike `select-multiple`'s own "Value: …").
const OPTIONS = ['One', 'Two', 'Three', 'Four', 'Five'];

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
    <autocomplete-require-selection-example>
      Control value: {value.value || 'empty'}{' '}
      <form class="example-form ng-untouched ng-pristine ng-valid" noValidate>
        <MatFormField
          class="example-full-width"
          label={<MatLabel>Number</MatLabel>}
          touched={fc.touched}
          dirty={fc.dirty}
          invalid={false}
          control={
            <MatAutocomplete
              requireSelection
              formBound
              touched={fc.touched}
              dirty={fc.dirty}
              invalid={false}
              type="text"
              placeholder="Pick one"
              value={value.value}
              onValueChange$={v => {
                fc.markAsDirty$();
                value.value = v as string;
              }}
              onTouched$={fc.markAsTouched$}
              options={filteredOptions}
              onInput$={(_, el) => (filteredOptions.value = filterOptions(el.value))}
              onFocus$={(_, el) => (filteredOptions.value = filterOptions(el.value))}
            />
          }
        />
      </form>
    </autocomplete-require-selection-example>
  );
});
