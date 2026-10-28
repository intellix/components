import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect, MatOption, MatOptgroup} from '@angular-community/qwik-material/select';

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
                <MatOptgroup label="Grass">
                  {[
                    <MatOption value="bulbasaur">Bulbasaur</MatOption>,
                    <MatOption value="oddish">Oddish</MatOption>,
                  ]}
                </MatOptgroup>,
                <MatOptgroup label="Fire" disabled>
                  {[
                    <MatOption value="charmander">Charmander</MatOption>,
                    <MatOption value="vulpix">Vulpix</MatOption>,
                  ]}
                </MatOptgroup>,
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
