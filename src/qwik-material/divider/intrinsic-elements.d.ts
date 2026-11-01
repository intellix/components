import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Divider's custom-element tag
 * name. Upstream renders <mat-divider> as an actual custom element; external
 * CMS styles may target the tag directly (not just the .mat-divider class).
 * Typed as QwikIntrinsicElements['hr'] because <hr> is the closest semantic
 * HTML element (an <hr> IS a separator in HTML). See design spec
 * docs/superpowers/specs/2026-07-31-qwik-material-divider-port-design.md
 * §3.4 + §6 deviation #6.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-divider': QwikIntrinsicElements['hr'];
    }
  }
}
