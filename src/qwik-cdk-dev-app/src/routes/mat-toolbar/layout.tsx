import {component$, Slot} from '@qwik.dev/core';
import {useMatIconProvider} from '@angular-community/qwik-material/icon';

// Mirrors the Angular dev-app's default icon font-set
// (DevAppLayout.toggleM3 → MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined'),
// src/dev-app/dev-app/dev-app-layout.ts, in effect by default since m3Enabled
// defaults to true) so the /mat-toolbar/example scenario's toolbar <mat-icon>s
// (menu/favorite/share) resolve the same default font-set class as their
// Angular counterpart — same as `mat-icon/layout.tsx` and `mat-stepper/layout.tsx`.
export default component$(() => {
  useMatIconProvider({fontSet: 'material-symbols-outlined'});
  return (
    <>
      <Slot />
    </>
  );
});
