import {component$} from '@builder.io/qwik';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavTwoDrawers. No
// interaction — checks the synchronous-at-load render only.
export default component$(() => {
  return (
    <>
      <div data-parity-root>
        <MatDrawerContainer style="height: 300px; width: 600px">
          <MatDrawer q:slot="start-drawer" position="start" mode="side" opened={true} width="150px">
            <p>Start</p>
          </MatDrawer>
          <MatDrawer q:slot="end-drawer" position="end" mode="side" opened={true} width="120px">
            <p>End</p>
          </MatDrawer>
          <MatDrawerContent>
            <p>Content between two side drawers</p>
          </MatDrawerContent>
        </MatDrawerContainer>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
