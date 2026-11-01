import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavModeSide. Same
// never-wired (opened)/(closed) text behavior as mode-push.
export default component$(() => {
  const openedSig = useSignal(false);
  const opened = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer
            q:slot="start-drawer"
            mode="side"
            width="180px"
            opened={openedSig.value}
            onOpenedChange$={$((v: boolean) => {
              openedSig.value = v;
            })}
          >
            <p>Side drawer</p>
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
