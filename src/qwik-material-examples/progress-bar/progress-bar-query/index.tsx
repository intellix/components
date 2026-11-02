import {component$} from '@qwik.dev/core';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

// Port of src/components-examples/material/progress-bar/progress-bar-query
// (progress-bar-query-example.html/.ts) — material.angular.dev's
// "Query progress-bar" example. No CSS file upstream.

export default component$(() => {
  return (
    <progress-bar-query-example>
      <MatProgressBar mode="query" />
    </progress-bar-query-example>
  );
});
