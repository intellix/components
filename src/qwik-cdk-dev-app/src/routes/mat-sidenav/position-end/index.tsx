import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavPositionEnd.
export default component$(() => {
  const openedSig = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer
            q:slot="end-drawer"
            position="end"
            mode="over"
            opened={openedSig.value}
            onOpenedChange$={$((v: boolean) => {
              openedSig.value = v;
            })}
          >
            <p>End drawer</p>
            <button
              type="button"
              onClick$={$(() => {
                openedSig.value = false;
              })}
            >
              Close
            </button>
          </MatDrawer>
          <MatDrawerContent>
            <button
              type="button"
              onClick$={$(() => {
                openedSig.value = !openedSig.value;
              })}
            >
              Toggle
            </button>
          </MatDrawerContent>
        </MatDrawerContainer>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
