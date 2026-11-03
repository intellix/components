import {component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';

// Proves the `color` prop accepts an app-defined palette name, not just
// upstream's 'primary'/'accent'/'warn' — upstream types the real `color`
// Input `string | null` (src/material/button/button-base.ts:96) and renders
// `mat-${color}` unconditionally, so a value like 'accent-outline' (an app's
// own custom palette, styled via its own CSS) is already valid upstream
// behavior, not a Qwik-only extension. See
// src/qwik-cdk-parity-tests/specs/material-button/color-custom.spec.ts.
export default component$(() => (
  <>
    <div data-parity-root>
      <MatButton color="accent-outline" appearance="filled">
        Custom
      </MatButton>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
