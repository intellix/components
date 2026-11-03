import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Icon's custom-element tag name.
 * Upstream renders <mat-icon> as an actual custom element; external CMS styles
 * may target the tag directly (not just the .mat-icon class). See design spec
 * docs/superpowers/specs/2026-07-29-qwik-material-icon-port-design.md §3.1.
 * The `fontIcon` custom attribute mirrors upstream's `[attr.fontIcon]` host
 * binding; CSS renders the glyph via `[fontIcon]::before` in icon.scss. The
 * `svgIcon` custom attribute (added 2026-11-03) mirrors the literal DOM
 * attribute real Angular leaves behind for a static (non-property-bound)
 * `svgIcon="..."` template usage — see `mat-icon.tsx`'s own comment at its
 * render site.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-icon': QwikIntrinsicElements['span'] & {fontIcon?: string; svgIcon?: string};
    }
  }
}
