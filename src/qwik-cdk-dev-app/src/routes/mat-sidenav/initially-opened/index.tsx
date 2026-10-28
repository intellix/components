import {component$} from '@builder.io/qwik';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavInitiallyOpened. No
// interaction at all — checks the synchronous-at-load render only.
export default component$(() => {
  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer q:slot="start-drawer" mode="side" opened={true} width="220px">
            <p>Already open</p>
          </MatDrawer>
          <MatDrawerContent>
            <p>Always open on load</p>
          </MatDrawerContent>
        </MatDrawerContainer>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
