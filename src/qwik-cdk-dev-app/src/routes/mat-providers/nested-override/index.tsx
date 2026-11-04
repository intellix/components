import {component$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatTooltip, useMatTooltipProvider} from '@angular-community/qwik-material/tooltip';

/**
 * This nested component overrides JUST the tooltip defaults for its own subtree (both delays
 * 0ms, instead of the root layout's 400ms/0ms) — the form field below, and the OTHER tooltip
 * trigger outside this component, must still see the root layout's `useMatProviders()` config
 * unaffected: only THIS one setting changed, in only THIS one subtree (each provider hook
 * provides ONLY its own context).
 */
const FastTooltipArea = component$(() => {
  useMatTooltipProvider({showDelay: 0, hideDelay: 0});
  return (
    <MatTooltip
      as="button"
      class="tooltip-override"
      style="position: fixed; top: 40px; left: 40px; width: 160px; height: 48px;"
      message="Fast tooltip"
      aria-label="Button with an overridden, fast-showing tooltip"
    >
      Fast
    </MatTooltip>
  );
});

export default component$(() => (
  <>
    <div data-parity-root>
      <MatFormField
        style="width: 300px"
        label={<MatLabel>Fruit</MatLabel>}
        control={<MatInput placeholder="test" />}
      />
      <MatTooltip
        as="button"
        class="tooltip-root"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        message="Slow tooltip"
        aria-label="Button still using the root provider's slow delay"
      >
        Slow
      </MatTooltip>
      <FastTooltipArea />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
