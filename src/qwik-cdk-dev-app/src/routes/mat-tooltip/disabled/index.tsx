import {component$} from '@qwik.dev/core';
import {MatTooltip} from '@angular-community/qwik-material/tooltip';

/** Mirrors `src/dev-app/qwik-parity/tooltip.ts`'s `TooltipDisabled`. */
const Scenario = component$(() => {
  return (
    <div data-parity-root>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        message="Info about the action"
        disabled
        aria-label="Button whose tooltip is disabled"
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
