import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteOptionDef,
} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's AutocompleteDisplayWith.
// Same {name: string} object-valued option list upstream's own
// autocomplete-display-example uses. No "Value: …" paragraph (matches the
// Angular mirror — interpolating an object value directly isn't useful).
interface AcUser {
  name: string;
}

const USERS: AcUser[] = [{name: 'Mary'}, {name: 'Shelley'}, {name: 'Igor'}];

// Returns resolved option DEFS directly — see basic-filter's own comment
// for why `options` must be the live `Signal` itself, never `.value`.
function filterUsers(val: string | AcUser): MatAutocompleteOptionDef[] {
  const name = typeof val === 'string' ? val : (val?.name ?? '');
  const filterValue = name.toLowerCase();
  return USERS.filter(user => user.name.toLowerCase().includes(filterValue)).map(user => ({
    value: user,
    label: user.name,
  }));
}

// See basic-filter's own comment for why `formBound`/`touched`/`dirty` are
// wired through `useMatFormControl()`.
export default component$(() => {
  const fc = useMatFormControl();
  const value = useSignal<string | AcUser>('');
  const filteredUsers = useSignal<MatAutocompleteOptionDef[]>(filterUsers(''));

  const displayWith$ = $((val: unknown) => {
    const user = val as AcUser | null | undefined;
    return user && user.name ? user.name : '';
  });

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
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
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
