import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Chips' custom-element tag
 * names. Upstream renders `<mat-chip>`/`<mat-chip-option>`/`<mat-chip-row>`/
 * `<mat-chip-set>`/`<mat-chip-listbox>`/`<mat-chip-grid>` as actual custom
 * elements; external CMS styles may target these tags directly (not just
 * their classes). Typed as `QwikIntrinsicElements['div']` — none need any
 * custom camelCase attrs widened.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-chip': QwikIntrinsicElements['div'];
      'mat-chip-option': QwikIntrinsicElements['div'];
      'mat-chip-row': QwikIntrinsicElements['div'];
      'mat-chip-set': QwikIntrinsicElements['div'];
      'mat-chip-listbox': QwikIntrinsicElements['div'];
      'mat-chip-grid': QwikIntrinsicElements['div'];
    }
  }
}
