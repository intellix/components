import {component$} from '@qwik.dev/core';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';

// Qwik port of material.angular.dev's `toolbar-simple` docs example — see
// src/components-examples/material/toolbar/toolbar-simple/toolbar-simple-example.{ts,html}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/toolbar-simple
// (src/dev-app/qwik-parity/examples.ts' generic `examples/:exampleId` route).

export default component$(() => (
  <toolbar-simple-example>
    <MatToolbar>
      <span>My Application</span>
    </MatToolbar>
  </toolbar-simple-example>
));
