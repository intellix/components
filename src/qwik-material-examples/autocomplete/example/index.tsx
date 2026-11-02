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
import styles from './autocomplete-simple-example.css?inline';

const OPTIONS: MatAutocompleteOptionDef[] = ['One', 'Two', 'Three'].map(option => ({
  value: option,
  label: option,
}));

/**
 * Port of material.angular.dev's `autocomplete-simple` docs example
 * (src/components-examples/material/autocomplete/autocomplete-simple/). Unlike
 * `mat-autocomplete/basic-filter`, this example's option list never filters — it's the same
 * static three-option list regardless of what's typed (the real example has no `(ngModelChange)`
 * filter handler at all). `[formControl]="myControl"` is a standalone `FormControl` (not part of
 * a `FormGroup`), which gives the input the same `NgControlStatus` `ng-*` classes `[(ngModel)]`
 * would — see `mat-autocomplete/basic-filter`'s own header comment for the established
 * `useMatFormControl()` convention this reuses.
 */

export default component$(() => {
  useStyles$(styles);
  const fc = useMatFormControl();
  const value = useSignal('');
  const options = useSignal<MatAutocompleteOptionDef[]>(OPTIONS);

  return (
    <autocomplete-simple-example>
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
              }}
              onTouched$={fc.markAsTouched$}
              options={options}
            />
          }
        />
      </form>
    </autocomplete-simple-example>
  );
});
