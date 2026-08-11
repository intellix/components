import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Button Toggle's custom-element
 * tag names. Upstream renders <mat-button-toggle-group> and <mat-button-toggle>
 * as actual custom elements; external CMS styles may target the tags directly
 * (not just the .mat-button-toggle-* classes). Both type as
 * QwikIntrinsicElements['div'] — no custom camelCase attrs need widening
 * (unlike grid-list's cols/rowspan/colspan). See design spec §5 deviation #10.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-button-toggle-group': QwikIntrinsicElements['div'];
      'mat-button-toggle': QwikIntrinsicElements['div'];
    }
  }
}
