import {component$, Slot} from '@qwik.dev/core';
import {useMatIconProvider} from '@angular-community/qwik-material/icon';

// Mirrors the Angular dev-app's default icon font-set
// (DevAppLayout.toggleM3 -> MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined'),
// src/dev-app/dev-app/dev-app-layout.ts, in effect by default since m3Enabled defaults to true)
// so every /examples/<id> docs-example parity route resolves the same default font-set class as
// its Angular counterpart — same pattern (and same reasoning) as
// src/qwik-cdk-dev-app/src/routes/mat-icon/layout.tsx. Applies to every batch's examples/<id>
// routes, not just this batch's own (any bare, no-fontSet `<MatIcon>` usage needs this).
export default component$(() => {
  useMatIconProvider({fontSet: 'material-symbols-outlined'});
  return (
    <>
      <Slot />
    </>
  );
});
