import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';

// Mirrors src/dev-app/qwik-parity/select.ts's SelectOutlineBasic — identical
// content to fill-basic, just `appearance="outline"`.
export default component$(() => {
  const value = useSignal('');

  return (
    <>
      <div data-parity-root>
        <MatFormField
          appearance="outline"
          style="width: 300px"
          label={<MatLabel>Fruit</MatLabel>}
          control={
            <MatSelect
              controlType="mat-select"
              value={value.value}
              onValueChange$={v => (value.value = v as string)}
              options={[
                {value: 'apple', label: 'Apple'},
                {value: 'banana', label: 'Banana'},
                {value: 'cherry', label: 'Cherry', disabled: true},
                {value: 'date', label: 'Date'},
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
