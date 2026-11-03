import {Component} from '@angular/core';

// Each scenario mirrors src/qwik-cdk-dev-app/src/routes/mat-core/<name>/index.tsx.
//
// Bespoke (not a ported material.angular.dev example) — `@angular/material/core`'s typography
// hierarchy (`mat.typography-hierarchy()`) and elevation classes (`mat.elevation-classes()`) are
// opt-in Sass mixins a consumer calls directly, not Angular directives/components, so there's no
// `[matFoo]`/`<mat-foo>` to reference here. `typography-elevation.generated.css` (loaded via
// `styleUrl` below) is the SAME file — byte-identical, not just "should match" — that
// `qwik-material/scripts/generate-typography-elevation-prebuilt.mjs` writes into
// `qwik-material/scss/core/{typography,elevation}-prebuilt.scss` (compiled from upstream's real
// `src/material/core/typography/_typography.scss` / `_core.scss` sources once, checked in, never
// hand-edited — see that script's own header comment, including the confirmed, real,
// `--mat-sys-shadow`-unwrapped-in-fallback upstream quirk that makes every `.mat-elevation-z*`
// compute to `box-shadow: none` by default). Both this page and the Qwik
// `typography-prebuilt.css`/`elevation-prebuilt.css` exports load that exact text, so a
// byte-for-byte DOM/computed-style comparison here is really testing "does this port apply the
// classes the same way", not "did two independently-written Sass recipes happen to agree".
@Component({
  template: `
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
    <!-- Outside .mat-typography: the bare M3/back-compat class selectors still apply (only the
         h1-h6/p TAG selectors need the .mat-typography ancestor). -->
    <div data-parity-root-bare>
      <div class="mat-h2">.mat-h2 outside .mat-typography</div>
      <div class="mat-display-small">.mat-display-small outside .mat-typography</div>
    </div>
  `,
  styleUrl: './typography-elevation.generated.css',
})
export class CoreTypography {}

@Component({
  template: `
    <div data-parity-root>
      <div class="mat-elevation-z0" style="width: 40px; height: 40px;">z0</div>
      <div class="mat-elevation-z2" style="width: 40px; height: 40px;">z2</div>
      <div class="mat-elevation-z4" style="width: 40px; height: 40px;">z4</div>
      <div class="mat-elevation-z8" style="width: 40px; height: 40px;">z8</div>
      <div class="mat-elevation-z16" style="width: 40px; height: 40px;">z16</div>
      <div class="mat-elevation-z24" style="width: 40px; height: 40px;">z24</div>
      <div class="mat-mdc-elevation-specific mat-elevation-z4" style="width: 40px; height: 40px;">
        specific-z4
      </div>
    </div>
  `,
  styleUrl: './typography-elevation.generated.css',
})
export class CoreElevation {}

export const CORE_SCENARIOS = {
  'typography': CoreTypography,
  'elevation': CoreElevation,
};
