import {$, component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatAutocomplete} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's AutocompleteDisplayWith.
// Same {name: string} object-valued option list upstream's own
// autocomplete-display-example uses. No "Value: …" paragraph (matches the
// Angular mirror — interpolating an object value directly isn't useful).
interface AcUser {
  name: string;
}

const USERS: AcUser[] = [{name: 'Mary'}, {name: 'Shelley'}, {name: 'Igor'}];

function filterUsers(val: string | AcUser): AcUser[] {
  const name = typeof val === 'string' ? val : val?.name ?? '';
  const filterValue = name.toLowerCase();
  return USERS.filter(user => user.name.toLowerCase().includes(filterValue));
}

export default component$(() => {
  const value = useSignal<string | AcUser>('');
  const filteredUsers = useSignal<AcUser[]>(USERS.slice());

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
          control={
            <MatAutocomplete
              value={value.value}
              onValueChange$={v => (value.value = v as string | AcUser)}
              displayWith$={displayWith$}
              options={filteredUsers.value.map(user => ({value: user, label: user.name}))}
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
