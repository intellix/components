import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

/**
 * Qwik-only regression scenario (no Angular mirror): a controlled `over` drawer whose consumer
 * writes `onOpenedChange$`'s value back into `opened`, opened and closed again before the open's
 * 400 ms transition settles — as a sidebar link that navigates (and so closes its sidebar) right
 * after the sidebar was opened. `data-changes` counts the drawer's `onOpenedChange$` calls.
 */
export default component$(() => {
  const opened = useSignal(false);
  const changes = useSignal(0);

  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer
            q:slot="start-drawer"
            mode="over"
            opened={opened.value}
            onOpenedChange$={$((value: boolean) => {
              changes.value++;
              opened.value = value;
            })}
          >
            <p>Drawer content</p>
          </MatDrawer>
          <MatDrawerContent>
            <button
              id="open-then-close"
              type="button"
              onClick$={$(() => {
                opened.value = true;
                setTimeout(() => (opened.value = false), 100);
              })}
            >
              Open, then close 100 ms later
            </button>
          </MatDrawerContent>
        </MatDrawerContainer>
      </div>
      <p>
        opened: <span data-opened>{String(opened.value)}</span>, changes:{' '}
        <span data-changes>{changes.value}</span>
      </p>
      <main data-scenario-ready>ready</main>
    </>
  );
});
