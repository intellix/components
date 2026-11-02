import {component$, useSignal} from '@qwik.dev/core';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

/**
 * Port of material.angular.dev's `button-toggle-mode` docs example
 * (src/components-examples/material/button-toggle/button-toggle-mode/) — single-select vs.
 * multiple-select groups.
 *
 * Upstream's two checkboxes toggle `hideSingleSelectionIndicator`/`hideMultipleSelectionIndicator`
 * on each group — NEITHER prop is ported (see qwik-material/button-toggle/SYNC.md's "Deviations
 * from upstream" §6: both are always `false` upstream's own default, so the pseudo-checkbox is
 * unconditionally rendered — matching the initial, unchecked-checkboxes DOM exactly). The
 * checkboxes are kept here (same initial DOM either way) but their `onChange$` only updates local
 * signals with no visual effect, since there is no group prop to feed them into yet.
 */
export default component$(() => {
  const hideSingleSelectionIndicator = useSignal(false);
  const hideMultipleSelectionIndicator = useSignal(false);
  const favoriteColor = useSignal<string | undefined>(undefined);
  const ingredients = useSignal<readonly unknown[]>([]);

  return (
    <button-toggle-mode-example>
      <section>
        <MatCheckbox
          checked={hideSingleSelectionIndicator.value}
          onChange$={e => (hideSingleSelectionIndicator.value = e.checked)}
        >
          Hide Single Selection Indicator
        </MatCheckbox>
        <MatCheckbox
          checked={hideMultipleSelectionIndicator.value}
          onChange$={e => (hideMultipleSelectionIndicator.value = e.checked)}
        >
          Hide Multiple Selection Indicator
        </MatCheckbox>
      </section>
      <section>
        <h3>Single selection</h3>
        <MatButtonToggleGroup
          name="favoriteColor"
          aria-label="Favorite Color"
          value={favoriteColor.value}
          onChange$={v => (favoriteColor.value = v as string | undefined)}
        >
          <MatButtonToggle value="red">Red</MatButtonToggle>
          <MatButtonToggle value="green">Green</MatButtonToggle>
          <MatButtonToggle value="blue">Blue</MatButtonToggle>
        </MatButtonToggleGroup>
      </section>
      <section>
        <h3>Multiple selection</h3>
        <MatButtonToggleGroup
          name="ingredients"
          aria-label="Ingredients"
          multiple
          values={ingredients.value}
          onValuesChange$={v => (ingredients.value = v)}
        >
          <MatButtonToggle value="flour">Flour</MatButtonToggle>
          <MatButtonToggle value="eggs">Eggs</MatButtonToggle>
          <MatButtonToggle value="sugar">Sugar</MatButtonToggle>
        </MatButtonToggleGroup>
      </section>
    </button-toggle-mode-example>
  );
});
