import {component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

export default component$(() => {
  const quantity = useSignal('');

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Quantity</MatLabel>}
          control={
            <MatInput
              type="number"
              placeholder="0"
              onInput$={(_, el) => {
                quantity.value = el.value;
              }}
            />
          }
        />
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Password</MatLabel>}
          control={<MatInput type="password" placeholder="Password" />}
        />
        <p>Quantity: {quantity.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
