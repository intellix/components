import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect, MatOption} from '@angular-community/qwik-material/select';

// Mirrors src/dev-app/qwik-parity/select.ts's SelectFillBasic. Four options
// with distinct first letters (Apple/Banana/Cherry[disabled]/Date) so the
// parity spec's typeahead steps are unambiguous — see that file's own
// comment.
export default component$(() => {
  const value = useSignal('');

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Fruit</MatLabel>}
          control={
            <MatSelect
              controlType="mat-select"
              value={value.value}
              onValueChange$={v => (value.value = v as string)}
              options={[
                <MatOption value="apple">Apple</MatOption>,
                <MatOption value="banana">Banana</MatOption>,
                <MatOption value="cherry" disabled>
                  Cherry
                </MatOption>,
                <MatOption value="date">Date</MatOption>,
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
