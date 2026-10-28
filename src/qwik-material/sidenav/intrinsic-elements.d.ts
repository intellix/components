import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Sidenav's custom-element tag
 * names. Upstream renders these as actual custom elements; external CMS
 * styles may target the tags directly (not just the `.mat-drawer-*`/
 * `.mat-sidenav-*` classes). Typed as `QwikIntrinsicElements['div']` — no
 * custom camelCase attrs need widening (`inert` is passed as a plain string
 * attribute value, already valid on `div`).
 */
declare module '@builder.io/qwik' {
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
