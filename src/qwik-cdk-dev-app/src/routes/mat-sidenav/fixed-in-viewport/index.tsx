import {component$} from '@qwik.dev/core';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular-community/qwik-material/sidenav';

// Mirrors src/dev-app/qwik-parity/sidenav.ts's SidenavFixedInViewport — the
// only scenario using the mat-sidenav-* tags instead of mat-drawer-*, to
// prove they add nothing beyond one extra class each. No interaction.
export default component$(() => {
  return (
    <>
      <div data-parity-root>
        <MatSidenavContainer style="height: 300px; width: 600px">
          <MatSidenav
            q:slot="start-drawer"
            mode="side"
            opened={true}
            fixedInViewport={true}
            fixedTopGap={64}
            fixedBottomGap={32}
            width="200px"
          >
            <p>Fixed sidenav</p>
          </MatSidenav>
          <MatSidenavContent>
            <p>Content</p>
          </MatSidenavContent>
        </MatSidenavContainer>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
