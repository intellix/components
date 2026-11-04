import {component$, Slot} from '@qwik.dev/core';
import {useMatIconProvider} from '@angular-community/qwik-material/icon';

// Mirrors the Angular dev-app's default icon font-set
// (DevAppLayout.toggleM3 → MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined'),
// src/dev-app/dev-app/dev-app-layout.ts, in effect by default since m3Enabled
// defaults to true) so every /mat-stepper/* scenario's step-icon <mat-icon>s
// (done/edit/error states) resolve the same default font-set class as their
// Angular counterparts — same as `mat-icon/layout.tsx`, which this mirrors.
// `error-state/index.tsx` additionally calls `useMatStepperProvider()` for
// `stepperGlobalOptions` — since each provider hook provides ONLY its own context, that call
// doesn't reset the `matIconConfig` provided here; it's still inherited.
export default component$(() => {
  useMatIconProvider({fontSet: 'material-symbols-outlined'});
  return <Slot />;
});
