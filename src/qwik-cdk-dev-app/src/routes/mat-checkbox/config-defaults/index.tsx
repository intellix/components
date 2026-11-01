import {component$, useSignal} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

// Qwik-only route (no Angular mirror — not part of the angular-parity.spec.ts
// contract). Exercises MAT_CHECKBOX_CONFIG's provider-supplied defaults
// (color + clickAction), which no scenario in the parity contract needs: every
// contract scenario either omits `color` (falling back to the component's own
// hardcoded 'accent' default) or sets it explicitly. `#0` has neither a
// `color` nor a `disabled`/`clickAction` prop, so it should pick up BOTH
// `color: 'primary'` and `clickAction: 'noop'` from the provider; `#1`
// overrides `color` explicitly, which must win over the provider default.
export default component$(() => {
  const checked = useSignal(false);

  return (
    <QwikMaterialProvider matCheckboxConfig={{color: 'primary', clickAction: 'noop'}}>
      <div data-parity-root>
        <MatCheckbox
          checked={checked.value}
          onChange$={event => {
            checked.value = event.checked;
          }}
        >
          Uses provider defaults
        </MatCheckbox>
        <MatCheckbox color="warn">Overrides color explicitly</MatCheckbox>
        <p>Checked: {String(checked.value)}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
