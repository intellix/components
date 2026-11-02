import {component$, Slot} from '@qwik.dev/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';

// Mirrors the Angular dev-app's default icon font-set
// (DevAppLayout.toggleM3 → MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined'),
// src/dev-app/dev-app/dev-app-layout.ts, in effect by default since m3Enabled
// defaults to true) so every /mat-icon/* parity scenario resolves the same
// default font-set class as its Angular counterpart.
export default component$(() => (
  <QwikMaterialProvider matIconConfig={{fontSet: 'material-symbols-outlined'}}>
    <Slot />
  </QwikMaterialProvider>
));
