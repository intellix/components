import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Grid List's custom-element
 * tag names. Upstream renders <mat-grid-list> and <mat-grid-tile> as actual
 * custom elements; external CMS styles may target the tags directly (not
 * just the .mat-grid-list / .mat-grid-tile classes). Typed as
 * QwikIntrinsicElements['div'] — both are block-level container elements.
 * data-mode + inline style are covered by base HTMLAttributes, no widening
 * needed. See design spec §5 deviation #10.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-grid-list': QwikIntrinsicElements['div'];
      'mat-grid-tile': QwikIntrinsicElements['div'];
    }
  }
}
