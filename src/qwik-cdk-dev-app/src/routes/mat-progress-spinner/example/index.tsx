import {component$} from '@builder.io/qwik';
import {MatSpinner} from '@angular-community/qwik-material/progress-spinner';

// Port of src/components-examples/material/progress-spinner/progress-spinner-overview
// (progress-spinner-overview-example.html/.ts) — material.angular.dev's
// "Basic progress-spinner" example (`<mat-spinner>`, indeterminate mode by
// default). No CSS file upstream.
export default component$(() => (
  <>
    <div data-parity-root>
      <progress-spinner-overview-example>
        <MatSpinner />
      </progress-spinner-overview-example>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
