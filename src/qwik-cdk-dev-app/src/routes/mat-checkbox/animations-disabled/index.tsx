import {component$, useSignal} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

// Mirrors the Angular scenario's `NO_ANIMATIONS` provider
// (MATERIAL_ANIMATIONS / animationsDisabled: true) — identical markup/
// behavior to `basic` otherwise. See angular-parity.spec.ts's header comment
// for the full animations contract.
export default component$(() => {
  const checked = useSignal(false);

  return (
    <QwikMaterialProvider animationsDisabled>
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
    </QwikMaterialProvider>
  );
});
