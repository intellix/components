import {component$} from '@qwik.dev/core';
import {MatTooltip} from '@angular-community/qwik-material/tooltip';

/** Mirrors `src/dev-app/qwik-parity/tooltip.ts`'s `TooltipPositionAtOrigin`. */
const Scenario = component$(() => {
  return (
    <div data-parity-root>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 160px; left: 160px; width: 200px; height: 200px;"
        message="Info about the action"
        positionAtOrigin
        aria-label="Button whose tooltip is positioned at the pointer origin"
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
