import {$, component$, useSignal} from '@qwik.dev/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from '@angular-community/qwik-material/sidenav';

/**
 * Bespoke regression scenario: a sidenav container that starts OFF-SCREEN (like one rendered into
 * a closed portal/panel) and is only brought into view when the drawer is opened. Upstream enables
 * transitions from a constructor timer regardless of visibility, so the first open still animates.
 */
export default component$(() => {
  const opened = useSignal(false);
  return (
    <>
      <button
        id="open-drawer"
        type="button"
        onClick$={$(() => {
          opened.value = true;
        })}
      >
        Open
      </button>
      <div
        data-parity-root
        style={{
          position: 'fixed',
          top: '40px',
          left: '0',
          transform: opened.value ? 'none' : 'translateX(-200vw)',
        }}
      >
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer
            q:slot="start-drawer"
            mode="over"
            opened={opened.value}
            onOpenedChange$={$((v: boolean) => {
              opened.value = v;
            })}
          >
            Drawer content
          </MatDrawer>
          <MatDrawerContent>Main content</MatDrawerContent>
        </MatDrawerContainer>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
