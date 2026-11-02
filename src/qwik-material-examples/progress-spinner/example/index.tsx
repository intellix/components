import {component$} from '@qwik.dev/core';
import {MatSpinner} from '@angular-community/qwik-material/progress-spinner';

// Port of src/components-examples/material/progress-spinner/progress-spinner-overview
// (progress-spinner-overview-example.html/.ts) — material.angular.dev's
// "Basic progress-spinner" example (`<mat-spinner>`, indeterminate mode by
// default). No CSS file upstream.

export default component$(() => {
  return (
    <progress-spinner-overview-example>
      <MatSpinner />
    </progress-spinner-overview-example>
  );
});
