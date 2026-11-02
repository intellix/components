import {component$} from '@qwik.dev/core';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

// Port of src/components-examples/material/progress-bar/progress-bar-buffer
// (progress-bar-buffer-example.html/.ts) — material.angular.dev's
// "Buffer progress-bar" example. No CSS file upstream.

export default component$(() => {
  return (
    <progress-bar-buffer-example>
      <MatProgressBar mode="buffer" />
    </progress-bar-buffer-example>
  );
});
