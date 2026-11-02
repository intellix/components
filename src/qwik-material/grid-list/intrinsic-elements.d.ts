import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Grid List's custom-element
 * tag names. Upstream renders `<mat-grid-list>`, `<mat-grid-tile>`,
 * `<mat-grid-tile-header>` and `<mat-grid-tile-footer>` as actual custom
 * elements; external CMS styles may target the tags directly (not just the
 * `.mat-grid-list` / `.mat-grid-tile` / … classes). Typed as
 * `QwikIntrinsicElements['div']` — all are block-level container elements.
 *
 * `mat-grid-list` widens with `cols?: number` — upstream reflects `cols` as
 * a host attribute via `[attr.cols]` (mat-grid-list.tsx), and `cols` is not
 * part of the div attribute set. Same widening pattern as
 * progress-bar/progress-spinner's `& {mode?: string}`.
 *
 * `mat-grid-tile` widens with `rowspan?: number` and `colspan?: number` —
 * upstream's `[attr.rowspan]` / `[attr.colspan]` host bindings
 * (mat-grid-tile.tsx), same pattern.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-grid-list': QwikIntrinsicElements['div'] & {cols?: number};
      'mat-grid-tile': QwikIntrinsicElements['div'] & {rowspan?: number; colspan?: number};
      'mat-grid-tile-header': QwikIntrinsicElements['div'];
      'mat-grid-tile-footer': QwikIntrinsicElements['div'];
    }
  }
}
