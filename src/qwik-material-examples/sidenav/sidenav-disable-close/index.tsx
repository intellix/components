import {component$} from '@qwik.dev/core';

// Qwik port of material.angular.dev's `sidenav-disable-close` docs example — see
// src/components-examples/material/sidenav/sidenav-disable-close/sidenav-disable-close-example.{ts,html,css}. Rendered unmodified by
// the Angular dev-app at /qwik-parity/examples/sidenav-disable-close (the generic `examples/:exampleId` route).
//
// Upstream gates its ENTIRE template behind
// `shouldRun = /(^|.)(stackblitz|webcontainer).(io|com)$/.test(window.location.host)` — true
// only inside the docs site's embedded StackBlitz/WebContainer preview, false on every other
// host (material.angular.dev itself, this dev-app's localhost, ...). Confirmed live: the Angular
// side here always renders exactly the fallback `<div>`, never the real sidenav markup — see
// `qwik-material-examples/sidenav/example/index.tsx`'s header comment for the first port to hit
// this. Reproduced with the identical fallback text; the real (unreachable-here) content isn't
// ported, since neither side ever renders it in this environment.

export default component$(() => (
  <sidenav-disable-close-example>
    <div>Please open on Stackblitz to see result</div>
  </sidenav-disable-close-example>
));
