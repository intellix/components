import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {useMatFormControl} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteOptionDef,
} from '@angular-community/qwik-material/autocomplete';
import styles from './autocomplete-plain-input-example.css?inline';

/**
 * Port of material.angular.dev's `autocomplete-plain-input` docs example
 * (src/components-examples/material/autocomplete/autocomplete-plain-input/) — `<input
 * [formControl]="control" [matAutocomplete]="auto">` with NO `matInput`/`<mat-form-field>` at
 * all. `<MatAutocomplete>` works standalone the same way `MatInput` does (both check for an
 * ancestor `MAT_FORM_FIELD_CONTROL_STATE` and fall back to their own plain props when there
 * isn't one) — so this is the one example in this batch that passes `<MatAutocomplete>` directly
 * as a route's own JSX, not through `<MatFormField control={...}>`.
 */
const STREETS = ['Champs-Élysées', 'Lombard Street', 'Abbey Road', 'Fifth Avenue'];

function normalizeStreet(s: string): string {
  return s.toLowerCase().replace(/\s/g, '');
}

function filterStreets(val: string): MatAutocompleteOptionDef[] {
  const filterValue = normalizeStreet(val || '');
  return STREETS.filter(street => normalizeStreet(street).includes(filterValue)).map(street => ({
    value: street,
    label: street,
  }));
}

export default component$(() => {
  useStyles$(styles);
  const fc = useMatFormControl();
  const value = useSignal('');
  const filteredStreets = useSignal<MatAutocompleteOptionDef[]>(filterStreets(''));

  return (
    <autocomplete-plain-input-example>
      <form class="example-form ng-untouched ng-pristine ng-valid" noValidate>
        <MatAutocomplete
          formBound
          touched={fc.touched}
          dirty={fc.dirty}
          invalid={false}
          type="text"
          placeholder="Search for a street"
          class="example-input"
          value={value.value}
          onValueChange$={v => {
            fc.markAsDirty$();
            value.value = v as string;
            filteredStreets.value = filterStreets(v as string);
          }}
          onTouched$={fc.markAsTouched$}
          options={filteredStreets}
          onInput$={(_, el) => (filteredStreets.value = filterStreets(el.value))}
          onFocus$={(_, el) => (filteredStreets.value = filterStreets(el.value))}
        />
      </form>
    </autocomplete-plain-input-example>
  );
});
