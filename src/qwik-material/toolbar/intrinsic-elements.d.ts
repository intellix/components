import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Toolbar's custom-element tag
 * names. External CMS styles may target `mat-toolbar` / `mat-toolbar-row` as
 * element selectors, not just their `.mat-toolbar` / `.mat-toolbar-row`
 * classes. See design spec
 * docs/superpowers/specs/2026-07-25-qwik-material-toolbar-port-design.md §3.1.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-toolbar': QwikIntrinsicElements['div'];
      'mat-toolbar-row': QwikIntrinsicElements['div'];
    }
  }
}
