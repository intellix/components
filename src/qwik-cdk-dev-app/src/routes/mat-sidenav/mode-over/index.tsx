import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavModeOver. Angular calls
// drawer.toggle()/drawer.close() imperatively via a template ref; this port's
// MatDrawer is a controlled component, so the "Toggle"/"Close" buttons flip
// the same `opened` signal directly instead.
export default component$(() => {
  const openedSig = useSignal(false);
  const opened = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer
            q:slot="start-drawer"
            mode="over"
            opened={openedSig.value}
            onOpenedChange$={$((v: boolean) => {
              openedSig.value = v;
            })}
            onOpened$={$(() => {
              opened.value = true;
            })}
            onClosed$={$(() => {
              opened.value = false;
            })}
          >
            <p>Drawer content</p>
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
            <p>Opened: {opened.value ? 'true' : 'false'}</p>
          </MatDrawerContent>
        </MatDrawerContainer>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
