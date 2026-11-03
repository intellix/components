import {component$, useSignal} from '@qwik.dev/core';
import {MatRadioGroup, MatRadioButton} from '@angular-community/qwik-material/radio';

/**
 * Qwik-only route (no Angular mirror — not part of the angular-parity.spec.ts contract).
 * Exercises `MatRadioGroup`'s new `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` contract
 * (see `qwik-material/radio/SYNC.md`'s "Form state" section) — specifically the "blur of ANY
 * radio in the group marks the GROUP touched" timing (upstream `_touch()`, called from every
 * `<MatRadioButton>`'s own `FocusMonitor` subscription, including when focus moves to ANOTHER
 * radio in the SAME group — the first one's blur still fires before the second one's focus
 * lands). A second, unbound group confirms NONE of the `ng-*` classes appear without `formBound`.
 */
export default component$(() => {
  const value = useSignal<string | undefined>(undefined);
  const touched = useSignal(false);
  const dirty = useSignal(false);
  const invalid = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatRadioGroup
          aria-label="Bound group"
          value={value.value}
          formBound
          touched={touched.value}
          dirty={dirty.value}
          invalid={invalid.value}
          onChange$={v => {
            dirty.value = true;
            value.value = v as string | undefined;
          }}
          onTouched$={() => (touched.value = true)}
        >
          <MatRadioButton value="a">A</MatRadioButton>
          <MatRadioButton value="b">B</MatRadioButton>
        </MatRadioGroup>
        <MatRadioGroup aria-label="Unbound group">
          <MatRadioButton value="x">X</MatRadioButton>
          <MatRadioButton value="y">Y</MatRadioButton>
        </MatRadioGroup>
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
