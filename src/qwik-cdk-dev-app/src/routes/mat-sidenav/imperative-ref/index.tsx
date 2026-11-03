import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
  useMatDrawerRef,
} from '@angular-community/qwik-material/sidenav';

/**
 * Qwik-only functional scenario (no Angular mirror — upstream's own ability to call
 * `drawer.open()`/`.close()`/`.toggle()` from a template-ref variable has no DOM-visible
 * counterpart to diff; what matters here is this port's `Promise`-returning behavior itself).
 * `useMatDrawerRef()` — see `use-mat-drawer-ref.ts` — coexists with the existing controlled
 * `opened`/`onOpenedChange$` API with ZERO changes to `<MatDrawer>`: the hook's `opened` signal
 * and `onOpenedChange$` QRL are simply wired into the SAME props every other sidenav scenario
 * uses directly.
 */
export default component$(() => {
  const drawerRef = useMatDrawerRef();
  const lastResult = useSignal('');
  const openedCount = useSignal(0);
  const closedCount = useSignal(0);

  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer
            q:slot="start-drawer"
            mode="side"
            opened={drawerRef.opened.value}
            onOpenedChange$={drawerRef.onOpenedChange$}
            onOpened$={$(() => {
              openedCount.value++;
            })}
            onClosed$={$(() => {
              closedCount.value++;
            })}
          >
            <p>Drawer content</p>
          </MatDrawer>
          <MatDrawerContent>
            <button
              id="open-btn"
              type="button"
              onClick$={$(async () => {
                lastResult.value = await drawerRef.open$();
              })}
            >
              Open (imperative)
            </button>
            <button
              id="close-btn"
              type="button"
              onClick$={$(async () => {
                lastResult.value = await drawerRef.close$();
              })}
            >
              Close (imperative)
            </button>
            <button
              id="toggle-btn"
              type="button"
              onClick$={$(async () => {
                lastResult.value = await drawerRef.toggle$();
              })}
            >
              Toggle (imperative)
            </button>
            <p data-last-result>{lastResult.value}</p>
            <p data-opened-count>{openedCount.value}</p>
            <p data-closed-count>{closedCount.value}</p>
            <p data-opened-signal>{drawerRef.opened.value ? 'true' : 'false'}</p>
          </MatDrawerContent>
        </MatDrawerContainer>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
