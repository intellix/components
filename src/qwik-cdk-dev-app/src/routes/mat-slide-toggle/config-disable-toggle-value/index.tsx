import {component$, useSignal} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';

/**
 * Qwik-only scenario (no Angular mirror — provider config isn't exercised by
 * any `angular-parity.spec.ts` scenario). Exercises
 * `MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS.disableToggleValue` equivalent: clicking
 * still fires `onToggleChange$` every time, but never flips the rendered
 * `checked` state / fires `onChange$`. See
 * specs/material-slide-toggle/config-disable-toggle-value.spec.ts.
 */
export default component$(() => {
  const checked = useSignal(false);
  const toggleCount = useSignal(0);
  const changeCount = useSignal(0);

  return (
    <QwikMaterialProvider matSlideToggleConfig={{disableToggleValue: true}}>
      <div data-parity-root>
        <MatSlideToggle
          checked={checked.value}
          onToggleChange$={() => toggleCount.value++}
          onChange$={next => {
            changeCount.value++;
            checked.value = next;
          }}
        >
          Noop toggle
        </MatSlideToggle>
        <p data-toggle-count>{toggleCount.value}</p>
        <p data-change-count>{changeCount.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
