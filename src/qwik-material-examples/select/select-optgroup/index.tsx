import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';
import {NativeSelectControl} from '../_lib/native-select-control';

/**
 * Port of material.angular.dev's `select-optgroup` docs example
 * (src/components-examples/material/select/select-optgroup/) — grouped options via `MatSelect`'s
 * `options` entries that nest their own `options` array (see `select-option-resolver.ts`'s
 * `MatSelectGroupDef`), and a plain native `<select matNativeControl>` with real `<optgroup>`
 * elements. `pokemonControl = new FormControl('')` has no validators (always valid) — the native
 * select has no `ngModel`/`formControl` at all, matching the real template.
 */
export default component$(() => {
  const value = useSignal('');

  return (
    <select-optgroup-example>
      <h4>mat-select</h4>
      <MatFormField
        label={<MatLabel>Pokemon</MatLabel>}
        touched={false}
        dirty={false}
        invalid={false}
        control={
          <MatSelect
            controlType="mat-select"
            formBound
            touched={false}
            dirty={false}
            invalid={false}
            value={value.value}
            onValueChange$={v => (value.value = v as string)}
            options={[
              {value: undefined, label: '-- None --'},
              {
                label: 'Grass',
                options: [
                  {value: 'bulbasaur-0', label: 'Bulbasaur'},
                  {value: 'oddish-1', label: 'Oddish'},
                  {value: 'bellsprout-2', label: 'Bellsprout'},
                ],
              },
              {
                label: 'Water',
                options: [
                  {value: 'squirtle-3', label: 'Squirtle'},
                  {value: 'psyduck-4', label: 'Psyduck'},
                  {value: 'horsea-5', label: 'Horsea'},
                ],
              },
              {
                label: 'Fire',
                disabled: true,
                options: [
                  {value: 'charmander-6', label: 'Charmander'},
                  {value: 'vulpix-7', label: 'Vulpix'},
                  {value: 'flareon-8', label: 'Flareon'},
                ],
              },
              {
                label: 'Psychic',
                options: [
                  {value: 'mew-9', label: 'Mew'},
                  {value: 'mewtwo-10', label: 'Mewtwo'},
                ],
              },
            ]}
          />
        }
      />

      <h4>native html select</h4>
      <MatFormField
        label={<MatLabel>Cars</MatLabel>}
        control={
          <NativeSelectControl controlType="mat-native-select" value="volvo">
            <optgroup label="Swedish Cars">
              <option value="volvo">volvo</option>
              <option value="saab">Saab</option>
            </optgroup>
            <optgroup label="German Cars">
              <option value="mercedes">Mercedes</option>
              <option value="audi">Audi</option>
            </optgroup>
          </NativeSelectControl>
        }
      />
    </select-optgroup-example>
  );
});
