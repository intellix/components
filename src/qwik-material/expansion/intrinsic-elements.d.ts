import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Expansion's custom-element
 * tag names. Upstream renders each of these as actual custom elements
 * (Angular directives/components keep whatever host tag the template
 * author wrote); external CMS styles may target the tags directly, not
 * just the `.mat-expansion-*` classes. All type as
 * `QwikIntrinsicElements['div']` — no custom camelCase attrs need
 * widening.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-accordion': QwikIntrinsicElements['div'];
      'mat-expansion-panel': QwikIntrinsicElements['div'];
      'mat-expansion-panel-header': QwikIntrinsicElements['div'];
      'mat-panel-title': QwikIntrinsicElements['div'];
      'mat-panel-description': QwikIntrinsicElements['div'];
      'mat-action-row': QwikIntrinsicElements['div'];
    }
  }
}
