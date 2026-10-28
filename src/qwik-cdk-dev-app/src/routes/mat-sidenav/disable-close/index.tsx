import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavDisableClose. There is
// deliberately no "Close" button inside the drawer, and the content only
// ever opens (drawer.open() upstream — setting the signal true directly
// here, since open() always ends up true regardless of current state).
export default component$(() => {
  const openedSig = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer
            q:slot="start-drawer"
            mode="over"
            disableClose={true}
            opened={openedSig.value}
            onOpenedChange$={$((v: boolean) => {
              openedSig.value = v;
            })}
          >
            <p>Cannot be closed via escape/backdrop</p>
          </MatDrawer>
          <MatDrawerContent>
            <button
              type="button"
              onClick$={$(() => {
                openedSig.value = true;
              })}
            >
              Open
            </button>
          </MatDrawerContent>
        </MatDrawerContainer>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
