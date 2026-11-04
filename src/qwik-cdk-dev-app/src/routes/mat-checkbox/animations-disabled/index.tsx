import {component$, useSignal} from '@qwik.dev/core';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';
import {useMatAnimationsProvider} from '@angular-community/qwik-material/dialog';

// Mirrors the Angular scenario's `NO_ANIMATIONS` provider
// (MATERIAL_ANIMATIONS / animationsDisabled: true) — identical markup/
// behavior to `basic` otherwise. See angular-parity.spec.ts's header comment
// for the full animations contract.
export default component$(() => {
  const checked = useSignal(false);

  useMatAnimationsProvider(true);
  return (
    <>
      <div data-parity-root>
        <MatCheckbox
          checked={checked.value}
          onChange$={event => {
            checked.value = event.checked;
          }}
        >
          Subscribe to newsletter
        </MatCheckbox>
        <p>Checked: {String(checked.value)}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
