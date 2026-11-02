import {component$} from '@qwik.dev/core';

// Qwik port of material.angular.dev's `sidenav-fixed` docs example — see
// src/components-examples/material/sidenav/sidenav-fixed/sidenav-fixed-example.{ts,html,css}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/examples/sidenav-fixed (the generic
// `examples/:exampleId` route).
//
// Same stackblitz-only gate as the other sidenav examples (see
// qwik-material-examples/sidenav/sidenav-mode/index.tsx's header comment) — this one's fallback
// text capitalizes "StackBlitz" differently from the others (verbatim upstream wording).

export default component$(() => (
  <sidenav-fixed-example>
    <div>Please open on StackBlitz to see result</div>
  </sidenav-fixed-example>
));
