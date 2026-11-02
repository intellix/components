import {component$} from '@qwik.dev/core';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

// Port of src/components-examples/material/progress-bar/progress-bar-determinate
// (progress-bar-determinate-example.html/.ts) — material.angular.dev's
// "Determinate progress-bar" example. No CSS file upstream.

export default component$(() => {
  return (
    <progress-bar-determinate-example>
      <MatProgressBar mode="determinate" value={40} />
    </progress-bar-determinate-example>
  );
});
