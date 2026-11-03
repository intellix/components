import {component$} from '@qwik.dev/core';
import {MatIcon} from '@angular-community/qwik-material/icon';

// Proves the `color` prop accepts an app-defined palette name, not just
// upstream's 'primary'/'accent'/'warn' — upstream types the real `color`
// setter `string | null | undefined` (src/material/icon/icon.ts:168) and
// renders `mat-${color}` unconditionally, so a value like 'brand-highlight'
// (an app's own custom palette, styled via its own CSS) is already valid
// upstream behavior, not a Qwik-only extension. See
// src/qwik-cdk-parity-tests/specs/material-icon/color-custom.spec.ts.
export default component$(() => (
  <>
    <div data-parity-root>
      <MatIcon color="brand-highlight">home</MatIcon>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
