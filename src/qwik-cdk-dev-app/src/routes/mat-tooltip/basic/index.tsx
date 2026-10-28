import {component$} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatTooltip} from '@angular-community/qwik-material/tooltip';

/** Mirrors `src/dev-app/qwik-parity/tooltip.ts`'s `TooltipBasic`. */
const Scenario = component$(() => {
  return (
    <div data-parity-root>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        message="Info about the action"
        aria-label="Button that displays a tooltip when hovered or focused"
      >
        Action
      </MatTooltip>
    </div>
  );
});

export default component$(() => (
  <QwikMaterialProvider>
    <Scenario />
    <main data-scenario-ready>ready</main>
  </QwikMaterialProvider>
));
