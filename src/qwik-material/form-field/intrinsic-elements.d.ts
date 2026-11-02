import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material form-field's custom-element
 * tag names (`<mat-form-field>`, `<mat-label>`, `<mat-hint>`, `<mat-error>`).
 * Upstream renders these as real custom elements; external CMS styles may
 * target the tags directly (not just their classes). Typed as
 * `QwikIntrinsicElements['div']` — no custom camelCase attrs need
 * widening (selector-marker attributes like `matformfieldlineripple` are
 * written via an object spread, which bypasses this typing entirely — see
 * `mat-form-field.tsx`).
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-form-field': QwikIntrinsicElements['div'];
      'mat-label': QwikIntrinsicElements['div'];
      'mat-hint': QwikIntrinsicElements['div'];
      'mat-error': QwikIntrinsicElements['div'];
    }
  }
}
