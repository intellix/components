import {component$} from '@qwik.dev/core';

// Mirrors src/dev-app/qwik-parity/core.ts's CoreElevation. Bespoke (not a ported
// material.angular.dev example) — exercises the opt-in `elevation-prebuilt.css` export (see
// qwik-material/core/SYNC.md's "Typography + elevation classes" entry and the Theming guide).
export default component$(() => (
  <>
    <div data-parity-root>
      <div class="mat-elevation-z0" style="width: 40px; height: 40px;">
        z0
      </div>
      <div class="mat-elevation-z2" style="width: 40px; height: 40px;">
        z2
      </div>
      <div class="mat-elevation-z4" style="width: 40px; height: 40px;">
        z4
      </div>
      <div class="mat-elevation-z8" style="width: 40px; height: 40px;">
        z8
      </div>
      <div class="mat-elevation-z16" style="width: 40px; height: 40px;">
        z16
      </div>
      <div class="mat-elevation-z24" style="width: 40px; height: 40px;">
        z24
      </div>
      <div class="mat-mdc-elevation-specific mat-elevation-z4" style="width: 40px; height: 40px;">
        specific-z4
      </div>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
