import {component$} from '@qwik.dev/core';
import {MatTooltip} from '@angular-community/qwik-material/tooltip';

/** Mirrors `src/dev-app/qwik-parity/tooltip.ts`'s `TooltipShowHideDelay`. */
const Scenario = component$(() => {
  return (
    <div data-parity-root>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        message="Info about the action"
        showDelay={50}
        hideDelay={50}
        aria-label="Button that displays a tooltip with a 50ms show/hide delay"
      >
        Action
      </MatTooltip>
    </div>
  );
});

export default component$(() => (
  <>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </>
));
