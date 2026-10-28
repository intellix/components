import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField} from '@angular-community/qwik-material/form-field';
import {MatSelect, MatOption} from '@angular-community/qwik-material/select';

// Mirrors src/dev-app/qwik-parity/select.ts's SelectPlaceholder — NO
// <mat-label> at all, isolating `mat-mdc-select-placeholder` from the
// floating-label machinery entirely.
export default component$(() => {
  const value = useSignal('');

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          control={
            <MatSelect
              controlType="mat-select"
              value={value.value}
              onValueChange$={v => (value.value = v as string)}
              placeholder="Choose a fruit"
              options={[
                <MatOption value="apple">Apple</MatOption>,
                <MatOption value="banana">Banana</MatOption>,
                <MatOption value="cherry">Cherry</MatOption>,
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
