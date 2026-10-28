import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';

// Mirrors src/dev-app/qwik-parity/select.ts's SelectOptgroups — two groups,
// "Fire" disabled.
export default component$(() => {
  const value = useSignal('');

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Pokemon</MatLabel>}
          control={
            <MatSelect
              controlType="mat-select"
              value={value.value}
              onValueChange$={v => (value.value = v as string)}
              options={[
                {
                  label: 'Grass',
                  options: [
                    {value: 'bulbasaur', label: 'Bulbasaur'},
                    {value: 'oddish', label: 'Oddish'},
                  ],
                },
                {
                  label: 'Fire',
                  disabled: true,
                  options: [
                    {value: 'charmander', label: 'Charmander'},
                    {value: 'vulpix', label: 'Vulpix'},
                  ],
                },
              ]}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
