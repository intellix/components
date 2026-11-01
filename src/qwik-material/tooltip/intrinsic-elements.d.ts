import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Tooltip's custom-element tag
 * name. Upstream renders `<mat-tooltip-component>` as an actual custom
 * element (the tooltip panel's own host); external CMS styles may target
 * the tag directly (not just `.mat-mdc-tooltip-panel` / `.mat-mdc-tooltip`).
 * Typed as `QwikIntrinsicElements['div']` — no custom camelCase attrs need
 * widening.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-tooltip-component': QwikIntrinsicElements['div'];
    }
  }
}
