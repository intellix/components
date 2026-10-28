import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavAutosize. The drawer
// never toggles opened/closed here — only its content's width changes,
// exercising the ResizeObserver-driven width remeasurement (see
// mat-drawer.tsx) that keeps content margins in sync.
export default component$(() => {
  const fillerWidth = useSignal(0);

  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer autosize={true} style="height: 300px; width: 600px">
          <MatDrawer q:slot="start-drawer" mode="push" opened={true} width="auto">
            <p>Autosizing drawer</p>
            <div style={{width: `${fillerWidth.value}px`, height: '20px'}} />
            <button
              type="button"
              onClick$={$(() => {
                fillerWidth.value = fillerWidth.value ? 0 : 150;
              })}
            >
              Toggle extra width
            </button>
          </MatDrawer>
          <MatDrawerContent>
            <p>Main content</p>
          </MatDrawerContent>
        </MatDrawerContainer>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
