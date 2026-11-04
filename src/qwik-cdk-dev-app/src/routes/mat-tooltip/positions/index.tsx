import {component$} from '@qwik.dev/core';
import {MatTooltip} from '@angular-community/qwik-material/tooltip';

/** Mirrors `src/dev-app/qwik-parity/tooltip.ts`'s `TooltipPositions`. */
const Scenario = component$(() => {
  return (
    <div data-parity-root>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 100px; left: 320px; width: 160px; height: 48px;"
        message="Info about the action"
        position="above"
        aria-label="Button with a tooltip positioned above"
      >
        above
      </MatTooltip>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 180px; left: 320px; width: 160px; height: 48px;"
        message="Info about the action"
        position="left"
        aria-label="Button with a tooltip positioned to the left"
      >
        left
      </MatTooltip>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 260px; left: 320px; width: 160px; height: 48px;"
        message="Info about the action"
        position="right"
        aria-label="Button with a tooltip positioned to the right"
      >
        right
      </MatTooltip>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 340px; left: 320px; width: 160px; height: 48px;"
        message="Info about the action"
        position="before"
        aria-label="Button with a tooltip positioned before (start)"
      >
        before
      </MatTooltip>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 420px; left: 320px; width: 160px; height: 48px;"
        message="Info about the action"
        position="after"
        aria-label="Button with a tooltip positioned after (end)"
      >
        after
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
