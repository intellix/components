import {component$, useSignal} from '@qwik.dev/core';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';

/**
 * Qwik-only route (no Angular mirror — not part of the angular-parity.spec.ts contract).
 * Exercises `MatSlideToggle`'s new `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` contract
 * (see `qwik-material/slide-toggle/SYNC.md`'s "Form state" section): toggle #0 is bound, #1 is a
 * plain, unbound toggle (must carry NONE of the `ng-*` classes, ever).
 */
export default component$(() => {
  const checked = useSignal(false);
  const touched = useSignal(false);
  const dirty = useSignal(false);
  const invalid = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatSlideToggle
          checked={checked.value}
          formBound
          touched={touched.value}
          dirty={dirty.value}
          invalid={invalid.value}
          onChange$={next => {
            dirty.value = true;
            checked.value = next;
          }}
          onTouched$={() => (touched.value = true)}
        >
          Bound toggle
        </MatSlideToggle>
        <MatSlideToggle checked={false}>Unbound toggle</MatSlideToggle>
        <button type="button" onClick$={() => (invalid.value = !invalid.value)}>
          Toggle invalid
        </button>
        <p>
          touched: {String(touched.value)}, dirty: {String(dirty.value)}, invalid:{' '}
          {String(invalid.value)}
        </p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
