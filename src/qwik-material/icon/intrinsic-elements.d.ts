import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Icon's custom-element tag name.
 * Upstream renders <mat-icon> as an actual custom element; external CMS styles
 * may target the tag directly (not just the .mat-icon class). See design spec
 * docs/superpowers/specs/2026-07-29-qwik-material-icon-port-design.md §3.1.
 * The `fontIcon` custom attribute mirrors upstream's `[attr.fontIcon]` host
 * binding; CSS renders the glyph via `[fontIcon]::before` in icon.scss.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-icon': QwikIntrinsicElements['span'] & {fontIcon?: string};
    }
  }
}
