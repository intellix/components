import {$, component$, useSignal, type QRL} from '@qwik.dev/core';
import type {NoSerialize} from '@qwik.dev/core';
import {useOverlay, createGlobalPositionStrategy} from '@angular-community/qwik-cdk/overlay';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';

/**
 * Exercises an app building its own overlay directly via `useOverlay()`
 * (no dialog/bottom-sheet service in between) — task: "Overlay service
 * provided + backdropClick on OverlayRef + default config". Covers:
 * - `useOverlay()` resolving to a working handle under `<QwikCdkRoot>`
 *   (previously nothing provided this at all — `useOverlay()` didn't work).
 * - `OverlayRef.backdropClick(callback)` firing on every backdrop click.
 * - `OverlayRef.detachments(callback)` firing exactly once on detach().
 *
 * The "Close" trigger lives INSIDE the overlay's own content (above the
 * backdrop) rather than as a page-level button, which the backdrop would
 * otherwise cover and make unclickable — same reasoning as the dialog/
 * bottom-sheet "allow close" scenarios.
 */
const Content = component$<{onClose$: QRL<() => void>}>(props => (
  <div class="overlay-content">
    <span class="overlay-message">Hello overlay</span>
    <button class="close-button" onClick$={props.onClose$}>
      Close
    </button>
  </div>
));

const Runner = component$(() => {
  const overlay = useOverlay();
  const refSig = useSignal<NoSerialize<OverlayRef> | null>(null);
  const backdropClicks = useSignal(0);
  const detachCount = useSignal(0);

  const onClose$ = $(() => {
    refSig.value?.dispose();
  });

  const onOpen$ = $(async () => {
    const ref = await overlay.create$(
      Content,
      {onClose$},
      {
        hasBackdrop: true,
        positionStrategy: createGlobalPositionStrategy().centerHorizontally().centerVertically(),
      },
    );
    if (!ref) return;
    ref.backdropClick(() => backdropClicks.value++);
    ref.detachments(() => detachCount.value++);
    refSig.value = ref;
  });

  return (
    <>
      <button class="open-button" onClick$={onOpen$}>
        Open
      </button>
      <div class="backdrop-click-count" data-backdrop-clicks>
        {backdropClicks.value}
      </div>
      <div class="detach-count" data-detach-count>
        {detachCount.value}
      </div>
    </>
  );
});

export default component$(() => (
  <>
    <div data-parity-root>
      <Runner />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
