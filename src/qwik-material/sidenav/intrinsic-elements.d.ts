import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Sidenav's custom-element tag
 * names. Upstream renders these as actual custom elements; external CMS
 * styles may target the tags directly (not just the `.mat-drawer-*`/
 * `.mat-sidenav-*` classes). Typed as `QwikIntrinsicElements['div']` — no
 * custom camelCase attrs need widening.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-drawer-container': QwikIntrinsicElements['div'];
      'mat-drawer': QwikIntrinsicElements['div'];
      'mat-drawer-content': QwikIntrinsicElements['div'];
      'mat-sidenav-container': QwikIntrinsicElements['div'];
      'mat-sidenav': QwikIntrinsicElements['div'];
      'mat-sidenav-content': QwikIntrinsicElements['div'];
    }
  }
}
