import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteGroupDef,
} from '@angular-community/qwik-material/autocomplete';

// Port of material.angular.dev's `autocomplete-optgroup` docs example
// (src/components-examples/material/autocomplete/autocomplete-optgroup/) — grouped options via
// `MatAutocomplete`'s `options` entries nesting their own `options` array (see
// `select-option-resolver.ts`'s identical `MatSelectGroupDef` shape), same conventions as this
// port's own `mat-autocomplete/optgroups` mirror scenario. `stateForm = formBuilder.group({
// stateGroup: ''})` (reactive `FormGroup`, `required` on the input) — the input starts empty and
// invalid (required), untouched.
const GROUPS: Array<{letter: string; names: string[]}> = [
  {letter: 'A', names: ['Alabama', 'Alaska', 'Arizona', 'Arkansas']},
  {letter: 'C', names: ['California', 'Colorado', 'Connecticut']},
  {letter: 'D', names: ['Delaware']},
  {letter: 'F', names: ['Florida']},
  {letter: 'G', names: ['Georgia']},
  {letter: 'H', names: ['Hawaii']},
  {letter: 'I', names: ['Idaho', 'Illinois', 'Indiana', 'Iowa']},
  {letter: 'K', names: ['Kansas', 'Kentucky']},
  {letter: 'L', names: ['Louisiana']},
  {
    letter: 'M',
    names: [
      'Maine',
      'Maryland',
      'Massachusetts',
      'Michigan',
      'Minnesota',
      'Mississippi',
      'Missouri',
      'Montana',
    ],
  },
  {
    letter: 'N',
    names: [
      'Nebraska',
      'Nevada',
      'New Hampshire',
      'New Jersey',
      'New Mexico',
      'New York',
      'North Carolina',
      'North Dakota',
    ],
  },
  {letter: 'O', names: ['Ohio', 'Oklahoma', 'Oregon']},
  {letter: 'P', names: ['Pennsylvania']},
  {letter: 'R', names: ['Rhode Island']},
  {letter: 'S', names: ['South Carolina', 'South Dakota']},
  {letter: 'T', names: ['Tennessee', 'Texas']},
  {letter: 'U', names: ['Utah']},
  {letter: 'V', names: ['Vermont', 'Virginia']},
  {letter: 'W', names: ['Washington', 'West Virginia', 'Wisconsin', 'Wyoming']},
];

function filterGroup(val: string): MatAutocompleteGroupDef[] {
  const filterValue = (val || '').toLowerCase();
  const groups = !filterValue
    ? GROUPS
    : GROUPS.map(group => ({
        letter: group.letter,
        names: group.names.filter(name => name.toLowerCase().includes(filterValue)),
      })).filter(group => group.names.length > 0);
  return groups.map(group => ({
    label: group.letter,
    options: group.names.map(name => ({value: name, label: name})),
  }));
}

export default component$(() => {
  const value = useSignal('');
  const touched = useSignal(false);
  const invalid = () => value.value === '';
  const filteredGroups = useSignal<MatAutocompleteGroupDef[]>(filterGroup(''));

  return (
    <autocomplete-optgroup-example>
      <form class="ng-untouched ng-pristine ng-invalid" noValidate>
        <MatFormField
          touched={touched.value}
          dirty={false}
          invalid={invalid()}
          label={<MatLabel>States Group</MatLabel>}
          control={
            <MatAutocomplete
              formBound
              required
              touched={touched.value}
              dirty={false}
              invalid={invalid()}
              type="text"
              value={value.value}
              onValueChange$={v => (value.value = v as string)}
              onTouched$={() => (touched.value = true)}
              options={filteredGroups}
              onInput$={(_, el) => (filteredGroups.value = filterGroup(el.value))}
              onFocus$={(_, el) => (filteredGroups.value = filterGroup(el.value))}
            />
          }
        />
      </form>
    </autocomplete-optgroup-example>
  );
});
