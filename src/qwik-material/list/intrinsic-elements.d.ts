import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material List's custom-element tag
 * names. Upstream renders <mat-list>, <mat-nav-list>, <mat-action-list>,
 * and <mat-list-item> (its `div` selector variant) as actual custom
 * elements; external CMS styles may target the tags directly (not just the
 * .mat-mdc-list-* classes). All 4 type as QwikIntrinsicElements['div'] — no
 * custom camelCase attrs need widening (unlike grid-list's
 * cols/rowspan/colspan).
 *
 * `mat-subheader` and the 5 list-item section directives
 * (avatar/icon/title/line/meta) are NOT custom elements upstream — they're
 * attribute directives applied to the consumer's own element — so
 * `MatSubheader` / `MatListItemAvatar` / etc. render a polymorphic `as`
 * host (default `div`) instead of inventing a tag here.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-list': QwikIntrinsicElements['div'];
      'mat-nav-list': QwikIntrinsicElements['div'];
      'mat-action-list': QwikIntrinsicElements['div'];
      'mat-list-item': QwikIntrinsicElements['div'];
    }
  }
}
