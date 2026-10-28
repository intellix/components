import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavHasBackdropFalse.
export default component$(() => {
  const openedSig = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer hasBackdrop={false} style="height: 300px; width: 600px">
          <MatDrawer
            q:slot="start-drawer"
            mode="over"
            opened={openedSig.value}
            onOpenedChange$={$((v: boolean) => {
              openedSig.value = v;
            })}
          >
            <p>Drawer without backdrop</p>
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
