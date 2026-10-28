import {component$, useSignal} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';

/**
 * Qwik-only scenario (no Angular mirror). Exercises
 * `MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS.color` equivalent: a provider-level
 * default color applies when no per-instance `color` prop is given,
 * matching upstream's constructor `this.color = defaults.color || 'accent'`.
 * See specs/material-slide-toggle/config-default-color.spec.ts.
 */
export default component$(() => {
  const checked = useSignal(false);

  return (
    <QwikMaterialProvider matSlideToggleConfig={{color: 'warn'}}>
      <div data-parity-root>
        <MatSlideToggle checked={checked.value} onChange$={next => (checked.value = next)}>
          Warn-colored toggle
        </MatSlideToggle>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
