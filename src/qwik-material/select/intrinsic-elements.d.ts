import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for `<mat-select>`'s custom-element tag name —
 * same convention as `<mat-form-field>`/`<mat-pseudo-checkbox>`/
 * `<mat-option>`/`<mat-optgroup>` elsewhere in this project. See
 * `mat-select.tsx`.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-select': QwikIntrinsicElements['div'];
    }
  }
}
