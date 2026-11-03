import {component$} from '@qwik.dev/core';

// Mirrors src/dev-app/qwik-parity/core.ts's CoreTypography. Bespoke (not a ported
// material.angular.dev example) — exercises the opt-in `typography-prebuilt.css` export (see
// qwik-material/core/SYNC.md's "Typography + elevation classes" entry and the Theming guide).
export default component$(() => (
  <>
    <div data-parity-root class="mat-typography">
      <h1>Heading 1 (h1)</h1>
      <h2>Heading 2 (h2)</h2>
      <h3>Heading 3 (h3)</h3>
      <h4>Heading 4 (h4)</h4>
      <h5>Heading 5 (h5)</h5>
      <h6>Heading 6 (h6)</h6>
      <p>A paragraph inside .mat-typography.</p>
      <div class="mat-display-large">Display large</div>
      <div class="mat-headline-large">Headline large</div>
      <div class="mat-title-large">Title large</div>
      <div class="mat-body-large">Body large</div>
      <div class="mat-h1">.mat-h1 (back-compat)</div>
      <div class="mat-h6">.mat-h6 (back-compat)</div>
      <div class="mat-headline-1">.mat-headline-1 (back-compat)</div>
      <div class="mat-body">.mat-body (back-compat)</div>
      <div class="mat-body-strong">.mat-body-strong (back-compat)</div>
      <div class="mat-small">.mat-small (back-compat)</div>
      <div class="mat-caption">.mat-caption (back-compat)</div>
    </div>
    <div data-parity-root-bare>
      <div class="mat-h2">.mat-h2 outside .mat-typography</div>
      <div class="mat-display-small">.mat-display-small outside .mat-typography</div>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
