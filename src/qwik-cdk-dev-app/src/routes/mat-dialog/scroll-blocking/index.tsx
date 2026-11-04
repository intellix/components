import {$, component$} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import {MatScenarioBody} from '../../../scenarios/_mat-template';

/**
 * Exercises the default `MatDialogConfig.scrollStrategy` (upstream always
 * blocks background scroll while a modal dialog is open — see
 * `qwik-material/dialog/SYNC.md`'s "scroll strategy lost after resume"
 * entry for the real bug this scenario catches: before the fix, the
 * scroll strategy was silently missing entirely on every dialog opened
 * after a real page load, not just when a custom factory was configured).
 * A tall spacer makes the page scrollable, which `BlockScrollStrategy`
 * requires to actually apply its marker class.
 */
const Runner = component$(() => {
  const dialog = useMatDialog();
  const onOpen$ = $(async () => {
    await dialog.open$(MatScenarioBody, {hasBackdrop: true});
  });
  return (
    <button class="open-button" onClick$={onOpen$}>
      Open
    </button>
  );
});

export default component$(() => (
  <>
    <div data-parity-root>
      <Runner />
    </div>
    <main data-scenario-ready>ready</main>
    <div style="height: 3000px;" />
  </>
));
