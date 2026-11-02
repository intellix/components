import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Slide Toggle's custom-element
 * tag name. Upstream renders <mat-slide-toggle> as an actual custom element;
 * external CMS styles may target the tag directly (not just the
 * .mat-mdc-slide-toggle class). Types as QwikIntrinsicElements['div'] — no
 * custom camelCase attrs need widening.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-slide-toggle': QwikIntrinsicElements['div'];
    }
  }
}
