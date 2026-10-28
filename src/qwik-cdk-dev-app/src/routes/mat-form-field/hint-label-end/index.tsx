import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

export default component$(() => {
  const value = useSignal('');

  return (
    <>
      <div data-parity-root>
        <MatFormField
          hintLabel="Max 10 characters"
          style="width: 300px"
          label={<MatLabel>Nickname</MatLabel>}
          control={
            <MatInput
              maxLength={10}
              placeholder="Ex. Nougat"
              onInput$={(_, el) => {
                value.value = el.value;
              }}
            />
          }
          hintEnd={<MatHint align="end">{value.value.length}/10</MatHint>}
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
