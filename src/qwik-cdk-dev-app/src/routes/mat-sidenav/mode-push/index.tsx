import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavModePush. Angular never
// binds (opened)/(closed) on this drawer, so its "Opened: {{opened}}" text
// stays "false" forever — mirrored here with a signal that's likewise never
// written to.
export default component$(() => {
  const openedSig = useSignal(false);
  const opened = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer
            q:slot="start-drawer"
            mode="push"
            width="200px"
            opened={openedSig.value}
            onOpenedChange$={$((v: boolean) => {
              openedSig.value = v;
            })}
          >
            <p>Push drawer</p>
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
