import {component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {useMatTooltip} from '@angular-community/qwik-material/tooltip';

/**
 * Bespoke regression scenario: a tooltip with a show delay longer than the panel's hide-animation
 * fallback must show on EVERY hover, not just the first. The trigger's `everShown` flag used to
 * survive into the next overlay, so the fresh panel finished a "hide" before its show delay ended.
 */
export default component$(() => {
  const tip = useMatTooltip({message: 'Info about the action', showDelay: 300, hideDelay: 100});
  return (
    <>
      <div data-parity-root style="padding: 80px">
        <MatButton {...tip.hostProps}>Action</MatButton>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
