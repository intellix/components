import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteOptionDef,
} from '@angular-community/qwik-material/autocomplete';
import styles from './autocomplete-display-example.css?inline';

// Port of material.angular.dev's `autocomplete-display` docs example
// (src/components-examples/material/autocomplete/autocomplete-display/) — same `{name: string}`
// object-valued option list and `displayWith$` wiring as this port's own `mat-autocomplete/
// display-with` mirror scenario (see that route's own doc comment for the established
// conventions this reuses). No "Value: …" paragraph (matches the real example — it never
// renders the raw object value).
interface AcUser {
  name: string;
}

const USERS: AcUser[] = [{name: 'Mary'}, {name: 'Shelley'}, {name: 'Igor'}];

function filterUsers(val: string | AcUser): MatAutocompleteOptionDef[] {
  const name = typeof val === 'string' ? val : (val?.name ?? '');
  const filterValue = name.toLowerCase();
  return USERS.filter(user => user.name.toLowerCase().includes(filterValue)).map(user => ({
    value: user,
    label: user.name,
  }));
}

export default component$(() => {
  useStyles$(styles);
  const fc = useMatFormControl();
  const value = useSignal<string | AcUser>('');
  const filteredUsers = useSignal<MatAutocompleteOptionDef[]>(filterUsers(''));

  const displayWith$ = $((val: unknown) => {
    const user = val as AcUser | null | undefined;
    return user && user.name ? user.name : '';
  });

  return (
    <autocomplete-display-example>
      <form class="example-form ng-untouched ng-pristine ng-valid" noValidate>
        <MatFormField
          class="example-full-width"
          label={<MatLabel>Assignee</MatLabel>}
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
              value={value.value}
              onValueChange$={v => {
                fc.markAsDirty$();
                value.value = v as string | AcUser;
                filteredUsers.value = filterUsers(v as string | AcUser);
              }}
              onTouched$={fc.markAsTouched$}
              displayWith$={displayWith$}
              options={filteredUsers}
              onInput$={(_, el) => (filteredUsers.value = filterUsers(el.value))}
              onFocus$={(_, el) => (filteredUsers.value = filterUsers(el.value))}
            />
          }
        />
      </form>
    </autocomplete-display-example>
  );
});
