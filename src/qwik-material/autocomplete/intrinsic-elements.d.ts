import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for `<mat-autocomplete>`'s custom-element tag name
 * — same convention as `<mat-select>`/`<mat-form-field>`/`<mat-option>`
 * elsewhere in this project. See `mat-autocomplete.tsx`'s doc comment for
 * why this renders as a permanently-empty placeholder element, a sibling of
 * the native `<input>`.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-autocomplete': QwikIntrinsicElements['div'];
    }
  }
}
