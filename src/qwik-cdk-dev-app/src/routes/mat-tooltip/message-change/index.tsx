import {$, component$, useSignal} from '@qwik.dev/core';
import {MatTooltip} from '@angular-community/qwik-material/tooltip';

/**
 * Mirrors `src/dev-app/qwik-parity/tooltip.ts`'s `TooltipMessageChange`. See
 * that file's comment for why the message is changed via a keydown on the
 * trigger itself rather than a separate button (a click anywhere outside
 * the tooltip's panel closes it — see `angular-parity.spec.ts`'s header
 * note on `OverlayOutsideClickDispatcher`).
 */
const Scenario = component$(() => {
  const message = useSignal('Info about the action');

  return (
    <div data-parity-root>
      <MatTooltip
        as="button"
        class="tooltip-trigger"
        style="position: fixed; top: 120px; left: 120px; width: 160px; height: 48px;"
        message={message.value}
        aria-label="Button whose tooltip message can change while open"
        onKeyDown$={$((event: KeyboardEvent) => {
          if (event.key === 'm') {
            message.value = 'Updated tooltip text that is noticeably longer than before';
          }
        })}
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
