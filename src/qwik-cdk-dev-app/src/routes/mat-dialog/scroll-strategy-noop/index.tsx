import {$, component$} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import {MatScenarioBody} from '../../../scenarios/_mat-template';

/**
 * Exercises a PER-OPEN override of `MatDialogConfig.scrollStrategy` — a
 * plain, serializable `ScrollStrategyDescriptor` (`'noop'` here) rather
 * than the context-level `MAT_DIALOG_SCROLL_STRATEGY` default
 * (`'block'`). See `qwik-material/dialog/SYNC.md`'s "scroll strategy lost
 * after resume" entry: the fix for the underlying bug (a configured
 * descriptor surviving a real SSR→CSR resume) applies identically to a
 * per-call override, not just the context-level default — this scenario
 * proves background scroll is NOT blocked when `'noop'` is explicitly
 * requested, even though the port's own default would otherwise block it.
 * A tall spacer makes the page scrollable, matching `scroll-blocking`'s
 * own rationale for why that's needed to observe the effect at all.
 */
const Runner = component$(() => {
  const dialog = useMatDialog();
  const onOpen$ = $(async () => {
    await dialog.open$(MatScenarioBody, {hasBackdrop: true, scrollStrategy: 'noop'});
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
