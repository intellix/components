import {component$, useSignal} from '@qwik.dev/core';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

/**
 * Qwik-only route (no Angular mirror — not part of the angular-parity.spec.ts contract).
 * Exercises `MatCheckbox`'s new `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` contract
 * (see `qwik-material/checkbox/SYNC.md`'s "Form state" section): checkbox #0 is bound (wired to
 * local signals, same shape a form library's `field.props`/`markAsTouched$` would feed), #1 is a
 * plain, unbound checkbox (must carry NONE of the `ng-*` classes, ever). A "Toggle invalid"
 * button flips the pre-computed `invalid` prop directly, since nothing about clicking/blurring a
 * checkbox itself can make it invalid (no validator lives inside `MatCheckbox`).
 */
export default component$(() => {
  const checked = useSignal(false);
  const touched = useSignal(false);
  const dirty = useSignal(false);
  const invalid = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatCheckbox
          checked={checked.value}
          formBound
          touched={touched.value}
          dirty={dirty.value}
          invalid={invalid.value}
          onChange$={event => {
            dirty.value = true;
            checked.value = event.checked;
          }}
          onTouched$={() => (touched.value = true)}
        >
          Bound checkbox
        </MatCheckbox>
        <MatCheckbox checked={false}>Unbound checkbox</MatCheckbox>
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
