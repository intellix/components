import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material List's custom-element tag
 * names. Upstream renders <mat-list>, <mat-nav-list>, <mat-action-list>,
 * <mat-list-item>, and <mat-subheader> as actual custom elements; external
 * CMS styles may target the tags directly (not just the .mat-mdc-list-*
 * classes). All 5 type as QwikIntrinsicElements['div'] — no custom
 * camelCase attrs need widening (unlike grid-list's cols/rowspan/colspan).
 * See design spec §5 deviation #9.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-list': QwikIntrinsicElements['div'];
      'mat-nav-list': QwikIntrinsicElements['div'];
      'mat-action-list': QwikIntrinsicElements['div'];
      'mat-list-item': QwikIntrinsicElements['div'];
      'mat-subheader': QwikIntrinsicElements['div'];
    }
  }
}
