import {component$} from '@qwik.dev/core';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerContent,
} from '@angular-community/qwik-material/sidenav';
import './sidenav-overview-example.css';

// Qwik port of material.angular.dev's `sidenav-overview` docs example — see
// src/components-examples/material/sidenav/sidenav-overview/sidenav-overview-example.{ts,html,css}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/mat-sidenav/example
// (src/dev-app/qwik-parity/examples.ts). Host tag mirrors the example's own component selector
// (`sidenav-overview-example`).
//
// Upstream's own `shouldRun` field gates the whole example behind
// `/(^|.)(stackblitz|webcontainer).(io|com)$/.test(window.location.host)` — true only when the
// docs site's embedded StackBlitz/WebContainer preview serves it, so the example falls back to
// `<div>Please open on Stackblitz to see result</div>` everywhere else, INCLUDING this dev-app's
// own `localhost` host (confirmed live: the Angular side at :4200 renders exactly that fallback
// text, never the actual `<mat-sidenav-container>`). Reproduced here with the identical check —
// not hardcoded to the fallback branch — so this port stays correct if ever hosted somewhere the
// regex DOES match, exactly mirroring the upstream component's own logic rather than special-
// casing this harness's host.
function shouldRunOnStackblitz(): boolean {
  if (typeof location === 'undefined') return false;
  return /(^|.)(stackblitz|webcontainer).(io|com)$/.test(location.host);
}

export default component$(() => {
  const shouldRun = shouldRunOnStackblitz();

  return (
    <>
      <div data-parity-root>
        <sidenav-overview-example>
          {shouldRun ? (
            <MatDrawerContainer class="example-container">
              <MatDrawer mode="side" opened>
                Sidenav content
              </MatDrawer>
              <MatDrawerContent>Main content</MatDrawerContent>
            </MatDrawerContainer>
          ) : (
            <div>Please open on Stackblitz to see result</div>
          )}
        </sidenav-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
