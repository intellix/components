import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Checkbox's custom-element tag
 * name. Upstream renders <mat-checkbox> as an actual custom element; external
 * CMS styles may target the tag directly (not just the .mat-mdc-checkbox
 * class). Types as QwikIntrinsicElements['div'] — no custom camelCase attrs
 * need widening.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-checkbox': QwikIntrinsicElements['div'];
    }
  }
}
