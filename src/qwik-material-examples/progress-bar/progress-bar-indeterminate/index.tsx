import {component$} from '@qwik.dev/core';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

// Port of src/components-examples/material/progress-bar/progress-bar-indeterminate
// (progress-bar-indeterminate-example.html/.ts) — material.angular.dev's
// "Indeterminate progress-bar" example. No CSS file upstream.

export default component$(() => {
  return (
    <progress-bar-indeterminate-example>
      <MatProgressBar mode="indeterminate" />
    </progress-bar-indeterminate-example>
  );
});
