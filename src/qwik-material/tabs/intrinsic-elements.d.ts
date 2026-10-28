import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Tabs' custom-element tag
 * names. Upstream renders `<mat-tab-group>`, `<mat-tab-header>`,
 * `<mat-tab-body>` and `<mat-tab-nav-panel>` as actual custom elements;
 * external CMS styles may target these tags directly (not just their
 * classes). Typed as `QwikIntrinsicElements['div']` — none of these need
 * any custom camelCase attrs widened.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-tab-group': QwikIntrinsicElements['div'];
      'mat-tab-header': QwikIntrinsicElements['div'];
      'mat-tab-body': QwikIntrinsicElements['div'];
      'mat-tab-nav-panel': QwikIntrinsicElements['div'];
    }
  }
}
