import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatAutocomplete} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's AutocompleteOptgroups.
// "Fruits" (Apple, Banana) / "Vegetables" (Carrot, Celery) — deliberately
// chosen so NEITHER Fruits item contains "c" while BOTH Vegetables items do.
const GROUPS = [
  {letter: 'Fruits', items: ['Apple', 'Banana']},
  {letter: 'Vegetables', items: ['Carrot', 'Celery']},
];

function filterGroups(val: string) {
  const filterValue = (val || '').toLowerCase();
  if (!filterValue) return GROUPS;
  return GROUPS.map(group => ({
    letter: group.letter,
    items: group.items.filter(item => item.toLowerCase().includes(filterValue)),
  })).filter(group => group.items.length > 0);
}

export default component$(() => {
  const value = useSignal('');
  const filteredGroups = useSignal(GROUPS);

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Produce</MatLabel>}
          control={
            <MatAutocomplete
              value={value.value}
              onValueChange$={v => (value.value = v as string)}
              options={filteredGroups.value.map(group => ({
                label: group.letter,
                options: group.items.map(item => ({value: item, label: item})),
              }))}
              onInput$={(_, el) => (filteredGroups.value = filterGroups(el.value))}
              onFocus$={(_, el) => (filteredGroups.value = filterGroups(el.value))}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
