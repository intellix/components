import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

// Port of src/components-examples/material/icon/icon-overview
// (icon-overview-example.html/.ts) — material.angular.dev's "Basic icons"
// example. No CSS file upstream. The default font-set
// ('material-symbols-outlined') comes from this route's ancestor
// ../layout.tsx, matching the Angular dev-app's default (m3Enabled).
export default component$(() => (
  <>
    <div data-parity-root>
      <icon-overview-example>
        <MatIcon aria-hidden={false} aria-label="Example home icon" fontIcon="home" />
      </icon-overview-example>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
