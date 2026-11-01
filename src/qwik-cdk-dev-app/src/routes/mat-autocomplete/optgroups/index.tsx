import {component$, useSignal} from '@qwik.dev/core';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteGroupDef,
} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's AutocompleteOptgroups.
// "Fruits" (Apple, Banana) / "Vegetables" (Carrot, Celery) — deliberately
// chosen so NEITHER Fruits item contains "c" while BOTH Vegetables items do.
const GROUPS = [
  {letter: 'Fruits', items: ['Apple', 'Banana']},
  {letter: 'Vegetables', items: ['Carrot', 'Celery']},
];

// Returns resolved group DEFS directly — see basic-filter's own comment
// for why `options` must be the live `Signal` itself, never `.value`.
function filterGroups(val: string): MatAutocompleteGroupDef[] {
  const filterValue = (val || '').toLowerCase();
  const groups = !filterValue
    ? GROUPS
    : GROUPS.map(group => ({
        letter: group.letter,
        items: group.items.filter(item => item.toLowerCase().includes(filterValue)),
      })).filter(group => group.items.length > 0);
  return groups.map(group => ({
    label: group.letter,
    options: group.items.map(item => ({value: item, label: item})),
  }));
}

// See basic-filter's own comment for why `formBound`/`touched`/`dirty` are
// wired through `useMatFormControl()` — every scenario in this directory
// needs it (`[(ngModel)]` applies `NgControlStatus` classes in Angular) —
// and for why `onValueChange$` ALSO refilters (mirrors `(ngModelChange)`
// firing on the selection-commit path too, narrowing the reopened panel to
// just the selected item).
export default component$(() => {
  const fc = useMatFormControl();
  const value = useSignal('');
  const filteredGroups = useSignal<MatAutocompleteGroupDef[]>(filterGroups(''));

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Produce</MatLabel>}
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
                value.value = v as string;
                filteredGroups.value = filterGroups(v as string);
              }}
              onTouched$={fc.markAsTouched$}
              options={filteredGroups}
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
