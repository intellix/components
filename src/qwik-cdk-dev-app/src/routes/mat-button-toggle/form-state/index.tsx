import {component$, useSignal} from '@qwik.dev/core';
import {MatButtonToggleGroup, MatButtonToggle} from '@angular-community/qwik-material/button-toggle';

/**
 * Qwik-only route (no Angular mirror — not part of the angular-parity.spec.ts contract).
 * Exercises `MatButtonToggleGroup`'s new `formBound`/`touched`/`dirty`/`invalid`/`onTouched$`
 * contract (see `qwik-material/button-toggle/SYNC.md`'s "Form state" section) — specifically the
 * CLICK-driven (not blur-driven, unlike checkbox/radio/slide-toggle) `_onTouched()` timing:
 *
 * - `group1` starts with nothing selected: clicking a toggle (a real selection change) marks it
 *   touched.
 * - `group2` starts PRE-selected to "a": re-clicking the ALREADY-selected toggle is upstream's
 *   own documented no-op (`newChecked !== this._checked` is false) and must NOT mark it touched;
 *   clicking a DIFFERENT toggle afterward (a real change) must.
 * - `group3` is multi-select: every non-disabled click flips that toggle's own checked state, so
 *   `onTouched$` fires unconditionally, even on the FIRST click.
 */
export default component$(() => {
  const value1 = useSignal<string | undefined>(undefined);
  const touched1 = useSignal(false);

  const value2 = useSignal<string | undefined>('a');
  const touched2 = useSignal(false);

  const values3 = useSignal<readonly unknown[]>([]);
  const touched3 = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatButtonToggleGroup
          aria-label="group1"
          value={value1.value}
          formBound
          touched={touched1.value}
          onChange$={v => (value1.value = v as string | undefined)}
          onTouched$={() => (touched1.value = true)}
        >
          <MatButtonToggle value="a">A</MatButtonToggle>
          <MatButtonToggle value="b">B</MatButtonToggle>
        </MatButtonToggleGroup>
        <p>group1 touched: {String(touched1.value)}</p>

        <MatButtonToggleGroup
          aria-label="group2"
          value={value2.value}
          formBound
          touched={touched2.value}
          onChange$={v => (value2.value = v as string | undefined)}
          onTouched$={() => (touched2.value = true)}
        >
          <MatButtonToggle value="a">A</MatButtonToggle>
          <MatButtonToggle value="b">B</MatButtonToggle>
        </MatButtonToggleGroup>
        <p>group2 touched: {String(touched2.value)}</p>

        <MatButtonToggleGroup
          aria-label="group3"
          multiple
          values={values3.value}
          formBound
          touched={touched3.value}
          onValuesChange$={v => (values3.value = v)}
          onTouched$={() => (touched3.value = true)}
        >
          <MatButtonToggle value="x">X</MatButtonToggle>
          <MatButtonToggle value="y">Y</MatButtonToggle>
        </MatButtonToggleGroup>
        <p>group3 touched: {String(touched3.value)}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
