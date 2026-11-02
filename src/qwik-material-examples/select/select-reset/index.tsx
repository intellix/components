import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';
import {NativeSelectControl} from '../_lib/native-select-control';

const STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

/**
 * Port of material.angular.dev's `select-reset` docs example
 * (src/components-examples/material/select/select-reset/) — a bare `<mat-select>` (no
 * `ngModel`/`formControl` at all) whose first option (no `[value]`) resets the selection, and a
 * plain native `<select matNativeControl id="mySelectId">` whose first option is `disabled
 * selected` with no `value`/`label` (so `shouldLabelFloat` stays `false` — see
 * `select-hint-error`'s doc comment for the general native-select float formula this and every
 * other sibling example re-derives via `NativeSelectControl`'s `value` sentinel).
 */
export default component$(() => {
  const value = useSignal<string | undefined>(undefined);

  return (
    <select-reset-example>
      <h4>mat-select</h4>
      <MatFormField
        label={<MatLabel>State</MatLabel>}
        control={
          <MatSelect
            controlType="mat-select"
            value={value.value}
            onValueChange$={v => (value.value = v as string | undefined)}
            options={[
              {value: undefined, label: 'None'},
              ...STATES.map(s => ({value: s, label: s})),
            ]}
          />
        }
      />

      <h4>native html select</h4>
      <MatFormField
        label={<MatLabel>Select your car</MatLabel>}
        control={
          <NativeSelectControl controlType="mat-native-select" id="mySelectId" value="">
            <option value="" disabled selected></option>
            <option value="volvo">Volvo</option>
            <option value="saab">Saab</option>
            <option value="mercedes">Mercedes</option>
            <option value="audi">Audi</option>
          </NativeSelectControl>
        }
      />
    </select-reset-example>
  );
});
